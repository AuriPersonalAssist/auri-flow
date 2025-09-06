/**
 * Auri Copy - Concierge Premium Tone
 */

export const copy = {
  // Greetings
  greetings: {
    morning: 'Bom dia! Como posso organizar seu dia?',
    afternoon: 'Boa tarde! Vamos planejar o que resta do dia?',
    evening: 'Boa noite! Preparando o amanhã?',
    default: 'Olá! Pronto para organizar suas prioridades?'
  },

  // Actions - Concierge tone
  actions: {
    organized: 'Já organizei para você ✨',
    calculated: 'Tudo certo.',
    scheduled: 'Agendado com perfeição.',
    completed: 'Excelente trabalho!',
    rescheduled: 'Antecipei 30 min por conta do trânsito.',
    optimized: 'Otimizei sua agenda automaticamente.',
    ready: 'Está pronto quando você estiver.',
    adjusted: 'Fiz alguns ajustes para você.'
  },

  // Input placeholders
  input: {
    placeholder: 'Diga o que precisa, eu organizo ✨',
    voicePlaceholder: 'Fale agora...',
    loading: 'Organizando...',
    thinking: 'Calculando prioridades...'
  },

  // Confirmations
  confirmations: {
    task: 'Criei sua tarefa. Algo mais?',
    update: 'Atualização feita.',
    delete: 'Removido da sua lista.',
    complete: 'Marcado como concluído.',
    reschedule: 'Reagendado conforme solicitado.'
  },

  // Suggestions
  suggestions: {
    conflict: 'Detectei um conflito. Algumas opções:',
    optimization: 'Posso otimizar isso para você:',
    alternative: 'Que tal esta alternativa?',
    better: 'Encontrei uma opção melhor:'
  },

  // Empty states
  empty: {
    tasks: 'Tudo em dia!',
    tasksSubtitle: 'Você não tem tarefas pendentes no momento.',
    schedule: 'Agenda livre.',
    scheduleSubtitle: 'Que tal planejar algo produtivo?'
  },

  // Errors - Maintain premium tone
  errors: {
    generic: 'Algo não saiu como esperado. Pode tentar novamente?',
    parse: 'Não consegui entender completamente. Pode reformular?',
    schedule: 'Não encontrei uma janela ideal. Vamos ajustar?',
    conflict: 'Há um conflito de horários. Posso sugerir alternativas?'
  },

  // Time expressions
  time: {
    now: 'agora',
    today: 'hoje',
    tomorrow: 'amanhã',
    thisWeek: 'esta semana',
    nextWeek: 'próxima semana',
    morning: 'manhã',
    afternoon: 'tarde',
    evening: 'noite'
  },

  // Onboarding
  onboarding: {
    welcome: 'Bem-vindo ao Auri',
    subtitle: 'Seu assistente pessoal premium',
    step1: 'Vamos personalizar suas prioridades',
    step2: 'Configure suas rotinas',
    step3: 'Está tudo pronto!',
    pillars: {
      development: 'Desenvolvimento',
      physical: 'Físico',
      mental: 'Mental'
    },
    anchors: {
      title: 'Suas rotinas fixas',
      subtitle: 'Horários que não devem ser alterados',
      sleep: 'Sono',
      workout: 'Treino',
      study: 'Estudo',
      reading: 'Leitura'
    }
  },

  // Settings
  settings: {
    weights: 'Prioridades Pessoais',
    weightsSubtitle: 'Como devo priorizar suas atividades?',
    anchors: 'Rotinas Fixas',
    anchorsSubtitle: 'Horários que sempre respeitarei',
    data: 'Seus Dados',
    dataSubtitle: 'Controle total sobre suas informações',
    export: 'Exportar dados',
    import: 'Importar dados',
    clear: 'Apagar tudo',
    clearConfirm: 'Tem certeza? Esta ação não pode ser desfeita.',
    clearConfirmButton: 'Sim, apagar tudo'
  },

  // Task types
  taskTypes: {
    estudo: 'Estudo',
    treino: 'Treino',
    sono: 'Sono',
    leitura: 'Leitura',
    pontual: 'Pontual',
    outro: 'Outros'
  }
};

/**
 * Get appropriate greeting based on time of day
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour < 12) return copy.greetings.morning;
  if (hour < 18) return copy.greetings.afternoon;
  if (hour < 22) return copy.greetings.evening;
  return copy.greetings.default;
}

/**
 * Get random action confirmation
 */
export function getActionConfirmation(): string {
  const actions = Object.values(copy.actions);
  return actions[Math.floor(Math.random() * actions.length)];
}