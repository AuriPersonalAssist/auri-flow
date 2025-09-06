/**
 * Auri Priority Engine Tests
 */

import { describe, it, expect } from 'vitest';
import { 
  calcS0Base, 
  calcCost, 
  applyGUT, 
  applyDecay, 
  scoreTask 
} from '@/lib/engine/priority';
import { DEFAULTS } from '@/lib/engine/calibration';
import type { Task, UserPreferences } from '@/lib/engine/types';

describe('Priority Engine', () => {
  const mockPrefs: UserPreferences = {
    weights: { wd: 0.4, wf: 0.3, wm: 0.3 },
    anchors: [],
    timeFormat: '24h',
    language: 'pt',
    onboardingComplete: true,
    voiceEnabled: true,
    autoSuggestions: true,
    dataRetentionDays: 0
  };

  it('should calculate S0 base correctly', () => {
    const result = calcS0Base({
      wd: 0.4, wf: 0.3, wm: 0.3,
      bd: 8, bf: 2, bm: 7,
      SCALE: 10
    });
    expect(result).toBe(59); // 10 * (0.4*8 + 0.3*2 + 0.3*7)
  });

  it('should penalize tasks outside duration constraints', () => {
    const shortTask: Task = {
      id: '1',
      title: 'Short Study',
      type: 'estudo',
      durationMin: 30, // Below 45min minimum
      benefits: { bd: 8, bf: 2, bm: 7 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completed: false
    };

    const score = scoreTask(shortTask, new Date(), mockPrefs);
    expect(score).toBe(0);
  });

  it('should apply GUT factors correctly', () => {
    const { S0G } = applyGUT(100, { G: 5, U: 4 });
    expect(S0G).toBeGreaterThan(100); // High gravity increases score
  });

  it('should apply decay correctly', () => {
    const result = applyDecay(100, { deltaDays: 1, lambda0: 0.25, Rd: 5 });
    expect(result).toBeLessThan(100); // Decay reduces score
  });
});