/**
 * Auri Priority Engine - Mathematical Priority Calculation System
 * Implements the complete priority scoring algorithm with all mathematical formulas
 */

import type { 
  PillarWeights, 
  PillarBenefits, 
  CostInput, 
  GUT, 
  Decay, 
  WindowCheck, 
  Task, 
  UserPreferences,
  TaskType,
  EngineDebugInfo,
  PriorityCalculationStep
} from './types';
import { DEFAULTS, validateDuration, validateEffort } from './calibration';

/**
 * Calcula S0 base para tarefas pontuais
 * S0 = SCALE * (wd*bd + wf*bf + wm*bm)
 */
export const calcS0Base = ({
  wd, wf, wm, 
  bd, bf, bm, 
  SCALE = DEFAULTS.SCALE
}: PillarWeights & PillarBenefits & { SCALE?: number }): number => {
  console.log('[Auri::Engine] calcS0Base', { wd, wf, wm, bd, bf, bm, SCALE });
  const result = SCALE * (wd * bd + wf * bf + wm * bm);
  console.log('[Auri::Engine] S0 base result:', result);
  return result;
};

/**
 * Função de benefício contínuo com saturação
 * B(H) = (b0/k) * (1 - exp(-k*H))
 */
export const continuousBenefit = (H: number, b0: number, k: number): number => {
  if (H <= 0) return 0;
  return (b0 / k) * (1 - Math.exp(-k * H));
};

/**
 * Calcula S0 para atividades contínuas
 */
export const calcS0Continuous = (
  H: number, 
  weights: PillarWeights, 
  benefits: PillarBenefits, 
  SCALE = DEFAULTS.SCALE, 
  b0 = 1, 
  k = 0.5
): number => {
  console.log('[Auri::Engine] calcS0Continuous', { H, weights, benefits, SCALE, b0, k });
  
  const benefitFactor = continuousBenefit(H, b0, k);
  const weightedBenefit = weights.wd * benefits.bd + weights.wf * benefits.bf + weights.wm * benefits.bm;
  const result = SCALE * benefitFactor * weightedBenefit;
  
  console.log('[Auri::Engine] S0 continuous result:', result);
  return result;
};

/**
 * Calcula custo total da tarefa
 * K = ct*horas + ce*esforco + c$*dinheiro + kSetup
 */
export const calcCost = ({
  ct, ce, c$, kSetup, 
  horas, esforco, dinheiro
}: CostInput): number => {
  console.log('[Auri::Engine] calcCost', { ct, ce, c$, kSetup, horas, esforco, dinheiro });
  const result = ct * horas + ce * esforco + c$ * dinheiro + kSetup;
  console.log('[Auri::Engine] Cost result:', result);
  return Math.max(0, result);
};

/**
 * Aplica fatores GUT (Gravidade, Urgência, Tendência)
 */
export const applyGUT = (
  S0: number, 
  { G, U, betaG = DEFAULTS.gut.betaG, betaU = DEFAULTS.gut.betaU }: GUT
): { S0G: number; tAdj: (h: number) => number } => {
  console.log('[Auri::Engine] applyGUT', { S0, G, U, betaG, betaU });
  
  const S0G = S0 * (1 + betaG * (G - 3));
  const tAdj = (h: number) => h + betaU * (U - 3);
  
  console.log('[Auri::Engine] GUT result:', { S0G, tAdjExample: tAdj(1) });
  return { S0G, tAdj };
};

/**
 * Aplica decaimento temporal baseado no deadline
 */
export const applyDecay = (
  S0G: number, 
  { deltaDays, lambda0, Rd }: Decay
): number => {
  console.log('[Auri::Engine] applyDecay', { S0G, deltaDays, lambda0, Rd });
  
  const lambda = lambda0 * (Rd - 1);
  const result = S0G * Math.exp(-lambda * deltaDays);
  
  console.log('[Auri::Engine] Decay result:', result);
  return result;
};

/**
 * Calcula prioridade base (S0D - K)
 */
export const calcPriorityBase = (S0D: number, K: number): number => {
  console.log('[Auri::Engine] calcPriorityBase', { S0D, K });
  const result = Math.max(0, S0D - K);
  console.log('[Auri::Engine] Priority base result:', result);
  return result;
};

/**
 * Aplica restrições práticas (janela disponível e dependências)
 */
export const applyPracticalConstraints = (
  PriorityBase: number, 
  { Wwin, depsDone }: WindowCheck
): number => {
  console.log('[Auri::Engine] applyPracticalConstraints', { PriorityBase, Wwin, depsDone });
  
  const result = (Wwin === 1 && depsDone) ? PriorityBase : 0;
  console.log('[Auri::Engine] Practical constraints result:', result);
  return result;
};

/**
 * Verifica se a tarefa está dentro das restrições de duração
 */
const checkDurationConstraints = (task: Task): boolean => {
  if (!task.durationMin) return true;
  return validateDuration(task.type, task.durationMin);
};

/**
 * Verifica se a tarefa está dentro das restrições de esforço
 */
const checkEffortConstraints = (task: Task): boolean => {
  if (!task.effort) return true;
  return validateEffort(task.type, task.effort);
};

/**
 * Verifica se existe janela disponível para a tarefa
 */
const checkTimeWindow = (task: Task, now: Date): 0 | 1 => {
  // Implementação simplificada - em produção integraria com agenda
  if (task.start && task.end) {
    const startTime = new Date(task.start);
    const endTime = new Date(task.end);
    
    // Verifica se não há conflito com o momento atual
    if (startTime > now) return 1; // Agendado para o futuro
    if (endTime < now) return 0;   // Já passou
    return 1; // Está no horário
  }
  
  return 1; // Sem horário específico - sempre disponível
};

