import { describe, it, expect } from 'vitest';
import { normalizeTask, deriveDefaultFrequency } from './normalizeTask.js';

describe('deriveDefaultFrequency', () => {
  it('should return high for Q1', () => {
    expect(deriveDefaultFrequency('Q1')).toBe('high');
  });

  it('should return medium for Q2', () => {
    expect(deriveDefaultFrequency('Q2')).toBe('medium');
  });

  it('should return low for Q3', () => {
    expect(deriveDefaultFrequency('Q3')).toBe('low');
  });

  it('should return low for Q4', () => {
    expect(deriveDefaultFrequency('Q4')).toBe('low');
  });
});

describe('normalizeTask', () => {
  it('should set dueDate to null if missing', () => {
    const task = {
      id: 1,
      title: 'Test Task',
      urgent: false,
      important: false
    };
    const normalized = normalizeTask(task);
    expect(normalized.dueDate).toBe(null);
  });

  it('should set dueDate to null if empty string', () => {
    const task = {
      id: 1,
      title: 'Test Task',
      urgent: false,
      important: false,
      dueDate: ''
    };
    const normalized = normalizeTask(task);
    expect(normalized.dueDate).toBe(null);
  });

  it('should preserve dueDate if present', () => {
    const task = {
      id: 1,
      title: 'Test Task',
      urgent: false,
      important: false,
      dueDate: '2026-01-10T00:00:00.000Z'
    };
    const normalized = normalizeTask(task);
    expect(normalized.dueDate).toBe('2026-01-10T00:00:00.000Z');
  });

  it('should set notificationFrequency to high for Q1 tasks when missing', () => {
    const task = {
      id: 1,
      title: 'Test Task',
      urgent: true,
      important: true
    };
    const normalized = normalizeTask(task);
    expect(normalized.notificationFrequency).toBe('high');
  });

  it('should set notificationFrequency to medium for Q2 tasks when missing', () => {
    const task = {
      id: 1,
      title: 'Test Task',
      urgent: false,
      important: true
    };
    const normalized = normalizeTask(task);
    expect(normalized.notificationFrequency).toBe('medium');
  });

  it('should set notificationFrequency to low for Q3 tasks when missing', () => {
    const task = {
      id: 1,
      title: 'Test Task',
      urgent: true,
      important: false
    };
    const normalized = normalizeTask(task);
    expect(normalized.notificationFrequency).toBe('low');
  });

  it('should set notificationFrequency to low for Q4 tasks when missing', () => {
    const task = {
      id: 1,
      title: 'Test Task',
      urgent: false,
      important: false
    };
    const normalized = normalizeTask(task);
    expect(normalized.notificationFrequency).toBe('low');
  });

  it('should set notificationFrequency to low for Q4 tasks when null', () => {
    const task = {
      id: 1,
      title: 'Test Task',
      urgent: false,
      important: false,
      notificationFrequency: null
    };
    const normalized = normalizeTask(task);
    expect(normalized.notificationFrequency).toBe('low');
  });

  it('should preserve existing notificationFrequency', () => {
    const task = {
      id: 1,
      title: 'Test Task',
      urgent: true,
      important: true,
      notificationFrequency: 'low'
    };
    const normalized = normalizeTask(task);
    expect(normalized.notificationFrequency).toBe('low');
  });

  it('should fix invalid notificationFrequency to default based on quadrant', () => {
    const task = {
      id: 1,
      title: 'Test Task',
      urgent: true,
      important: true,
      notificationFrequency: 'invalid'
    };
    const normalized = normalizeTask(task);
    expect(normalized.notificationFrequency).toBe('high');
  });

  it('should preserve all other fields', () => {
    const task = {
      id: 1,
      title: 'Test Task',
      urgent: false,
      important: true,
      priority: 'high',
      estimateMinutesTotal: 30,
      createdAt: 1234567890
    };
    const normalized = normalizeTask(task);
    expect(normalized.id).toBe('1'); // id is converted to string
    expect(normalized.title).toBe('Test Task');
    expect(normalized.urgent).toBe(false);
    expect(normalized.important).toBe(true);
    expect(normalized.priority).toBe('high');
    expect(normalized.estimateMinutesTotal).toBe(30);
    // createdAt is converted to ISO string
    expect(normalized.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    // Sync fields are added
    expect(normalized.updatedAt).toBeDefined();
    expect(normalized.deletedAt).toBe(null);
    expect(normalized.completedAt).toBe(null);
    expect(normalized.deviceId).toBeDefined();
    expect(normalized.revision).toBe(0);
  });

  it('should throw error if task is null', () => {
    expect(() => normalizeTask(null)).toThrow('Task is required');
  });

  it('should throw error if task is undefined', () => {
    expect(() => normalizeTask(undefined)).toThrow('Task is required');
  });
});

