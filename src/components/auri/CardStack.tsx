/**
 * Auri Card Stack Component - Responsive card layout with priority ordering
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Card3D } from './Card3D';
import type { Task } from '@/lib/engine/types';
import { cn } from '@/lib/utils';

interface CardStackProps {
  tasks: Task[];
  maxCards?: number;
  onTaskComplete?: (id: string) => void;
  onTaskEdit?: (id: string) => void;
  onTaskSchedule?: (id: string) => void;
  className?: string;
}

export const CardStack: React.FC<CardStackProps> = ({
  tasks,
  maxCards = 5,
  onTaskComplete,
  onTaskEdit,
  onTaskSchedule,
  className
}) => {
  console.log('[Auri::CardStack] Rendering stack with', tasks.length, 'tasks');

  // Filter completed tasks and take top priority tasks
  const activeTasks = tasks
    .filter(task => !task.completed)
    .slice(0, maxCards);

  if (activeTasks.length === 0) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-gold flex items-center justify-center"
          >
            <span className="text-2xl">✨</span>
          </motion.div>
          <h3 className="font-sora font-semibold text-lg text-primary mb-2">
            Tudo em dia!
          </h3>
          <p className="text-muted-foreground">
            Você não tem tarefas pendentes no momento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <AnimatePresence mode="popLayout">
        <motion.div 
          className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          layout
        >
          {activeTasks.map((task, index) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ 
                layout: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.3 },
                scale: { duration: 0.3 }
              }}
            >
              <Card3D
                task={task}
                index={index}
                isActive={index === 0} // First card is always active
                onComplete={onTaskComplete}
                onEdit={onTaskEdit}
                onSchedule={onTaskSchedule}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Show count if there are more tasks */}
      {tasks.filter(t => !t.completed).length > maxCards && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center pt-4"
        >
          <p className="text-sm text-muted-foreground">
            E mais {tasks.filter(t => !t.completed).length - maxCards} tarefa(s) na sua lista
          </p>
        </motion.div>
      )}
    </div>
  );
};