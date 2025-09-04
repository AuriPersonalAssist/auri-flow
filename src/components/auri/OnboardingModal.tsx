/**
 * Auri Onboarding Modal - Initial setup for user preferences
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Dumbbell, BookOpen, Moon, Play, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { WeeklyAnchor } from '@/lib/engine/types';
import { cn } from '@/lib/utils';

interface OnboardingModalProps {
  open: boolean;
  onComplete: (weights: { wd: number; wf: number; wm: number }, anchors: WeeklyAnchor[]) => void;
}

interface PillarWeights {
  wd: number; // Desenvolvimento
  wf: number; // Físico
  wm: number; // Mental
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const normalizeWeights = (weights: PillarWeights): PillarWeights => {
  const total = weights.wd + weights.wf + weights.wm;
  if (total === 0) return { wd: 0.33, wf: 0.33, wm: 0.34 };
  
  return {
    wd: weights.wd / total,
    wf: weights.wf / total,
    wm: weights.wm / total
  };
};

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  open,
  onComplete
}) => {
  const [step, setStep] = useState(1);
  const [weights, setWeights] = useState<PillarWeights>({ wd: 40, wf: 30, wm: 30 });
  const [anchors, setAnchors] = useState<WeeklyAnchor[]>([
    {
      type: 'sono',
      startTime: '23:00',
      duration: 480, // 8 horas
      days: [0, 1, 2, 3, 4, 5, 6],
      active: true
    },
    {
      type: 'treino',
      startTime: '07:00',
      duration: 60,
      days: [1, 3, 5], // Segunda, quarta, sexta
      active: false
    },
    {
      type: 'estudo',
      startTime: '14:00',
      duration: 120,
      days: [1, 2, 3, 4, 5], // Segunda a sexta
      active: false
    }
  ]);

  const updateAnchor = (type: WeeklyAnchor['type'], updates: Partial<WeeklyAnchor>) => {
    setAnchors(prev => prev.map(anchor => 
      anchor.type === type ? { ...anchor, ...updates } : anchor
    ));
  };

  const toggleAnchorDay = (type: WeeklyAnchor['type'], day: number) => {
    setAnchors(prev => prev.map(anchor => {
      if (anchor.type === type) {
        const newDays = anchor.days.includes(day)
          ? anchor.days.filter(d => d !== day)
          : [...anchor.days, day].sort();
        return { ...anchor, days: newDays };
      }
      return anchor;
    }));
  };

  const handleComplete = () => {
    console.log('[Auri::Onboarding] Completing onboarding with:', { weights, anchors });
    
    const normalizedWeights = normalizeWeights(weights);
    const activeAnchors = anchors.filter(anchor => anchor.active);
    
    onComplete(normalizedWeights, activeAnchors);
  };

  const WeightSlider = ({ 
    label, 
    value, 
    color, 
    icon: Icon, 
    onChange 
  }: { 
    label: string; 
    value: number; 
    color: string; 
    icon: any; 
    onChange: (value: number) => void; 
  }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-lg', color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <Label className="font-medium">{label}</Label>
          <div className="text-sm text-muted-foreground">
            {value}% de importância
          </div>
        </div>
        <Badge variant="outline" className="px-3">
          {value}%
        </Badge>
      </div>
      <Slider
        value={[value]}
        onValueChange={([val]) => onChange(val)}
        max={100}
        step={5}
        className="w-full"
      />
    </div>
  );

  return (
    <Dialog open={open} modal>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center font-sora text-2xl">
            Bem-vindo ao Auri ✨
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-gradient-gold rounded-full flex items-center justify-center">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-sora font-semibold text-xl">
                  Configure seus pilares pessoais
                </h3>
                <p className="text-muted-foreground">
                  Ajude o Auri a entender o que é mais importante para você. 
                  Estes pesos influenciarão como suas tarefas são priorizadas.
                </p>
              </div>

              <div className="space-y-6">
                <WeightSlider
                  label="Desenvolvimento"
                  value={weights.wd}
                  color="bg-blue-500"
                  icon={Brain}
                  onChange={(val) => setWeights(prev => ({ ...prev, wd: val }))}
                />
                
                <WeightSlider
                  label="Físico"
                  value={weights.wf}
                  color="bg-green-500"
                  icon={Dumbbell}
                  onChange={(val) => setWeights(prev => ({ ...prev, wf: val }))}
                />
                
                <WeightSlider
                  label="Mental"
                  value={weights.wm}
                  color="bg-purple-500"
                  icon={BookOpen}
                  onChange={(val) => setWeights(prev => ({ ...prev, wm: val }))}
                />
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Total: {weights.wd + weights.wf + weights.wm}% 
                (será normalizado automaticamente)
              </div>

              <Button 
                onClick={() => setStep(2)} 
                className="w-full btn-luxury"
              >
                <Play className="w-4 h-4 mr-2" />
                Continuar
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-gradient-luxury rounded-full flex items-center justify-center">
                  <Moon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-sora font-semibold text-xl">
                  Âncoras semanais
                </h3>
                <p className="text-muted-foreground">
                  Configure suas rotinas fixas. O Auri organizará outras tarefas 
                  respeitando estes horários.
                </p>
              </div>

              <div className="space-y-6">
                {anchors.map((anchor) => (
                  <div key={anchor.type} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'p-2 rounded-lg',
                          anchor.type === 'sono' && 'bg-purple-500',
                          anchor.type === 'treino' && 'bg-green-500',
                          anchor.type === 'estudo' && 'bg-blue-500'
                        )}>
                          {anchor.type === 'sono' && <Moon className="w-4 h-4 text-white" />}
                          {anchor.type === 'treino' && <Dumbbell className="w-4 h-4 text-white" />}
                          {anchor.type === 'estudo' && <BookOpen className="w-4 h-4 text-white" />}
                        </div>
                        <div>
                          <Label className="font-medium capitalize">
                            {anchor.type}
                          </Label>
                          <div className="text-sm text-muted-foreground">
                            {Math.floor(anchor.duration / 60)}h{anchor.duration % 60 > 0 ? `${anchor.duration % 60}m` : ''}
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={anchor.active}
                        onCheckedChange={(checked) => 
                          updateAnchor(anchor.type, { active: checked })
                        }
                      />
                    </div>

                    {anchor.active && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Horário de início</Label>
                            <Input
                              type="time"
                              value={anchor.startTime}
                              onChange={(e) => 
                                updateAnchor(anchor.type, { startTime: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <Label>Duração (minutos)</Label>
                            <Input
                              type="number"
                              value={anchor.duration}
                              onChange={(e) => 
                                updateAnchor(anchor.type, { duration: parseInt(e.target.value) || 60 })
                              }
                              min="15"
                              step="15"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Dias da semana</Label>
                          <div className="flex gap-2 mt-2">
                            {DAYS.map((day, index) => (
                              <Button
                                key={index}
                                size="sm"
                                variant={anchor.days.includes(index) ? "default" : "outline"}
                                onClick={() => toggleAnchorDay(anchor.type, index)}
                                className="w-12 h-8 p-0"
                              >
                                {day}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button 
                  onClick={handleComplete}
                  className="flex-1 btn-gold"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Finalizar
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};