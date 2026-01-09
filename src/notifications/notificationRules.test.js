import { describe, it, expect } from 'vitest';
import { deriveEffectiveFrequency, shouldDriftToQ1 } from './notificationRules.js';

describe('deriveEffectiveFrequency', () => {
  const now = new Date('2026-01-10T12:00:00Z');

  it('should return base frequency when no dueDate', () => {
    const task = { notificationFrequency: 'medium' };
    expect(deriveEffectiveFrequency(task, now)).toBe('medium');
  });

  it('should return base frequency when dueDate is far in future', () => {
    const task = {
      notificationFrequency: 'low',
      dueDate: '2026-01-20T12:00:00Z' // 10 days away
    };
    expect(deriveEffectiveFrequency(task, now)).toBe('low');
  });

  it('should escalate to high when dueDate is within 4 days', () => {
    const task = {
      notificationFrequency: 'low',
      dueDate: '2026-01-12T12:00:00Z' // 2 days away
    };
    expect(deriveEffectiveFrequency(task, now)).toBe('high');
  });

  it('should escalate to high when dueDate is exactly 4 days away', () => {
    const task = {
      notificationFrequency: 'medium',
      dueDate: '2026-01-14T12:00:00Z' // exactly 4 days
    };
    expect(deriveEffectiveFrequency(task, now)).toBe('high');
  });

  it('should escalate to high when dueDate is today', () => {
    const task = {
      notificationFrequency: 'low',
      dueDate: '2026-01-10T18:00:00Z' // same day
    };
    expect(deriveEffectiveFrequency(task, now)).toBe('high');
  });

  it('should not escalate when dueDate is in the past', () => {
    const task = {
      notificationFrequency: 'low',
      dueDate: '2026-01-05T12:00:00Z' // 5 days ago
    };
    expect(deriveEffectiveFrequency(task, now)).toBe('low');
  });

  it('should handle missing notificationFrequency (defaults to low)', () => {
    const task = { dueDate: '2026-01-12T12:00:00Z' };
    expect(deriveEffectiveFrequency(task, now)).toBe('high');
  });

  it('should handle invalid dueDate gracefully', () => {
    const task = {
      notificationFrequency: 'medium',
      dueDate: 'invalid-date'
    };
    expect(deriveEffectiveFrequency(task, now)).toBe('medium');
  });
});

describe('shouldDriftToQ1', () => {
  const now = new Date('2026-01-10T12:00:00Z');

  it('should return false for Q1 task', () => {
    const task = {
      urgent: true,
      important: true,
      dueDate: '2026-01-11T12:00:00Z' // within 48h
    };
    expect(shouldDriftToQ1(task, now)).toBe(false);
  });

  it('should return false for Q3 task', () => {
    const task = {
      urgent: true,
      important: false,
      dueDate: '2026-01-11T12:00:00Z'
    };
    expect(shouldDriftToQ1(task, now)).toBe(false);
  });

  it('should return false for Q4 task', () => {
    const task = {
      urgent: false,
      important: false,
      dueDate: '2026-01-11T12:00:00Z'
    };
    expect(shouldDriftToQ1(task, now)).toBe(false);
  });

  it('should return false for Q2 task without dueDate', () => {
    const task = {
      urgent: false,
      important: true
    };
    expect(shouldDriftToQ1(task, now)).toBe(false);
  });

  it('should return false for Q2 task with dueDate far in future', () => {
    const task = {
      urgent: false,
      important: true,
      dueDate: '2026-01-20T12:00:00Z' // 10 days away
    };
    expect(shouldDriftToQ1(task, now)).toBe(false);
  });

  it('should return true for Q2 task with dueDate within 48 hours', () => {
    const task = {
      urgent: false,
      important: true,
      dueDate: '2026-01-11T12:00:00Z' // 24 hours away
    };
    expect(shouldDriftToQ1(task, now)).toBe(true);
  });

  it('should return true for Q2 task with dueDate exactly 48 hours away', () => {
    const task = {
      urgent: false,
      important: true,
      dueDate: '2026-01-12T12:00:00Z' // exactly 48 hours
    };
    expect(shouldDriftToQ1(task, now)).toBe(true);
  });

  it('should return false for Q2 task with dueDate just over 48 hours', () => {
    const task = {
      urgent: false,
      important: true,
      dueDate: '2026-01-12T13:00:00Z' // 49 hours away
    };
    expect(shouldDriftToQ1(task, now)).toBe(false);
  });

  it('should return false for Q2 task with dueDate in the past', () => {
    const task = {
      urgent: false,
      important: true,
      dueDate: '2026-01-09T12:00:00Z' // yesterday
    };
    expect(shouldDriftToQ1(task, now)).toBe(false);
  });

  it('should handle invalid dueDate gracefully', () => {
    const task = {
      urgent: false,
      important: true,
      dueDate: 'invalid-date'
    };
    expect(shouldDriftToQ1(task, now)).toBe(false);
  });

  it('should handle null task gracefully', () => {
    expect(shouldDriftToQ1(null, now)).toBe(false);
  });
});

