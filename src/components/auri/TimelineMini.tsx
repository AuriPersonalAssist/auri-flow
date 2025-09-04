/**
 * Auri Mini Timeline Component - Visual representation of daily priority flow
 */

import { motion } from 'framer-motion';
import type { Task } from '@/lib/engine/types';
import { cn } from '@/lib/utils';

interface TimelineMiniProps {
  tasks: Task[];
  currentTime?: Date;
  className?: string;
}

interface TimelinePoint {
  id: string;
  title: string;
  time: number; // Hour of day (0-24)
  priority: number;
  type: string;
  completed: boolean;
}

const generateTimelinePoints = (tasks: Task[], currentTime: Date): TimelinePoint[] => {
  const now = currentTime.getHours() + currentTime.getMinutes() / 60;
  
  return tasks
    .filter(task => task.start && !task.completed)
    .map(task => {
      const startTime = new Date(task.start!);
      const timeOfDay = startTime.getHours() + startTime.getMinutes() / 60;
      
      return {
        id: task.id,
        title: task.title,
        time: timeOfDay,
        priority: task.priorityScore || 0,
        type: task.type,
        completed: task.completed || false
      };
    })
    .sort((a, b) => a.time - b.time);
};

const getPointColor = (type: string, priority: number): string => {
  const baseColors = {
    estudo: 'bg-blue-500',
    treino: 'bg-green-500', 
    sono: 'bg-purple-500',
    leitura: 'bg-amber-500',
    pontual: 'bg-gray-500',
    outro: 'bg-gray-500'
  };
  
  const baseColor = baseColors[type as keyof typeof baseColors] || baseColors.outro;
  
  // High priority tasks get gold accent
  if (priority > 30) {
    return 'bg-accent border-accent';
  }
  
  return `${baseColor} border-white`;
};

export const TimelineMini: React.FC<TimelineMiniProps> = ({
  tasks,
  currentTime = new Date(),
  className
}) => {
  console.log('[Auri::TimelineMini] Rendering timeline for', tasks.length, 'tasks');

  const points = generateTimelinePoints(tasks, currentTime);
  const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;
  
  // Timeline spans from 6 AM to 11 PM (17 hours)
  const startHour = 6;
  const endHour = 23;
  const timelineWidth = endHour - startHour;

  const getPositionPercent = (hour: number): number => {
    const clampedHour = Math.max(startHour, Math.min(endHour, hour));
    return ((clampedHour - startHour) / timelineWidth) * 100;
  };

  if (points.length === 0) {
    return (
      <div className={cn('p-4', className)}>
        <div className="text-center text-sm text-muted-foreground">
          Nenhuma tarefa agendada para hoje
        </div>
      </div>
    );
  }

  return (
    <div className={cn('p-4 space-y-4', className)}>
      {/* Timeline Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-sora font-medium text-primary">Timeline do Dia</h4>
        <span className="text-xs text-muted-foreground">
          {currentTime.toLocaleDateString('pt-BR')}
        </span>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Base line */}
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-0 timeline-line"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Current time indicator */}
        <motion.div
          className="absolute top-0 w-1 h-2 bg-red-500 rounded-full transform -translate-x-0.5"
          style={{ left: `${getPositionPercent(currentHour)}%` }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
        />

        {/* Task points */}
        {points.map((point, index) => (
          <motion.div
            key={point.id}
            className="absolute top-1/2 transform -translate-y-1/2 group cursor-pointer"
            style={{ left: `${getPositionPercent(point.time)}%` }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.2 }}
            transition={{ 
              delay: index * 0.1 + 0.5,
              type: 'spring',
              stiffness: 300 
            }}
          >
            <div 
              className={cn(
                'timeline-point',
                getPointColor(point.type, point.priority),
                'relative z-10'
              )}
            />
            
            {/* Tooltip */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
              <div className="bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                <div className="font-medium">{point.title}</div>
                <div className="text-gray-300">
                  {Math.floor(point.time)}:{String(Math.floor((point.time % 1) * 60)).padStart(2, '0')}
                </div>
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Time labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>6h</span>
        <span>12h</span>
        <span>18h</span>
        <span>23h</span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-muted-foreground">Alta prioridade</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">Estudo</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-muted-foreground">Treino</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1 h-2 bg-red-500 rounded-full" />
          <span className="text-muted-foreground">Agora</span>
        </div>
      </div>
    </div>
  );
};