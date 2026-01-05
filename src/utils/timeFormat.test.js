import { describe, it, expect } from 'vitest';
import { formatEstimateMinutes } from './timeFormat.js';

describe('formatEstimateMinutes', () => {
  it('should format 65 minutes as "1h 05m"', () => {
    expect(formatEstimateMinutes(65)).toBe('1h 05m');
  });

  it('should format 30 minutes as "30m"', () => {
    expect(formatEstimateMinutes(30)).toBe('30m');
  });

  it('should format 120 minutes as "2h" (no minutes when minutes are 0)', () => {
    expect(formatEstimateMinutes(120)).toBe('2h');
  });

  it('should pad minutes to 2 digits when hours exist and minutes > 0', () => {
    expect(formatEstimateMinutes(65)).toBe('1h 05m');
    expect(formatEstimateMinutes(125)).toBe('2h 05m');
    expect(formatEstimateMinutes(90)).toBe('1h 30m');
  });

  it('should return null for invalid inputs', () => {
    expect(formatEstimateMinutes(0)).toBe(null);
    expect(formatEstimateMinutes(-10)).toBe(null);
    expect(formatEstimateMinutes(null)).toBe(null);
    expect(formatEstimateMinutes(undefined)).toBe(null);
  });

  it('should handle edge cases', () => {
    expect(formatEstimateMinutes(1)).toBe('1m');
    expect(formatEstimateMinutes(60)).toBe('1h');
    expect(formatEstimateMinutes(61)).toBe('1h 01m');
    expect(formatEstimateMinutes(59)).toBe('59m');
  });
});

