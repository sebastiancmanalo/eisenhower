import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadTasks, saveTasks, clearTasks } from './TaskStore.js';

const STORAGE_KEY = "eisenhower.tasks.v1";

describe('TaskStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up localStorage after each test
    localStorage.clear();
  });

  describe('loadTasks', () => {
    it('should return empty tasks and meta when no data stored', async () => {
      const result = await loadTasks();
      expect(result).toEqual({
        tasks: [],
        meta: { version: 1 }
      });
    });

    it('should load tasks from version 1 format', async () => {
      const tasks = [
        { id: 1, title: 'Task 1', urgent: true, important: true },
        { id: 2, title: 'Task 2', urgent: false, important: true }
      ];
      const versioned = { version: 1, tasks };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(versioned));

      const result = await loadTasks();
      expect(result.tasks).toEqual(tasks);
      expect(result.meta).toEqual({ version: 1 });
    });

    it('should load tasks from legacy array format (version 0)', async () => {
      const tasks = [
        { id: 1, title: 'Task 1', urgent: true, important: true },
        { id: 2, title: 'Task 2', urgent: false, important: true }
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));

      const result = await loadTasks();
      expect(result.tasks).toEqual(tasks);
      expect(result.meta).toEqual({ version: 0 });
    });

    it('should return empty tasks when JSON is corrupt', async () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json{broken');

      const result = await loadTasks();
      expect(result.tasks).toEqual([]);
      expect(result.meta).toEqual({ version: 1 });
    });

    it('should return empty tasks when storage has invalid format', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ invalid: 'format' }));

      const result = await loadTasks();
      expect(result.tasks).toEqual([]);
      expect(result.meta).toEqual({ version: 1 });
    });

    it('should return empty tasks when storage has unknown version', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 999, tasks: [] }));

      const result = await loadTasks();
      expect(result.tasks).toEqual([]);
      expect(result.meta).toEqual({ version: 1 });
    });

    it('should return empty tasks when version 1 tasks is not an array', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, tasks: 'not an array' }));

      const result = await loadTasks();
      expect(result.tasks).toEqual([]);
      expect(result.meta).toEqual({ version: 1 });
    });

    it('should handle localStorage.getItem throwing an error', async () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('localStorage unavailable');
      });

      const result = await loadTasks();
      expect(result.tasks).toEqual([]);
      expect(result.meta).toEqual({ version: 1 });

      localStorage.getItem = originalGetItem;
    });
  });

  describe('saveTasks', () => {
    it('should save tasks to localStorage in version 1 format', async () => {
      const tasks = [
        { id: 1, title: 'Task 1', urgent: true, important: true },
        { id: 2, title: 'Task 2', urgent: false, important: true }
      ];

      await saveTasks(tasks);

      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(stored);
      expect(parsed).toEqual({
        version: 1,
        tasks
      });
    });

    it('should handle empty array', async () => {
      await saveTasks([]);

      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(stored);
      expect(parsed).toEqual({
        version: 1,
        tasks: []
      });
    });

    it('should not save if tasks is not an array', async () => {
      await saveTasks({ invalid: 'data' });

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeNull();
    });

    it('should not save if tasks array is too large', async () => {
      const largeTasks = Array.from({ length: 10001 }, (_, i) => ({
        id: i,
        title: `Task ${i}`,
        urgent: false,
        important: false
      }));

      await saveTasks(largeTasks);

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeNull();
    });

    it('should handle localStorage.setItem throwing an error', async () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('localStorage quota exceeded');
      });

      const tasks = [{ id: 1, title: 'Task 1' }];
      // Should not throw
      await saveTasks(tasks);

      localStorage.setItem = originalSetItem;
    });
  });

  describe('clearTasks', () => {
    it('should clear tasks from localStorage', async () => {
      const tasks = [
        { id: 1, title: 'Task 1', urgent: true, important: true }
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, tasks }));

      await clearTasks();

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeNull();
    });

    it('should handle localStorage.removeItem throwing an error', async () => {
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = vi.fn(() => {
        throw new Error('localStorage unavailable');
      });

      // Should not throw
      await clearTasks();

      localStorage.removeItem = originalRemoveItem;
    });
  });

  describe('integration', () => {
    it('should save and load tasks correctly', async () => {
      const tasks = [
        { id: 1, title: 'Task 1', urgent: true, important: true },
        { id: 2, title: 'Task 2', urgent: false, important: true }
      ];

      await saveTasks(tasks);
      const result = await loadTasks();

      expect(result.tasks).toEqual(tasks);
      expect(result.meta.version).toBe(1);
    });

    it('should clear and reload empty tasks', async () => {
      const tasks = [{ id: 1, title: 'Task 1' }];
      await saveTasks(tasks);

      await clearTasks();
      const result = await loadTasks();

      expect(result.tasks).toEqual([]);
      expect(result.meta.version).toBe(1);
    });
  });
});

