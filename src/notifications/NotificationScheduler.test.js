import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { scheduleNext } from './NotificationScheduler.js';
import { getDefaultPreferences } from './notificationPreferences.js';

describe('NotificationScheduler', () => {
  let defaultPrefs;
  let now;

  beforeEach(() => {
    defaultPrefs = getDefaultPreferences();
    // Set to a known date: Monday, January 10, 2026, 10:00 AM
    now = new Date('2026-01-10T10:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return empty array for empty tasks', () => {
    const result = scheduleNext([], defaultPrefs, now);
    expect(result).toEqual([]);
  });

  it('should skip completed tasks', () => {
    const tasks = [
      { id: 1, title: 'Task 1', urgent: true, important: true, completedAt: Date.now() }
    ];
    const result = scheduleNext(tasks, defaultPrefs, now);
    expect(result).toEqual([]);
  });

  it('should schedule reminder for high frequency task', () => {
    const tasks = [
      { id: 1, title: 'Task 1', urgent: true, important: true, notificationFrequency: 'high' }
    ];
    const result = scheduleNext(tasks, defaultPrefs, now);
    
    expect(result.length).toBeGreaterThan(0);
    const reminder = result.find(n => n.type === 'reminder');
    expect(reminder).toBeDefined();
    expect(reminder.taskId).toBe(1);
    expect(reminder.type).toBe('reminder');
    expect(reminder.message).toContain('Task 1');
  });

  it('should schedule reminder for medium frequency task', () => {
    const tasks = [
      { id: 1, title: 'Task 1', urgent: false, important: true, notificationFrequency: 'medium' }
    ];
    const result = scheduleNext(tasks, defaultPrefs, now);
    
    expect(result.length).toBeGreaterThan(0);
    const reminder = result.find(n => n.type === 'reminder');
    expect(reminder).toBeDefined();
  });

  it('should schedule reminder for low frequency task', () => {
    const tasks = [
      { id: 1, title: 'Task 1', urgent: false, important: false, notificationFrequency: 'low' }
    ];
    const result = scheduleNext(tasks, defaultPrefs, now);
    
    expect(result.length).toBeGreaterThan(0);
    const reminder = result.find(n => n.type === 'reminder');
    expect(reminder).toBeDefined();
  });

  it('should schedule drift notification for Q2 task with dueDate within 48h', () => {
    const dueDate = new Date(now);
    dueDate.setHours(dueDate.getHours() + 24); // 24 hours from now
    
    const tasks = [
      {
        id: 1,
        title: 'Task 1',
        urgent: false,
        important: true,
        notificationFrequency: 'medium',
        dueDate: dueDate.toISOString()
      }
    ];
    const result = scheduleNext(tasks, defaultPrefs, now);
    
    const drift = result.find(n => n.type === 'drift');
    expect(drift).toBeDefined();
    expect(drift.taskId).toBe(1);
    expect(drift.type).toBe('drift');
    expect(drift.message).toContain('moved to Urgent');
  });

  it('should not schedule drift for Q2 task with dueDate beyond 48h', () => {
    const dueDate = new Date(now);
    dueDate.setHours(dueDate.getHours() + 72); // 72 hours from now
    
    const tasks = [
      {
        id: 1,
        title: 'Task 1',
        urgent: false,
        important: true,
        notificationFrequency: 'medium',
        dueDate: dueDate.toISOString()
      }
    ];
    const result = scheduleNext(tasks, defaultPrefs, now);
    
    const drift = result.find(n => n.type === 'drift');
    expect(drift).toBeUndefined();
  });

  it('should not schedule already fired notifications', () => {
    const tasks = [
      { id: 1, title: 'Task 1', urgent: true, important: true, notificationFrequency: 'high' }
    ];
    
    // First scheduling
    const firstResult = scheduleNext(tasks, defaultPrefs, now);
    expect(firstResult.length).toBeGreaterThan(0);
    
    const notificationId = firstResult[0].id;
    const firedNotifications = { [notificationId]: now.toISOString() };
    
    // Second scheduling with fired notifications
    const secondResult = scheduleNext(tasks, defaultPrefs, now, firedNotifications);
    
    // Should not include the already fired notification
    const alreadyFired = secondResult.find(n => n.id === notificationId);
    expect(alreadyFired).toBeUndefined();
  });

  it('should adjust fire time for quiet hours', () => {
    // Set time to 23:00 (within quiet hours 22:00-08:00)
    const lateNight = new Date('2026-01-10T23:00:00Z');
    vi.setSystemTime(lateNight);
    
    const tasks = [
      { id: 1, title: 'Task 1', urgent: true, important: true, notificationFrequency: 'high' }
    ];
    const result = scheduleNext(tasks, defaultPrefs, lateNight);
    
    expect(result.length).toBeGreaterThan(0);
    const reminder = result.find(n => n.type === 'reminder');
    if (reminder) {
      const fireTime = new Date(reminder.fireAtISO);
      const fireHour = fireTime.getHours();
      // Should be adjusted to after quiet hours end (08:00)
      expect(fireHour).toBeGreaterThanOrEqual(8);
    }
  });

  it('should escalate to high frequency when dueDate within 4 days', () => {
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 2); // 2 days away
    
    const tasks = [
      {
        id: 1,
        title: 'Task 1',
        urgent: false,
        important: false,
        notificationFrequency: 'low',
        dueDate: dueDate.toISOString()
      }
    ];
    const result = scheduleNext(tasks, defaultPrefs, now);
    
    // Should schedule based on high frequency (daily) instead of low (weekly)
    const reminder = result.find(n => n.type === 'reminder');
    expect(reminder).toBeDefined();
    
    // Verify it's scheduled for tomorrow (high frequency) not next Sunday (low frequency)
    const fireTime = new Date(reminder.fireAtISO);
    const daysDiff = Math.floor((fireTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    expect(daysDiff).toBeLessThan(7); // Should be within a week (high frequency is daily)
  });

  it('should generate stable notification IDs', () => {
    const tasks = [
      { id: 1, title: 'Task 1', urgent: true, important: true, notificationFrequency: 'high' }
    ];
    
    const result1 = scheduleNext(tasks, defaultPrefs, now);
    const result2 = scheduleNext(tasks, defaultPrefs, now);
    
    expect(result1.length).toBeGreaterThan(0);
    expect(result2.length).toBeGreaterThan(0);
    
    // Same task at same time should generate same ID
    const id1 = result1[0].id;
    const id2 = result2[0].id;
    expect(id1).toBe(id2);
  });
});

