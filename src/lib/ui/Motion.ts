/**
 * Auri Motion Presets - Consistent animations and transitions
 */

import type { Variants, Transition } from 'framer-motion';

// Base transitions
export const transitions = {
  quick: { duration: 0.15, ease: [0.4, 0, 1, 1] },
  base: { duration: 0.25, ease: [0, 0, 0.2, 1] },
  smooth: { duration: 0.35, ease: [0, 0, 0.2, 1] },
  slow: { duration: 0.5, ease: [0, 0, 0.2, 1] },
  spring: { type: 'spring', stiffness: 300, damping: 30 }
} as const;

// Card animations
export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: transitions.smooth
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: -10,
    transition: transitions.quick
  },
  hover: {
    scale: 1.02,
    y: -4,
    transition: transitions.quick
  },
  tap: {
    scale: 0.98,
    transition: transitions.quick
  }
};

// Stack animations
export const stackVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

// Input animations
export const inputVariants: Variants = {
  idle: {
    scale: 1,
    boxShadow: '0 0 0 0px rgba(212, 175, 55, 0)'
  },
  focus: {
    scale: 1.01,
    boxShadow: '0 0 0 2px rgba(212, 175, 55, 0.2)',
    transition: transitions.base
  },
  recording: {
    scale: 1.02,
    boxShadow: [
      '0 0 0 2px rgba(212, 175, 55, 0.2)',
      '0 0 0 4px rgba(212, 175, 55, 0.1)',
      '0 0 0 2px rgba(212, 175, 55, 0.2)'
    ],
    transition: {
      boxShadow: {
        duration: 1.5,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut'
      }
    }
  }
};

// Timeline animations
export const timelineVariants: Variants = {
  hidden: {
    opacity: 0,
    height: 0
  },
  visible: {
    opacity: 1,
    height: 'auto',
    transition: {
      opacity: transitions.base,
      height: transitions.smooth
    }
  }
};

// Dot animations for timeline
export const dotVariants: Variants = {
  idle: {
    scale: 1,
    backgroundColor: 'hsl(214, 52%, 12%)'
  },
  active: {
    scale: 1.2,
    backgroundColor: 'hsl(45, 65%, 52%)',
    boxShadow: '0 0 16px rgba(212, 175, 55, 0.4)',
    transition: transitions.base
  },
  completed: {
    scale: 1.1,
    backgroundColor: 'hsl(45, 65%, 52%)',
    transition: transitions.base
  }
};

// Modal animations
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: transitions.smooth
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: transitions.quick
  }
};

// Overlay animations
export const overlayVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: transitions.base
  },
  exit: {
    opacity: 0,
    transition: transitions.quick
  }
};

// Stagger children preset
export const staggerChildren = (delay = 0.1) => ({
  visible: {
    transition: {
      staggerChildren: delay,
      delayChildren: delay / 2
    }
  }
});

// Slide animations
export const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0
  })
};

// Fade in up
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 24
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.smooth
  }
};

// Pulse animation for loading states
export const pulseVariants: Variants = {
  idle: {
    opacity: 1
  },
  loading: {
    opacity: [1, 0.5, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};