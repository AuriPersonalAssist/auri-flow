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
import { parseTask, isTaskComplete, toTask } from '@/lib/nlp/parse';
import { useAuriStore } from '@/lib/store/auriStore';
import { copy } from '@/lib/copy';
import { inputVariants } from '@/lib/ui/Motion';

interface ChatInputProps {
  onSubmit?: (input: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
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

export const ChatInput: React.FC<ChatInputProps> = ({
  onSubmit,
  placeholder = copy.input.placeholder,
  disabled = false,
  className
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [parsedTask, setParsedTask] = useState<any>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const { addTask } = useAuriStore();

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
    if (!input.trim() || isProcessing) return;

    console.log('[Auri::ChatInput] Submitting:', input);
    setIsProcessing(true);
    
    try {
      const parsed = parseTask(input.trim());
      
      if (isTaskComplete(parsed)) {
        // Task is complete, add directly
        const task = toTask(parsed);
        addTask(task);
        setInput('');
        
        toast({
          title: copy.actions.organized,
          description: copy.confirmations.task,
        });
      } else {
        // Need confirmation
        setParsedTask(parsed);
        setShowConfirmation(true);
      }
      
      await onSubmit?.(input.trim());
    } catch (error) {
      console.error('[Auri::ChatInput] Submit error:', error);
      toast({
        title: copy.errors.generic,
        description: copy.errors.parse,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmTask = () => {
    if (parsedTask) {
      const task = toTask(parsedTask);
      addTask(task);
      setInput('');
      setShowConfirmation(false);
      setParsedTask(null);
      
      toast({
        title: copy.actions.organized,
        description: copy.confirmations.task,
      });
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
        <motion.div
          variants={inputVariants}
          initial="idle"
          animate={isListening ? "recording" : "idle"}
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[100px] pr-24 resize-none border-aurigold/20 focus:border-aurigold/50 rounded-2xl font-sans backdrop-blur-sm bg-background/80"
            disabled={isListening || isProcessing || disabled}
          />
        </motion.div>
        
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
                  disabled={isProcessing || disabled}
                  className={cn(
                    "hover-lift",
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
            disabled={!input.trim() || isListening || isProcessing || disabled}
            className="bg-aurigold hover:bg-aurigold/90 text-auriblue hover-lift"
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
              {copy.input.voicePlaceholder}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmation && parsedTask && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card rounded-2xl p-4 border border-aurigold/20"
          >
            <h3 className="font-display font-semibold text-lg mb-2">
              {parsedTask.title}
            </h3>
            <div className="flex gap-2 mb-4">
              <span className="px-2 py-1 bg-aurigold/10 text-aurigold rounded-lg text-sm">
                {copy.taskTypes[parsedTask.type] || parsedTask.type}
              </span>
              {parsedTask.durationMin && (
                <span className="px-2 py-1 bg-muted rounded-lg text-sm">
                  {parsedTask.durationMin}min
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleConfirmTask}
                className="bg-aurigold hover:bg-aurigold/90 text-auriblue"
              >
                Confirmar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmation(false)}
              >
                Cancelar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Suggestions */}
      <div className="flex flex-wrap gap-2">
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-aurigold hover:text-auriblue transition-colors"
          onClick={() => setInput('Estudar matemática por 2 horas às 14h')}
        >
          <Sparkles className="w-3 h-3 mr-1" />
          Estudar matemática
        </Badge>
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-aurigold hover:text-auriblue transition-colors"
          onClick={() => setInput('Treino na academia por 1 hora às 7h')}
        >
          <Sparkles className="w-3 h-3 mr-1" />
          Treino
        </Badge>
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-aurigold hover:text-auriblue transition-colors"
          onClick={() => setInput('Ler 20 páginas do livro por 40 minutos')}
        >
          <Sparkles className="w-3 h-3 mr-1" />
          Leitura
        </Badge>
      </div>
    </div>
  );
};