/**
 * Auri Engine Types - Mathematical Priority Calculation System
 */

export type PillarWeights = { 
  wd: number; // Desenvolvimento (0-1)
  wf: number; // Físico (0-1)  
  wm: number; // Mental (0-1)
  // soma deve ser ~1
};

export type PillarBenefits = { 
  bd: number; // Benefício desenvolvimento (0-10)
  bf: number; // Benefício físico (0-10)
  bm: number; // Benefício mental (0-10)
};

export type ContinuousMeta = { 
  Hmin: number; // Duração mínima (horas)
  Hmax: number; // Duração máxima (horas)
  b0: number;   // Benefício base
  k: number;    // Taxa de saturação
};

export type GUT = { 
  G: 1|2|3|4|5; // Gravidade (1=baixa, 5=crítica)
  U: 1|2|3|4|5; // Urgência (1=pode aguardar, 5=imediata)
  betaG?: number; // Peso gravidade (default: 0.2)
  betaU?: number; // Peso urgência (default: 0.35)
};

export type Decay = { 
  deltaDays: number; // Dias até deadline
  lambda0: number;   // Taxa base de decaimento
  Rd: 1|2|3|4|5;    // Rigidez do deadline (1=flexível, 5=inflexível)
};

export type CostInput = { 
  ct: number;     // Custo por hora de tempo
  ce: number;     // Custo por unidade de esforço
  c$: number;     // Custo monetário direto
  kSetup: number; // Custo fixo de setup
  horas: number;  // Tempo estimado (horas)
  esforco: number; // Esforço estimado (1-10)
  dinheiro: number; // Custo monetário
};

export type WindowCheck = { 
  Wwin: 0|1;        // Janela disponível (0=não cabe, 1=cabe)
  depsDone: boolean; // Dependências resolvidas
};

export type TaskType = 'pontual' | 'estudo' | 'treino' | 'sono' | 'leitura' | 'outro';

export type Task = {
  id: string;
  title: string;
  description?: string;
  start?: string;     // ISO string
  end?: string;       // ISO string  
  durationMin?: number; // Duração em minutos
  effort?: number;    // Esforço 1-10
  money?: number;     // Custo monetário
  type: TaskType;
  
  // Benefícios por pilar
  benefits: PillarBenefits;
  
  // Classificação GUT
  gut?: GUT;
  
  // Configuração de decaimento
  decay?: Omit<Decay, 'deltaDays'> & { 
    due?: string;  // Data limite (ISO string)
    Rd: 1|2|3|4|5; 
  };
  
  // Dependências
  deps?: string[];
  
  // Sugestão de pilar dominante
  pillarHint?: 'd'|'f'|'m';
  
  // Estado
  completed?: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Resultado do cálculo
  priorityScore?: number;
  
  // Metadados para UI
  color?: string;
  tags?: string[];
};

export type WeeklyAnchor = {
  type: 'sono' | 'treino' | 'estudo' | 'leitura';
  startTime: string;    // "07:00"
  duration: number;     // minutos
  days: number[];       // 0-6 (domingo-sábado)
  target?: number;      // meta semanal (horas, páginas, etc)
  active: boolean;
};

export type UserPreferences = {
  weights: PillarWeights;
  anchors: WeeklyAnchor[];
  timeFormat: '12h' | '24h';
  language: 'pt' | 'en';
  onboardingComplete: boolean;
  
  // Configurações de input
  voiceEnabled: boolean;
  autoSuggestions: boolean;
  
  // Configurações de privacidade
  dataRetentionDays: number; // 0 = indefinido
};

export type ConflictSuggestion = {
  id: string;
  type: 'shift_time' | 'reduce_duration' | 'swap_order';
  description: string;
  originalTask: Task;
  modifiedTask: Task;
  impact: number; // 0-1 (0=sem impacto, 1=alto impacto)
};

export type PriorityCalculationStep = {
  step: string;
  input: any;
  output: number;
  formula?: string;
};

export type EngineDebugInfo = {
  taskId: string;
  steps: PriorityCalculationStep[];
  finalScore: number;
  timestamp: string;
  userPrefs: UserPreferences;
};

export type TimeSlot = {
  start: string; // ISO string
  end: string;   // ISO string
  available: boolean;
  tasks: string[]; // task IDs
};

export type DaySchedule = {
  date: string; // YYYY-MM-DD
  slots: TimeSlot[];
  totalScheduled: number; // minutos
  totalAvailable: number; // minutos
};