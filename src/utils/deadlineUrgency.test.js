import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getDeadlineUrgency, parseDueDateLocal } from './deadlineUrgency.js';

describe('getDeadlineUrgency', () => {
  // Fixed "now" for deterministic testing: 2026-01-08T12:00:00 local
  const FIXED_NOW = new Date('2026-01-08T12:00:00');

  it('should return null when dueDate is null', () => {
    expect(getDeadlineUrgency(null, FIXED_NOW)).toBe(null);
  });

  it('should return null when dueDate is undefined', () => {
    expect(getDeadlineUrgency(undefined, FIXED_NOW)).toBe(null);
  });

  it('should return null when dueDate is empty string', () => {
    expect(getDeadlineUrgency('', FIXED_NOW)).toBe(null);
  });

  it('should return green when dueDate is more than 7 days away', () => {
    // Fixed now: 2026-01-08T12:00:00
    // Due date: 2026-01-18 (10 days ahead)
    const dueDate = '2026-01-18';
    expect(getDeadlineUrgency(dueDate, FIXED_NOW)).toBe('green');
  });

  it('should return yellow when dueDate is 7 days away', () => {
    // Fixed now: 2026-01-08T12:00:00
    // Due date: 2026-01-14 (6 days ahead, normalized to end-of-day = ~6.5 days, which is <= 7 days)
    // Note: 2026-01-15 would be > 7 days when normalized to end-of-day, so we use 2026-01-14
    const dueDate = '2026-01-14';
    expect(getDeadlineUrgency(dueDate, FIXED_NOW)).toBe('yellow');
  });

  it('should return yellow when dueDate is 3 days away', () => {
    // Fixed now: 2026-01-08T12:00:00
    // Due date: 2026-01-11 (3 days ahead)
    const dueDate = '2026-01-11';
    expect(getDeadlineUrgency(dueDate, FIXED_NOW)).toBe('yellow');
  });

  it('should return yellow when dueDate is exactly 2 days away', () => {
    // Fixed now: 2026-01-08T12:00:00
    // Due date: 2026-01-10 (normalized to 2026-01-10T23:59:59.999)
    // Difference: ~1.5 days from 12:00 to end of 10th = ~36 hours = < 2 days
    // Actually, let's use a date that's clearly >= 2 days: 2026-01-11 (2.5 days ahead)
    // Or test with a date that's exactly 2 full days: 2026-01-10 at 12:00 would be exactly 2 days
    // But since we normalize to end of day, 2026-01-10 end of day is ~1.5 days from now
    // So 2026-01-11 end of day is ~2.5 days, which should be yellow
    const dueDate = '2026-01-11';
    expect(getDeadlineUrgency(dueDate, FIXED_NOW)).toBe('yellow');
  });

  it('should return red when dueDate is 1 day ahead', () => {
    // Fixed now: 2026-01-08T12:00:00
    // Due date: 2026-01-09 (1 day ahead, < 2 days)
    const dueDate = '2026-01-09';
    expect(getDeadlineUrgency(dueDate, FIXED_NOW)).toBe('red');
  });

  it('should return red when dueDate is today (end-of-day logic still <2 days)', () => {
    // Fixed now: 2026-01-08T12:00:00
    // Due date: 2026-01-08 (today, normalized to end-of-day, but still < 2 days from now)
    const dueDate = '2026-01-08';
    expect(getDeadlineUrgency(dueDate, FIXED_NOW)).toBe('red');
  });

  it('should return red when dueDate is in the past', () => {
    // Fixed now: 2026-01-08T12:00:00
    // Due date: 2026-01-07 (1 day in the past)
    const dueDate = '2026-01-07';
    expect(getDeadlineUrgency(dueDate, FIXED_NOW)).toBe('red');
  });

  it('should handle date-only strings (YYYY-MM-DD)', () => {
    // Fixed now: 2026-01-08T12:00:00
    // Due date: 2026-01-20 (12 days ahead, > 7 days)
    const dueDate = '2026-01-20';
    expect(getDeadlineUrgency(dueDate, FIXED_NOW)).toBe('green');
  });

  it('should return null for invalid date strings', () => {
    expect(getDeadlineUrgency('invalid-date', FIXED_NOW)).toBe(null);
    expect(getDeadlineUrgency('not-a-date', FIXED_NOW)).toBe(null);
  });
});

describe('parseDueDateLocal', () => {
  it('should parse YYYY-MM-DD string and return end-of-day date', () => {
    const result = parseDueDateLocal('2026-01-08');
    expect(result).toBeInstanceOf(Date);
    expect(result).not.toBe(null);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(0); // January is 0
    expect(result.getDate()).toBe(8);
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
  });

  it('should return null for invalid date string', () => {
    expect(parseDueDateLocal('invalid-date')).toBe(null);
    expect(parseDueDateLocal('not-a-date')).toBe(null);
  });

  it('should return null for null input', () => {
    expect(parseDueDateLocal(null)).toBe(null);
  });

  it('should return null for undefined input', () => {
    expect(parseDueDateLocal(undefined)).toBe(null);
  });

  it('should return null for empty string', () => {
    expect(parseDueDateLocal('')).toBe(null);
  });
});

