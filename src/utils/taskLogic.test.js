import { describe, it, expect } from 'vitest';
import { getQuadrant } from './taskLogic.js';

describe('getQuadrant', () => {
  it('should return Q1 for urgent=true, important=true', () => {
    const task = { urgent: true, important: true };
    expect(getQuadrant(task)).toBe('Q1');
  });

  it('should return Q2 for urgent=false, important=true', () => {
    const task = { urgent: false, important: true };
    expect(getQuadrant(task)).toBe('Q2');
  });

  it('should return Q3 for urgent=true, important=false', () => {
    const task = { urgent: true, important: false };
    expect(getQuadrant(task)).toBe('Q3');
  });

  it('should return Q4 for urgent=false, important=false', () => {
    const task = { urgent: false, important: false };
    expect(getQuadrant(task)).toBe('Q4');
  });

  it('should NOT use priority to determine quadrant - Q4 with high priority', () => {
    const task = { urgent: false, important: false, priority: 'high' };
    expect(getQuadrant(task)).toBe('Q4');
  });

  it('should return Q4 when task is null (treat missing flags as false/false)', () => {
    expect(getQuadrant(null)).toBe('Q4');
  });

  it('should return Q4 when urgent is missing (treat as false)', () => {
    const task = { important: true };
    expect(getQuadrant(task)).toBe('Q2');
  });

  it('should return Q4 when important is missing (treat as false)', () => {
    const task = { urgent: true };
    expect(getQuadrant(task)).toBe('Q3');
  });

  it('should return Q4 when both flags are missing (treat as false/false)', () => {
    const task = {};
    expect(getQuadrant(task)).toBe('Q4');
  });

  it('should return Q4 when urgent is not boolean (treat as false)', () => {
    const task = { urgent: 'true', important: true };
    expect(getQuadrant(task)).toBe('Q2');
  });

  it('should return Q4 when important is not boolean (treat as false)', () => {
    const task = { urgent: true, important: 'true' };
    expect(getQuadrant(task)).toBe('Q3');
  });
});


