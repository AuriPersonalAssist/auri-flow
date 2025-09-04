/**
 * Auri Chat Input Component - Voice and text input with smart parsing
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Task, TaskType, PillarBenefits } from '@/lib/engine/types';
import { DEFAULTS } from '@/lib/engine/calibration';

interface ChatInputProps {
  onTaskCreate: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'priorityScore'>) => void;
  placeholder?: string;
  className?: string;
}

interface ParsedInput {
  title: string;
  description?: string;
  type: TaskType;
  durationMin?: number;
  effort?: number;
  startTime?: string;
  endTime?: string;
  benefits: PillarBenefits;
  confidence: number; // 0-1
}

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: any) => any) | null;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new(): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new(): SpeechRecognition;
    };
  }
}

const parseNaturalInput = (input: string): ParsedInput => {
  console.log('[Auri::ChatInput] Parsing input:', input);
  
  const lowercaseInput = input.toLowerCase();
  
  // Extract task type
  let type: TaskType = 'outro';
  if (lowercaseInput.includes('estudar') || lowercaseInput.includes('estudo') || lowercaseInput.includes('prova')) {
    type = 'estudo';
  } else if (lowercaseInput.includes('treino') || lowercaseInput.includes('academia') || lowercaseInput.includes('exercício')) {
    type = 'treino';
  } else if (lowercaseInput.includes('dormir') || lowercaseInput.includes('sono') || lowercaseInput.includes('descansar')) {
    type = 'sono';
  } else if (lowercaseInput.includes('ler') || lowercaseInput.includes('leitura') || lowercaseInput.includes('livro')) {
    type = 'leitura';
  }
  
  // Extract duration (look for patterns like "2 horas", "30 minutos", "1h30m")
  let durationMin: number | undefined;
  const durationPatterns = [
    /(\d+)\s*h(?:oras?)?\s*(?:e\s*)?(\d+)?\s*m(?:inutos?)?/i,
    /(\d+)\s*horas?/i,
    /(\d+)\s*minutos?/i,
    /(\d+)\s*min/i
  ];
  
  for (const pattern of durationPatterns) {
    const match = input.match(pattern);
    if (match) {
      if (pattern.source.includes('h.*m')) {
        // Format like "2h30m"
        const hours = parseInt(match[1]) || 0;
        const minutes = parseInt(match[2]) || 0;
        durationMin = hours * 60 + minutes;
      } else if (pattern.source.includes('horas')) {
        // Format like "2 horas"
        durationMin = (parseInt(match[1]) || 0) * 60;
      } else {
        // Format like "30 minutos"
        durationMin = parseInt(match[1]) || 0;
      }
      break;
    }
  }
  
  // Extract time (look for patterns like "às 14:30", "14h", "2 da tarde")
  let startTime: string | undefined;
  const timePatterns = [
    /(?:às\s*)?(\d{1,2}):(\d{2})/i,
    /(?:às\s*)?(\d{1,2})h(\d{2})?/i,
    /(\d{1,2})\s*da\s*(manhã|tarde|noite)/i
  ];
  
  for (const pattern of timePatterns) {
    const match = input.match(pattern);
    if (match) {
      let hours = parseInt(match[1]) || 0;
      const minutes = parseInt(match[2]) || 0;
      
      if (match[3]) {
        // Handle "da tarde", "da noite"
        const period = match[3];
        if (period === 'tarde' && hours < 12) hours += 12;
        if (period === 'noite' && hours < 12) hours += 12;
        if (period === 'manhã' && hours === 12) hours = 0;
      }
      
      const today = new Date();
      today.setHours(hours, minutes, 0, 0);
      startTime = today.toISOString();
      break;
    }
  }
  
  // Extract effort level (look for words indicating difficulty)
  let effort = 5; // Default medium effort
  if (lowercaseInput.includes('fácil') || lowercaseInput.includes('simples') || lowercaseInput.includes('rápido')) {
    effort = 3;
  } else if (lowercaseInput.includes('difícil') || lowercaseInput.includes('complexo') || lowercaseInput.includes('desafiador')) {
    effort = 8;
  } else if (lowercaseInput.includes('muito difícil') || lowercaseInput.includes('impossível')) {
    effort = 10;
  }
  
  // Get default benefits for task type
  const benefits = DEFAULTS.defaultBenefits[type] || DEFAULTS.defaultBenefits.outro;
  
  // Clean title (remove time and duration info)
  let title = input;
  durationPatterns.forEach(pattern => {
    title = title.replace(pattern, '');
  });
  timePatterns.forEach(pattern => {
    title = title.replace(pattern, '');
  });
  title = title.replace(/\b(às|por|durante|fácil|difícil|simples|complexo)\b/gi, '');
  title = title.trim().replace(/\s+/g, ' ');
  
  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);
  
  // Calculate confidence based on what we found
  let confidence = 0.5;
  if (type !== 'outro') confidence += 0.2;
  if (durationMin) confidence += 0.2;
  if (startTime) confidence += 0.1;
  
  const result: ParsedInput = {
    title,
    type,
    durationMin,
    effort,
    startTime,
    endTime: startTime && durationMin ? 
      new Date(new Date(startTime).getTime() + durationMin * 60000).toISOString() : 
      undefined,
    benefits,
    confidence: Math.min(1, confidence)
  };
  
  console.log('[Auri::ChatInput] Parsed result:', result);
  return result;
};

export const ChatInput: React.FC<ChatInputProps> = ({
  onTaskCreate,
  placeholder = "Diga o que precisa, eu organizo ✨",
  className
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';
      
      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setInput(transcript);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.onerror = (event) => {
        console.error('[Auri::ChatInput] Speech recognition error:', event);
        setIsListening(false);
        toast({
          title: "Erro no reconhecimento de voz",
          description: "Não foi possível capturar o áudio. Tente novamente.",
          variant: "destructive"
        });
      };
      
      recognitionRef.current = recognition;
    }
  }, [toast]);

  const startListening = () => {
    if (recognitionRef.current && speechSupported) {
      setIsListening(true);
      setInput('');
      recognitionRef.current.start();
      
      toast({
        title: "Ouvindo...",
        description: "Pode falar! Diga o que precisa fazer.",
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setIsProcessing(true);
    
    try {
      console.log('[Auri::ChatInput] Processing input:', input);
      
      const parsed = parseNaturalInput(input.trim());
      
      if (!parsed.title) {
        toast({
          title: "Não consegui entender",
          description: "Tente descrever a tarefa de forma mais clara.",
          variant: "destructive"
        });
        return;
      }

      const newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'priorityScore'> = {
        title: parsed.title,
        description: parsed.description,
        type: parsed.type,
        durationMin: parsed.durationMin,
        effort: parsed.effort,
        start: parsed.startTime,
        end: parsed.endTime,
        benefits: parsed.benefits,
        completed: false,
        money: 0
      };

      onTaskCreate(newTask);
      setInput('');
      
      toast({
        title: "Tarefa criada!",
        description: `"${parsed.title}" foi adicionada à sua lista com prioridade calculada.`,
      });
      
    } catch (error) {
      console.error('[Auri::ChatInput] Error processing input:', error);
      toast({
        title: "Erro ao processar",
        description: "Não foi possível criar a tarefa. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Input Area */}
      <div className="relative">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[100px] pr-24 resize-none border-accent/20 focus:border-accent"
          disabled={isListening || isProcessing}
        />
        
        {/* Voice/Send Button */}
        <div className="absolute bottom-3 right-3 flex gap-2">
          <AnimatePresence>
            {speechSupported && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Button
                  size="sm"
                  variant={isListening ? "default" : "outline"}
                  onClick={isListening ? stopListening : startListening}
                  disabled={isProcessing}
                  className={cn(
                    isListening && "bg-red-500 hover:bg-red-600 text-white"
                  )}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!input.trim() || isListening || isProcessing}
            className="bg-accent hover:bg-accent/90"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Voice Indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200"
          >
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm text-red-700 font-medium">
              Ouvindo... (clique para parar)
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Suggestions */}
      <div className="flex flex-wrap gap-2">
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
          onClick={() => setInput('Estudar matemática por 2 horas às 14h')}
        >
          <Sparkles className="w-3 h-3 mr-1" />
          Estudar matemática
        </Badge>
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
          onClick={() => setInput('Treino na academia por 1 hora às 7h')}
        >
          <Sparkles className="w-3 h-3 mr-1" />
          Treino
        </Badge>
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
          onClick={() => setInput('Ler 20 páginas do livro por 40 minutos')}
        >
          <Sparkles className="w-3 h-3 mr-1" />
          Leitura
        </Badge>
      </div>
    </div>
  );
};