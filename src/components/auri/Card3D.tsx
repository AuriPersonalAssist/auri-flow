/**
 * Auri 3D Card Component - Premium task card with parallax effects
 */

import { motion } from 'framer-motion';
import { Clock, Zap, DollarSign, CheckCircle, Edit3, Calendar } from 'lucide-react';
import type { Task } from '@/lib/engine/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Card3DProps {
  task: Task;
  index: number;
  isActive?: boolean;
  onComplete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onSchedule?: (id: string) => void;
  className?: string;
}

const getPillarColor = (type: string) => {
  switch (type) {
    case 'estudo':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'treino':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'sono':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'leitura':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatDuration = (minutes?: number): string => {
  if (!minutes) return '--';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
};

const formatTime = (isoString?: string): string => {
  if (!isoString) return '--:--';
  return new Date(isoString).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const Card3D: React.FC<Card3DProps> = ({
  task,
  index,
  isActive = false,
  onComplete,
  onEdit,
  onSchedule,
  className
}) => {
  console.log('[Auri::Card3D] Rendering card for:', task.title);

  const priorityScore = task.priorityScore || 0;
  const priorityPercent = Math.min(100, Math.max(0, (priorityScore / 50) * 100)); // Normalize to 0-100%

  return (
    <motion.div
      className={cn(
        'card-luxury card-3d relative overflow-hidden',
        'min-h-[200px] p-6 cursor-pointer group',
        isActive && 'ring-2 ring-accent shadow-[var(--shadow-elevated)]',
        className
      )}
      initial={{ opacity: 0, y: 20, rotateX: -15 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        rotateX: 0,
        scale: isActive ? 1.02 : 1
      }}
      whileHover={{ 
        scale: 1.03, 
        rotateX: 2, 
        rotateY: -2,
        transition: { type: 'spring', stiffness: 300, damping: 30 }
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        delay: index * 0.1, 
        duration: 0.6,
        type: 'spring',
        stiffness: 100,
        damping: 15
      }}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
    >
      {/* Gold accent border - appears on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl border-2 border-accent opacity-0 group-hover:opacity-100"
        transition={{ duration: 0.3 }}
      />
      
      {/* Priority score indicator */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-2xl overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-muted via-accent to-primary"
          initial={{ width: 0 }}
          animate={{ width: `${priorityPercent}%` }}
          transition={{ delay: index * 0.1 + 0.3, duration: 1 }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-sora font-semibold text-lg text-primary mb-2 leading-tight">
              {task.title}
            </h3>
            
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
          
          <Badge className={cn('ml-3 shrink-0', getPillarColor(task.type))}>
            {task.type}
          </Badge>
        </div>

        {/* Metrics */}
        <div className="flex flex-wrap gap-3 mb-4 text-sm text-muted-foreground">
          {task.durationMin && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatDuration(task.durationMin)}</span>
            </div>
          )}
          
          {task.effort && (
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              <span>{task.effort}/10</span>
            </div>
          )}
          
          {task.money && task.money > 0 && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span>R$ {task.money}</span>
            </div>
          )}
          
          {task.start && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatTime(task.start)}</span>
            </div>
          )}
        </div>

        {/* Priority Score Display */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-medium text-muted-foreground">Prioridade:</span>
          <span className="text-sm font-semibold text-gold">
            {priorityScore.toFixed(1)}
          </span>
          <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-accent to-primary rounded-full transition-all duration-500"
              style={{ width: `${priorityPercent}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          {onComplete && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onComplete(task.id);
              }}
              className="flex-1"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Concluir
            </Button>
          )}
          
          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task.id);
              }}
            >
              <Edit3 className="w-4 h-4" />
            </Button>
          )}
          
          {onSchedule && !task.start && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onSchedule(task.id);
              }}
            >
              <Calendar className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-accent" />
        <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full bg-primary" />
      </div>
    </motion.div>
  );
};