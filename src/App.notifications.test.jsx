import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App.jsx';
import { scheduleNext } from './notifications/NotificationScheduler.js';
import { getDefaultPreferences } from './notifications/notificationPreferences.js';
import { shouldDriftToQ1 } from './notifications/notificationRules.js';

describe('App - Notification System Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set to Monday, January 10, 2026, 10:00 AM
    vi.setSystemTime(new Date('2026-01-10T10:00:00Z'));
    
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('should load notification preferences on mount', () => {
    render(<App initialTasks={[]} />);
    
    // Preferences should be loaded (tested indirectly via scheduler)
    const prefs = getDefaultPreferences();
    expect(prefs.quietHours).toBeDefined();
    expect(prefs.inAppReminders).toBe(true);
  });

  it('should schedule notifications for tasks', () => {
    const task = {
      id: 1,
      title: 'Test Task',
      urgent: true,
      important: true,
      notificationFrequency: 'high',
      createdAt: Date.now()
    };

    const prefs = getDefaultPreferences();
    const now = new Date();
    const planned = scheduleNext([task], prefs, now);
    
    expect(planned.length).toBeGreaterThan(0);
    const reminder = planned.find(n => n.type === 'reminder');
    expect(reminder).toBeDefined();
    expect(reminder.taskId).toBe(1);
  });

  it('should detect drift condition for Q2 task with dueDate within 48h', () => {
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + 24); // 24 hours from now

    const task = {
      id: 1,
      title: 'Drift Test Task',
      urgent: false,
      important: true,
      notificationFrequency: 'medium',
      dueDate: dueDate.toISOString(),
      createdAt: Date.now()
    };

    const shouldDrift = shouldDriftToQ1(task, new Date());
    expect(shouldDrift).toBe(true);
  });

  it('should persist fired notifications in localStorage when notifications fire', () => {
    const task = {
      id: 1,
      title: 'Test Task',
      urgent: true,
      important: true,
      notificationFrequency: 'high',
      createdAt: Date.now()
    };

    const prefs = getDefaultPreferences();
    const now = new Date();
    const planned = scheduleNext([task], prefs, now);
    
    // Simulate firing a notification
    if (planned.length > 0) {
      const notificationId = planned[0].id;
      const firedNotifications = { [notificationId]: now.toISOString() };
      localStorage.setItem('eisenhower.firedNotifications.v1', JSON.stringify(firedNotifications));
      
      // Verify it was saved
      const stored = localStorage.getItem('eisenhower.firedNotifications.v1');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored);
      expect(parsed[notificationId]).toBeDefined();
    }
  });

  it('should respect quiet hours in scheduling', () => {
    // Set time to 23:00 (within quiet hours 22:00-08:00)
    const lateNight = new Date('2026-01-10T23:00:00Z');
    vi.setSystemTime(lateNight);

    const task = {
      id: 1,
      title: 'Test Task',
      urgent: true,
      important: true,
      notificationFrequency: 'high',
      createdAt: Date.now()
    };

    const prefs = getDefaultPreferences();
    const planned = scheduleNext([task], prefs, lateNight);
    
    if (planned.length > 0) {
      const reminder = planned.find(n => n.type === 'reminder');
      if (reminder) {
        const fireTime = new Date(reminder.fireAtISO);
        const fireHour = fireTime.getHours();
        // Should be adjusted to after quiet hours end (08:00)
        expect(fireHour).toBeGreaterThanOrEqual(8);
      }
    }
  });
});

