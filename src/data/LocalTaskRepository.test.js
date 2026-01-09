import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadTasks, saveTasks, clearTasks } from './LocalTaskRepository.js';
import { STORAGE_KEY } from '../utils/storage.js';

describe('LocalTaskRepository', () => {
  beforeEach(() => {
    clearTasks();
  });

  afterEach(() => {
    clearTasks();
  });

  it('should load null when no tasks stored', async () => {
    const tasks = await loadTasks();
    expect(tasks).toBeNull();
  });

  it('should load and migrate tasks with missing fields', async () => {
    // Store old-format task (missing dueDate, notificationFrequency, createdAt)
    const oldTask = {
      id: 1,
      title: 'Test Task',
      urgent: true,
      important: true
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([oldTask]));

    const tasks = await loadTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      id: '1', // id converted to string
      title: 'Test Task',
      urgent: true,
      important: true,
      dueDate: null
    });
    // createdAt is converted to ISO string
    expect(tasks[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    // Sync fields are added
    expect(tasks[0].updatedAt).toBeDefined();
    expect(tasks[0].deletedAt).toBe(null);
    expect(tasks[0].completedAt).toBe(null);
    expect(tasks[0].deviceId).toBeDefined();
    expect(tasks[0].revision).toBe(0);
    // Q1 tasks should get 'high' notification frequency by default
    expect(tasks[0].notificationFrequency).toBe('high');
  });

  it('should migrate Q2 tasks with medium notification frequency', async () => {
    const oldTask = {
      id: 1,
      title: 'Test Task',
      urgent: false,
      important: true // Q2
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([oldTask]));

    const tasks = await loadTasks();
    expect(tasks[0].notificationFrequency).toBe('medium');
  });

  it('should migrate Q3/Q4 tasks with low notification frequency', async () => {
    const oldTask = {
      id: 1,
      title: 'Test Task',
      urgent: true,
      important: false // Q3
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([oldTask]));

    const tasks = await loadTasks();
    expect(tasks[0].notificationFrequency).toBe('low');
  });

  it('should preserve existing dueDate when present', async () => {
    const taskWithDueDate = {
      id: 1,
      title: 'Test Task',
      urgent: true,
      important: true,
      dueDate: '2026-01-10T00:00:00.000Z'
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([taskWithDueDate]));

    const tasks = await loadTasks();
    expect(tasks[0].dueDate).toBe('2026-01-10T00:00:00.000Z');
  });

  it('should preserve existing notificationFrequency when present', async () => {
    const taskWithFrequency = {
      id: 1,
      title: 'Test Task',
      urgent: true,
      important: true,
      notificationFrequency: 'low'
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([taskWithFrequency]));

    const tasks = await loadTasks();
    expect(tasks[0].notificationFrequency).toBe('low');
  });

  it('should save and load tasks with all fields', async () => {
    const tasksToSave = [
      {
        id: 1,
        title: 'Task 1',
        urgent: true,
        important: true,
        dueDate: '2026-01-10T00:00:00.000Z',
        notificationFrequency: 'high',
        createdAt: '2026-01-01T00:00:01.000Z' // ISO string
      },
      {
        id: 2,
        title: 'Task 2',
        urgent: false,
        important: true,
        dueDate: null,
        notificationFrequency: 'medium',
        createdAt: '2026-01-01T00:00:02.000Z' // ISO string
      }
    ];

    await saveTasks(tasksToSave);
    const loaded = await loadTasks();

    expect(loaded).toHaveLength(2);
    // Tasks are normalized, so fields may be converted
    expect(loaded[0].id).toBe('1'); // id converted to string
    expect(loaded[0].title).toBe('Task 1');
    expect(loaded[0].dueDate).toBe('2026-01-10T00:00:00.000Z');
    expect(loaded[0].notificationFrequency).toBe('high');
    expect(loaded[1].id).toBe('2');
    expect(loaded[1].title).toBe('Task 2');
    expect(loaded[1].dueDate).toBe(null);
    expect(loaded[1].notificationFrequency).toBe('medium');
  });

  it('should handle graceful failure when localStorage is unavailable', async () => {
    // Mock localStorage.setItem to throw
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = vi.fn(() => {
      throw new Error('QuotaExceededError');
    });

    const tasks = [
      { id: 1, title: 'Test', urgent: true, important: true }
    ];

    // Should not throw, should fail gracefully
    await expect(saveTasks(tasks)).resolves.not.toThrow();

    localStorage.setItem = originalSetItem;
  });

  it('should handle graceful failure when loading invalid JSON', async () => {
    localStorage.setItem(STORAGE_KEY, 'invalid json');

    const tasks = await loadTasks();
    // Should return null on parse errors (don't crash)
    expect(tasks).toBeNull();
  });

  it('should normalize name field to title', async () => {
    const taskWithName = {
      id: 1,
      name: 'Test Task',
      urgent: true,
      important: true
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([taskWithName]));

    const tasks = await loadTasks();
    expect(tasks[0].title).toBe('Test Task');
    expect(tasks[0].name).toBeUndefined();
  });

  it('should ensure urgent and important are boolean even if missing', async () => {
    const taskWithoutFlags = {
      id: 1,
      title: 'Test Task'
      // Missing urgent and important
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([taskWithoutFlags]));

    const tasks = await loadTasks();
    expect(typeof tasks[0].urgent).toBe('boolean');
    expect(typeof tasks[0].important).toBe('boolean');
    expect(tasks[0].urgent).toBe(false);
    expect(tasks[0].important).toBe(false);
  });

  it('should save tasks in versioned schema format (version 1)', async () => {
    const tasksToSave = [
      {
        id: 1,
        title: 'Task 1',
        urgent: true,
        important: true,
        dueDate: null,
        notificationFrequency: 'high',
        createdAt: 1000
      }
    ];

    await saveTasks(tasksToSave);
    
    // Check that storage contains versioned format
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(stored);
    expect(parsed).toHaveProperty('version');
    expect(parsed.version).toBe(1);
    expect(parsed).toHaveProperty('tasks');
    expect(Array.isArray(parsed.tasks)).toBe(true);
    expect(parsed.tasks).toHaveLength(1);
  });

  it('should migrate from version 0 (array) to version 1 (versioned format)', async () => {
    // Store old array format directly in localStorage
    const oldTask = {
      id: 1,
      title: 'Old Task',
      urgent: true,
      important: true
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([oldTask]));

    // Load should migrate to version 1
    const tasks = await loadTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Old Task');

    // Check that storage was updated to version 1 format
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(stored);
    expect(parsed.version).toBe(1);
    expect(parsed.tasks).toHaveLength(1);
  });

  it('should handle corrupted JSON gracefully', async () => {
    // Invalid JSON
    localStorage.setItem(STORAGE_KEY, 'invalid json {');
    let tasks = await loadTasks();
    expect(tasks).toBeNull();

    // Valid JSON but not an array or versioned object
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ invalid: 'format' }));
    tasks = await loadTasks();
    expect(tasks).toBeNull();

    // Version 1 format but tasks is not an array
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, tasks: 'not an array' }));
    tasks = await loadTasks();
    expect(tasks).toBeNull();

    // Unknown version
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 999, tasks: [] }));
    tasks = await loadTasks();
    expect(tasks).toBeNull();
  });

  it('should handle extremely large arrays gracefully', async () => {
    // Create a large array (but not too large for test performance)
    const largeTaskArray = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      title: `Task ${i + 1}`,
      urgent: i % 2 === 0,
      important: i % 3 === 0,
      createdAt: Date.now()
    }));

    // Should save successfully
    await saveTasks(largeTaskArray);
    const loaded = await loadTasks();
    expect(loaded).toHaveLength(100);

    // Test that guardrail prevents saving non-arrays
    await saveTasks('not an array');
    // Should not crash, but also should not save invalid data
    // The save function should handle this gracefully
  });

  it('should preserve unknown fields during migration for forward compatibility', async () => {
    const taskWithUnknownFields = {
      id: 1,
      title: 'Test Task',
      urgent: true,
      important: true,
      customField: 'custom value',
      anotherField: { nested: 'data' },
      createdAt: 1234567890
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([taskWithUnknownFields]));

    const tasks = await loadTasks();
    expect(tasks[0].customField).toBe('custom value');
    expect(tasks[0].anotherField).toEqual({ nested: 'data' });
    // createdAt is converted to ISO string (number to ISO)
    expect(tasks[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should skip invalid tasks during migration without crashing', async () => {
    const mixedTasks = [
      { id: 1, title: 'Valid Task 1', urgent: true, important: true },
      { id: 2 }, // Missing title - invalid
      { id: 3, title: 'Valid Task 3', urgent: false, important: true },
      { title: 'Missing ID', urgent: true, important: true }, // Missing id - invalid
      { id: 5, title: 'Valid Task 5', urgent: true, important: false }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mixedTasks));

    const tasks = await loadTasks();
    // Should only load valid tasks
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.length).toBeLessThan(mixedTasks.length);
    // All loaded tasks should be valid
    tasks.forEach(task => {
      expect(task.id).toBeDefined();
      expect(task.title).toBeDefined();
    });
  });
});

