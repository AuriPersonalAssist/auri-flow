/**
 * Auri NLP Parser - Natural Language Processing for Task Creation
 */

import type { Task, TaskType, PillarBenefits } from '@/lib/engine/types';
import { DEFAULTS } from '@/lib/engine/calibration';

export interface ParsedTask {
  title: string;
  type: TaskType;
  durationMin?: number;
  effort?: number;
  benefits: PillarBenefits;
  start?: string;
  end?: string;
  gut?: {
    G: 1|2|3|4|5;
    U: 1|2|3|4|5;
  };
  confidence: number; // 0-1
  missing: string[]; // Lista de campos que precisam de confirmação
}

// Dicionários de palavras-chave
const CATEGORY_KEYWORDS = {
  estudo: ['estudar', 'revisar', 'prova', 'exame', 'aula', 'matéria', 'matemática', 'física', 'química', 'história', 'português', 'inglês', 'vestibular', 'enem', 'faculdade', 'universidade', 'curso', 'materia', 'lição'],
  treino: ['treino', 'academia', 'ginástica', 'corrida', 'caminhada', 'exercício', 'musculação', 'cardio', 'pilates', 'yoga', 'natação', 'futebol', 'basquete', 'vôlei', 'correr', 'pedalar'],
  sono: ['dormir', 'sono', 'descansar', 'cochilo', 'sesta'],
  leitura: ['ler', 'leitura', 'livro', 'romance', 'biografia', 'artigo', 'revista', 'jornal', 'blog'],
  outro: [] // fallback
};

const URGENCY_KEYWORDS = {
  5: ['urgente', 'emergência', 'agora', 'imediato', 'já', 'rápido'],
  4: ['importante', 'prioridade', 'logo', 'em breve', 'hoje'],
  3: ['normal', 'regular'],
  2: ['quando der', 'sem pressa', 'tranquilo'],
  1: ['opcional', 'se sobrar tempo']
};

const GRAVITY_KEYWORDS = {
  5: ['crítico', 'essencial', 'fundamental', 'crucial', 'vital'],
  4: ['importante', 'necessário', 'significativo'],
  3: ['normal', 'comum', 'regular'],
  2: ['simples', 'básico', 'leve'],
  1: ['trivial', 'opcional', 'extra']
};

const TIME_PATTERNS = [
  // Horas: 14:30, 14h30, 2:30pm, etc
  /(\d{1,2}):?(\d{2})?\s*(h|hrs?|hours?)?\s*(da\s+manhã|manhã|tarde|noite|pm|am)?/gi,
  // Períodos: manhã, tarde, noite
  /(manhã|tarde|noite|madrugada)/gi,
];

const DATE_PATTERNS = [
  // Dias: hoje, amanhã, segunda, terça, etc
  /(hoje|amanhã|depois de amanhã|segunda|terça|quarta|quinta|sexta|sábado|domingo)/gi,
  // Datas: 15/12, 15 de dezembro, etc
  /(\d{1,2})\/(\d{1,2})|(\d{1,2})\s+de\s+(\w+)/gi
];

const DURATION_PATTERNS = [
  // 1h30, 30min, 2 horas, etc
  /(\d+)\s*(h|hrs?|hours?|horas?)(?:\s*e?\s*(\d+)\s*(min|minutos?))?/gi,
  /(\d+)\s*(min|minutos?)/gi
];

/**
 * Extrai categoria da tarefa baseada em palavras-chave
 */
function extractCategory(text: string): TaskType {
  const normalizedText = text.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => normalizedText.includes(keyword))) {
      return category as TaskType;
    }
  }
  
  return 'outro';
}

/**
 * Extrai duração estimada do texto
 */
function extractDuration(text: string, category: TaskType): number | undefined {
  const normalizedText = text.toLowerCase();
  
  // Buscar padrões explícitos de duração
  for (const pattern of DURATION_PATTERNS) {
    const match = pattern.exec(normalizedText);
    if (match) {
      if (match[1] && (match[2]?.includes('h') || match[2]?.includes('hora'))) {
        // Formato: 1h30, 2 horas
        const hours = parseInt(match[1]);
        const minutes = match[3] ? parseInt(match[3]) : 0;
        return hours * 60 + minutes;
      } else if (match[1] && (match[2]?.includes('min') || match[2]?.includes('minuto'))) {
        // Formato: 30min, 45 minutos
        return parseInt(match[1]);
      }
    }
  }
  
  // Duração padrão por categoria
  const defaults = {
    estudo: 60,
    treino: 60,
    sono: 480, // 8 horas
    leitura: 45,
    outro: 30
  };
  
  return defaults[category] || 30;
}