/**
 * Verifica se as dependências foram resolvidas
 */
const checkDependencies = (task: Task, allTasks: Task[]): boolean => {
  if (!task.deps || task.deps.length === 0) return true;
  
  return task.deps.every(depId => {
    const depTask = allTasks.find(t => t.id === depId);
    return depTask?.completed === true;
  });
};

/**
 * Função principal de scoring de tarefa
 */
export const scoreTask = (
  task: Task, 
  now: Date, 
  prefs: UserPreferences, 
  allTasks: Task[] = [],
  debug = false
): number => {
  console.log('[Auri::Engine] scoreTask started for:', task.title);
  
  const steps: PriorityCalculationStep[] = [];
  
  try {
    // Validações básicas
    if (task.completed) {
      console.log('[Auri::Engine] Task completed, score = 0');
      return 0;
    }
    
    if (!checkDurationConstraints(task)) {
      console.log('[Auri::Engine] Duration constraints failed, score = 0');
      return 0;
    }
    
    if (!checkEffortConstraints(task)) {
      console.log('[Auri::Engine] Effort constraints failed, score = 0');
      return 0;
    }
    
    // 1. Calcular S0 (pontual vs contínuo)
    let S0: number;
    const taskHours = (task.durationMin || 60) / 60;
    
    if (['estudo', 'treino', 'sono', 'leitura'].includes(task.type)) {
      // Atividade contínua
      const meta = DEFAULTS.continuous[task.type as keyof typeof DEFAULTS.continuous];
      if (meta) {
        S0 = calcS0Continuous(taskHours, prefs.weights, task.benefits, DEFAULTS.SCALE, meta.b0, meta.k);
      } else {
        S0 = calcS0Base({ ...prefs.weights, ...task.benefits });
      }
    } else {
      // Atividade pontual
      S0 = calcS0Base({ ...prefs.weights, ...task.benefits });
    }
    
    steps.push({ step: 'S0_calculation', input: { taskHours, type: task.type }, output: S0 });
    
    // 2. Calcular custo
    const kSetup = DEFAULTS.cost.kSetup[task.type as keyof typeof DEFAULTS.cost.kSetup] || DEFAULTS.cost.kSetup.outro;
    const cost = calcCost({
      ct: DEFAULTS.cost.ct,
      ce: DEFAULTS.cost.ce,
      c$: DEFAULTS.cost.c$,
      kSetup,
      horas: taskHours,
      esforco: task.effort || 3,
      dinheiro: task.money || 0
    });
    
    steps.push({ step: 'cost_calculation', input: { taskHours, effort: task.effort, money: task.money }, output: cost });
    
    // 3. Aplicar GUT se disponível
    let S0G = S0;
    if (task.gut) {
      const gutResult = applyGUT(S0, task.gut);
      S0G = gutResult.S0G;
      steps.push({ step: 'gut_application', input: task.gut, output: S0G });
    }
    
    // 4. Aplicar decaimento temporal se disponível
    let S0D = S0G;
    if (task.decay?.due) {
      const dueDate = new Date(task.decay.due);
      const deltaDays = Math.max(0, (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      S0D = applyDecay(S0G, {
        deltaDays,
        lambda0: DEFAULTS.decay.lambda0,
        Rd: task.decay.Rd
      });
      
      steps.push({ step: 'decay_application', input: { deltaDays, Rd: task.decay.Rd }, output: S0D });
    }
    
    // 5. Calcular prioridade base
    const priorityBase = calcPriorityBase(S0D, cost);
    steps.push({ step: 'priority_base', input: { S0D, cost }, output: priorityBase });
    
    // 6. Aplicar restrições práticas
    const Wwin = checkTimeWindow(task, now);
    const depsDone = checkDependencies(task, allTasks);
    
    const finalScore = applyPracticalConstraints(priorityBase, { Wwin, depsDone });
    steps.push({ step: 'practical_constraints', input: { Wwin, depsDone }, output: finalScore });
    
    if (debug) {
      const debugInfo: EngineDebugInfo = {
        taskId: task.id,
        steps,
        finalScore,
        timestamp: now.toISOString(),
        userPrefs: prefs
      };
      console.log('[Auri::Engine] Debug info:', debugInfo);
    }
    
    console.log('[Auri::Engine] Final score for', task.title, ':', finalScore);
    return finalScore;
    
  } catch (error) {
    console.error('[Auri::Engine] Error scoring task:', error);
    return 0;
  }
};

/**
 * Ordena lista de tarefas por prioridade
 */
export const sortTasksByPriority = (
  tasks: Task[], 
  now: Date, 
  prefs: UserPreferences, 
  debug = false
): Task[] => {
  console.log('[Auri::Engine] Sorting tasks by priority');
  
  const tasksWithScores = tasks.map(task => ({
    ...task,
    priorityScore: scoreTask(task, now, prefs, tasks, debug)
  }));
  
  const sorted = tasksWithScores.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
  
  console.log('[Auri::Engine] Sorted tasks:', sorted.map(t => ({ 
    title: t.title, 
    score: t.priorityScore 
  })));
  
  return sorted;
};

/**
 * Recalcula prioridades de todas as tarefas
 */
export const recalculateAllPriorities = (
  tasks: Task[], 
  prefs: UserPreferences, 
  debug = false
): Task[] => {
  console.log('[Auri::Engine] Recalculating all priorities');
  const now = new Date();
  return sortTasksByPriority(tasks, now, prefs, debug);
};