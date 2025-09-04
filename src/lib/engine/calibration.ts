/**
 * Auri Engine Calibration - Default Parameters and Constraints
 */

import type { ContinuousMeta, PillarWeights } from './types';

export const DEFAULTS = {
  // Escala base para normalização
  SCALE: 10,
  
  // Configurações para atividades contínuas
  continuous: {
    estudo: { 
      Hmin: 0.75,  // 45 minutos mínimo
      Hmax: 2,     // 2 horas máximo
      b0: 1, 
      k: 0.7 
    } as ContinuousMeta,
    
    treino: { 
      Hmin: 1,     // 1 hora mínimo
      Hmax: 1.5,   // 1.5 horas máximo
      b0: 1, 
      k: 0.6 
    } as ContinuousMeta,
    
    sono: { 
      Hmin: 7,     // 7 horas mínimo
      Hmax: 9,     // 9 horas máximo
      b0: 1, 
      k: 0.4 
    } as ContinuousMeta,
    
    leitura: { 
      Hmin: 0.5,   // 30 minutos mínimo
      Hmax: 3,     // 3 horas máximo
      b0: 1, 
      k: 0.5 
    } as ContinuousMeta,
  },
  
  // Parâmetros de custo
  cost: {
    ct: 8,    // Custo por hora de tempo
    ce: 6,    // Custo por unidade de esforço
    c$: 2,    // Multiplicador custo monetário
    kSetup: { // Custos fixos de setup por tipo
      estudo: 10,
      treino: 5,
      sono: 2,
      leitura: 3,
      outro: 5
    }
  },
  
  // Parâmetros GUT
  gut: {
    betaG: 0.2,  // Peso da gravidade
    betaU: 0.35  // Peso da urgência
  },
  
  // Parâmetros de decaimento
  decay: {
    lambda0: 0.25  // Taxa base de decaimento temporal
  },
  
  // Pesos padrão dos pilares (usuário pode personalizar)
  defaultWeights: {
    wd: 0.4,  // Desenvolvimento
    wf: 0.3,  // Físico
    wm: 0.3   // Mental
  } as PillarWeights,
  
  // Benefícios padrão por tipo de tarefa
  defaultBenefits: {
    estudo:   { bd: 8, bf: 2, bm: 7 },
    treino:   { bd: 3, bf: 9, bm: 6 },
    sono:     { bd: 4, bf: 8, bm: 8 },
    leitura:  { bd: 6, bf: 1, bm: 8 },
    pontual:  { bd: 5, bf: 3, bm: 4 },
    outro:    { bd: 4, bf: 4, bm: 4 }
  }
};

// Validação de constraints
export const CONSTRAINTS = {
  // Durações mínimas e máximas por tipo (em minutos)
  duration: {
    estudo: { min: 45, max: 120 },
    treino: { min: 60, max: 90 },
    sono: { min: 420, max: 540 }, // 7-9 horas
    leitura: { min: 30, max: 180 },
    pontual: { min: 5, max: 480 },
    outro: { min: 5, max: 480 }
  },
  
  // Esforço por tipo (1-10)
  effort: {
    estudo: { min: 4, max: 9 },
    treino: { min: 6, max: 10 },
    sono: { min: 1, max: 3 },
    leitura: { min: 2, max: 6 },
    pontual: { min: 1, max: 8 },
    outro: { min: 1, max: 10 }
  },
  
  // Janelas recomendadas por tipo (horas do dia)
  timeWindows: {
    estudo: [8, 9, 10, 14, 15, 16, 19, 20],
    treino: [6, 7, 8, 17, 18, 19],
    sono: [22, 23, 0, 1, 2, 3, 4, 5, 6],
    leitura: [19, 20, 21, 22],
    pontual: [], // Qualquer horário
    outro: []    // Qualquer horário
  }
};

// Funções de validação
export const validateDuration = (type: string, minutes: number): boolean => {
  const constraint = CONSTRAINTS.duration[type as keyof typeof CONSTRAINTS.duration];
  if (!constraint) return true;
  return minutes >= constraint.min && minutes <= constraint.max;
};

export const validateEffort = (type: string, effort: number): boolean => {
  const constraint = CONSTRAINTS.effort[type as keyof typeof CONSTRAINTS.effort];
  if (!constraint) return true;
  return effort >= constraint.min && effort <= constraint.max;
};

export const getRecommendedDuration = (type: string): { min: number; max: number; suggested: number } => {
  const constraint = CONSTRAINTS.duration[type as keyof typeof CONSTRAINTS.duration];
  if (!constraint) return { min: 30, max: 120, suggested: 60 };
  
  const suggested = Math.round((constraint.min + constraint.max) / 2);
  return { ...constraint, suggested };
};

export const getRecommendedEffort = (type: string): { min: number; max: number; suggested: number } => {
  const constraint = CONSTRAINTS.effort[type as keyof typeof CONSTRAINTS.effort];
  if (!constraint) return { min: 1, max: 5, suggested: 3 };
  
  const suggested = Math.round((constraint.min + constraint.max) / 2);
  return { ...constraint, suggested };
};