/**
 * Extrai nível de esforço baseado em palavras-chave
 */
function extractEffort(text: string, category: TaskType): number {
  const normalizedText = text.toLowerCase();
  
  // Palavras que indicam alto esforço
  const highEffortWords = ['difícil', 'complexo', 'intenso', 'pesado', 'desafiador'];
  const lowEffortWords = ['fácil', 'simples', 'leve', 'relaxante', 'tranquilo'];
  
  if (highEffortWords.some(word => normalizedText.includes(word))) {
    return Math.min(8, DEFAULTS.defaultBenefits[category]?.bd || 5);
  }
  
  if (lowEffortWords.some(word => normalizedText.includes(word))) {
    return Math.max(2, (DEFAULTS.defaultBenefits[category]?.bd || 5) - 2);
  }
  
  // Esforço padrão por categoria
  const defaultEffort = {
    estudo: 6,
    treino: 7,
    sono: 2,
    leitura: 3,
    outro: 4
  };
  
  return defaultEffort[category] || 4;
}

/**
 * Extrai urgência (U) do texto
 */
function extractUrgency(text: string): 1|2|3|4|5 {
  const normalizedText = text.toLowerCase();
  
  for (const [level, keywords] of Object.entries(URGENCY_KEYWORDS)) {
    if (keywords.some(keyword => normalizedText.includes(keyword))) {
      return parseInt(level) as 1|2|3|4|5;
    }
  }
  
  return 3; // Urgência padrão
}

/**
 * Extrai gravidade (G) do texto
 */
function extractGravity(text: string): 1|2|3|4|5 {
  const normalizedText = text.toLowerCase();
  
  for (const [level, keywords] of Object.entries(GRAVITY_KEYWORDS)) {
    if (keywords.some(keyword => normalizedText.includes(keyword))) {
      return parseInt(level) as 1|2|3|4|5;
    }
  }
  
  return 3; // Gravidade padrão
}

/**
 * Extrai título da tarefa (remove palavras de tempo/duração)
 */
function extractTitle(text: string): string {
  let title = text.trim();
  
  // Remove padrões de tempo e duração
  title = title.replace(/\s+(hoje|amanhã|segunda|terça|quarta|quinta|sexta|sábado|domingo)\s+/gi, ' ');
  title = title.replace(/\s+às?\s+\d{1,2}:?\d{0,2}\s*(h|hrs?)?\s*/gi, ' ');
  title = title.replace(/\s+por\s+\d+\s*(min|minutos?|h|hrs?|horas?)/gi, ' ');
  title = title.replace(/\s+(manhã|tarde|noite)\s+/gi, ' ');
  
  // Remove palavras de urgência/gravidade
  title = title.replace(/\s+(urgente|importante|rápido|logo|em breve)\s+/gi, ' ');
  
  // Limpa espaços extras
  title = title.replace(/\s+/g, ' ').trim();
  
  // Capitaliza primeira letra
  return title.charAt(0).toUpperCase() + title.slice(1);
}

/**
 * Função principal de parsing
 */
export function parseTask(input: string): ParsedTask {
  console.log('[Auri::NLP] Parsing input:', input);
  
  const category = extractCategory(input);
  const title = extractTitle(input);
  const durationMin = extractDuration(input, category);
  const effort = extractEffort(input, category);
  const urgency = extractUrgency(input);
  const gravity = extractGravity(input);
  
  // Benefícios padrão por categoria
  const benefits = DEFAULTS.defaultBenefits[category] || DEFAULTS.defaultBenefits.outro;
  
  const missing: string[] = [];
  let confidence = 0.8;
  
  // Verifica se há informações em falta
  if (!title || title.length < 3) {
    missing.push('title');
    confidence -= 0.3;
  }
  
  if (!durationMin) {
    missing.push('duration');
    confidence -= 0.2;
  }
  
  const result: ParsedTask = {
    title,
    type: category,
    durationMin,
    effort,
    benefits,
    gut: {
      G: gravity,
      U: urgency
    },
    confidence: Math.max(0.1, confidence),
    missing
  };
  
  console.log('[Auri::NLP] Parsed result:', result);
  return result;
}

/**
 * Valida se uma tarefa parseada tem dados suficientes
 */
export function isTaskComplete(parsed: ParsedTask): boolean {
  return parsed.missing.length === 0 && parsed.confidence > 0.5;
}

/**
 * Converte ParsedTask para Task
 */
export function toTask(parsed: ParsedTask): Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'priorityScore'> {
  return {
    title: parsed.title,
    type: parsed.type,
    durationMin: parsed.durationMin,
    effort: parsed.effort,
    benefits: parsed.benefits,
    gut: parsed.gut,
    completed: false
  };
}