/**
 * Auri MVP - Premium Personal Assistant Home Page
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Settings, Calendar, CheckSquare, List, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuriStore } from '@/lib/store/auriStore';
import { CardStack } from '@/components/auri/CardStack';
import { ChatInput } from '@/components/auri/ChatInput';
import { TimelineMini } from '@/components/auri/TimelineMini';
import { OnboardingModal } from '@/components/auri/OnboardingModal';
import { cn } from '@/lib/utils';

const Index = () => {
  const { 
    tasks, 
    preferences, 
    onboardingComplete,
    addTask,
    completeTask,
    updateTask,
    completeOnboarding,
    recalculatePriorities
  } = useAuriStore();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Recalculate priorities on mount and periodically
  useEffect(() => {
    if (onboardingComplete) {
      recalculatePriorities();
    }
  }, [onboardingComplete, recalculatePriorities]);

  const getGreeting = (): string => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const getMotivationalMessage = (): string => {
    const activeTasks = tasks.filter(t => !t.completed);
    if (activeTasks.length === 0) {
      return "Você está em dia com suas tarefas! ✨";
    }
    if (activeTasks.length === 1) {
      return "Uma tarefa aguardando sua atenção.";
    }
    return `${activeTasks.length} tarefas organizadas por prioridade.`;
  };

  const handleTaskCreate = (taskData: Parameters<typeof addTask>[0]) => {
    console.log('[Auri::Index] Creating new task:', taskData);
    addTask(taskData);
  };

  const handleTaskComplete = (id: string) => {
    console.log('[Auri::Index] Completing task:', id);
    completeTask(id);
    
    const task = tasks.find(t => t.id === id);
    if (task) {
      toast({
        title: "Tarefa concluída! 🎉",
        description: `"${task.title}" foi marcada como concluída.`,
      });
    }
  };

  const handleTaskEdit = (id: string) => {
    console.log('[Auri::Index] Edit requested for task:', id);
    // TODO: Implement task editing modal
    toast({
      title: "Em desenvolvimento",
      description: "A edição de tarefas será implementada em breve.",
    });
  };

  const handleTaskSchedule = (id: string) => {
    console.log('[Auri::Index] Schedule requested for task:', id);
    // TODO: Implement task scheduling
    toast({
      title: "Em desenvolvimento", 
      description: "O agendamento de tarefas será implementado em breve.",
    });
  };

  return (
    <>
      {/* Onboarding Modal */}
      <OnboardingModal
        open={!onboardingComplete}
        onComplete={completeOnboarding}
      />

      {/* Main App */}
      <div className="min-h-screen bg-gradient-subtle">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-luxury flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-sora font-bold text-xl text-primary">Auri</h1>
                  <p className="text-xs text-muted-foreground">Assistente Pessoal Premium</p>
                </div>
              </motion.div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  Agenda
                </Button>
                <Button variant="outline" size="sm">
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Listas
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Config
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Welcome Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <h2 className="font-sora text-3xl font-semibold text-primary">
              {getGreeting()}! ✨
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {getMotivationalMessage()}
            </p>
          </motion.section>

          {/* Chat Input */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto"
          >
            <div className="card-luxury p-6">
              <ChatInput onTaskCreate={handleTaskCreate} />
            </div>
          </motion.section>

          {/* Task Cards */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-sora text-xl font-semibold text-primary">
                Suas Prioridades
              </h3>
              {tasks.filter(t => !t.completed).length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={recalculatePriorities}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Recalcular
                </Button>
              )}
            </div>

            <CardStack
              tasks={tasks}
              maxCards={5}
              onTaskComplete={handleTaskComplete}
              onTaskEdit={handleTaskEdit}
              onTaskSchedule={handleTaskSchedule}
            />
          </motion.section>

          {/* Timeline */}
          {tasks.some(t => t.start && !t.completed) && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              <div className="card-luxury">
                <TimelineMini tasks={tasks} currentTime={currentTime} />
              </div>
            </motion.section>
          )}

          {/* Quick Stats */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto"
          >
            <div className="card-luxury p-6 text-center">
              <div className="text-2xl font-bold text-accent mb-2">
                {tasks.filter(t => !t.completed).length}
              </div>
              <div className="text-sm text-muted-foreground">Tarefas Ativas</div>
            </div>
            
            <div className="card-luxury p-6 text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {tasks.filter(t => t.completed).length}
              </div>
              <div className="text-sm text-muted-foreground">Concluídas</div>
            </div>
            
            <div className="card-luxury p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-2">
                {tasks.filter(t => t.start && !t.completed).length}
              </div>
              <div className="text-sm text-muted-foreground">Agendadas</div>
            </div>
          </motion.section>
        </main>

        {/* Footer */}
        <footer className="bg-white/50 backdrop-blur-sm border-t border-border/50 mt-16">
          <div className="container mx-auto px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Auri MVP • Dados armazenados localmente • 
              <span className="text-accent ml-1">Privacidade em primeiro lugar</span>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;
