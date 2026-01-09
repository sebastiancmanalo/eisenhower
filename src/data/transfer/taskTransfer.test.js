import { describe, it, expect, vi } from 'vitest';
import { serializeTasksForExport, parseImportedTasks, mergeTasks } from './taskTransfer.js';

describe('taskTransfer', () => {
  describe('serializeTasksForExport', () => {
    it('should produce valid JSON with version 1, tasks array, and meta', () => {
      const tasks = [
        { id: 1, title: 'Task 1', urgent: true, important: true },
        { id: 2, title: 'Task 2', urgent: false, important: true }
      ];

      const jsonString = serializeTasksForExport(tasks);
      const parsed = JSON.parse(jsonString);

      expect(parsed.version).toBe(1);
      expect(parsed.exportedAt).toBeDefined();
      expect(typeof parsed.exportedAt).toBe('string');
      expect(new Date(parsed.exportedAt).toISOString()).toBe(parsed.exportedAt);
      expect(Array.isArray(parsed.tasks)).toBe(true);
      expect(parsed.tasks).toEqual(tasks);
      expect(parsed.meta).toEqual({
        app: 'Eisenhower',
        schema: 'tasks'
      });
    });

    it('should throw error if tasks is not an array', () => {
      expect(() => serializeTasksForExport(null)).toThrow('Tasks must be an array');
      expect(() => serializeTasksForExport('not an array')).toThrow('Tasks must be an array');
      expect(() => serializeTasksForExport({})).toThrow('Tasks must be an array');
    });

    it('should handle empty tasks array', () => {
      const jsonString = serializeTasksForExport([]);
      const parsed = JSON.parse(jsonString);
      expect(parsed.tasks).toEqual([]);
      expect(parsed.version).toBe(1);
    });
  });

  describe('parseImportedTasks', () => {
    it('should parse versioned object format (version 1)', () => {
      const exportData = {
        version: 1,
        exportedAt: '2026-01-05T12:00:00.000Z',
        tasks: [
          { id: 1, title: 'Task 1' },
          { id: 2, title: 'Task 2' }
        ],
        meta: {
          app: 'Eisenhower',
          schema: 'tasks'
        }
      };

      const result = parseImportedTasks(JSON.stringify(exportData));
      expect(result.tasks).toEqual(exportData.tasks);
      expect(result.meta.version).toBe(1);
      expect(result.meta.exportedAt).toBe('2026-01-05T12:00:00.000Z');
    });

    it('should parse legacy array format', () => {
      const arrayData = [
        { id: 1, title: 'Task 1' },
        { id: 2, name: 'Task 2' } // Accepts name as well
      ];

      const result = parseImportedTasks(JSON.stringify(arrayData));
      expect(result.tasks).toEqual(arrayData);
      expect(result.meta.version).toBe(0);
      expect(result.meta.exportedAt).toBe(null);
    });

    it('should accept tasks with name field instead of title', () => {
      const exportData = {
        version: 1,
        exportedAt: '2026-01-05T12:00:00.000Z',
        tasks: [
          { id: 1, name: 'Task 1' },
          { id: 2, name: 'Task 2' }
        ]
      };

      const result = parseImportedTasks(JSON.stringify(exportData));
      expect(result.tasks).toEqual(exportData.tasks);
    });

    it('should fail gracefully on invalid JSON', () => {
      expect(() => parseImportedTasks('invalid json')).toThrow('Invalid JSON file');
      expect(() => parseImportedTasks('{ invalid }')).toThrow('Invalid JSON file');
    });

    it('should throw error for unsupported version', () => {
      const invalidVersion = {
        version: 999,
        tasks: [{ id: 1, title: 'Task 1' }]
      };
      expect(() => parseImportedTasks(JSON.stringify(invalidVersion))).toThrow('Unsupported export version: 999');
    });

    it('should throw error for invalid format', () => {
      const invalidFormat = { notVersion: 1, notTasks: [] };
      expect(() => parseImportedTasks(JSON.stringify(invalidFormat))).toThrow('Invalid file format');
    });

    it('should validate that tasks is an array', () => {
      const invalidFormat = {
        version: 1,
        tasks: 'not an array'
      };
      expect(() => parseImportedTasks(JSON.stringify(invalidFormat))).toThrow('Invalid format: tasks must be an array');
    });

    it('should validate tasks have id and title/name', () => {
      const invalidTasks = {
        version: 1,
        tasks: [
          { id: 1, title: 'Valid' },
          { id: 2 }, // Missing title/name
          { title: 'No ID' }, // Missing id
          { id: 4, title: 'Valid' }
        ]
      };
      expect(() => parseImportedTasks(JSON.stringify(invalidTasks))).toThrow(/Invalid tasks found/);
    });

    it('should throw error if input is not a string', () => {
      expect(() => parseImportedTasks(null)).toThrow('Input must be a JSON string');
      expect(() => parseImportedTasks(123)).toThrow('Input must be a JSON string');
      expect(() => parseImportedTasks({})).toThrow('Input must be a JSON string');
    });

    it('should handle empty tasks array', () => {
      const emptyExport = {
        version: 1,
        exportedAt: '2026-01-05T12:00:00.000Z',
        tasks: []
      };
      const result = parseImportedTasks(JSON.stringify(emptyExport));
      expect(result.tasks).toEqual([]);
      expect(result.meta.version).toBe(1);
    });
  });

  describe('mergeTasks', () => {
    it('should dedupe by id and preserve order (existing order kept, new appended)', () => {
      const existing = [
        { id: 1, title: 'Existing Task 1', urgent: true },
        { id: 2, title: 'Existing Task 2', urgent: false },
        { id: 3, title: 'Existing Task 3', urgent: true }
      ];
      const incoming = [
        { id: 1, title: 'Updated Task 1', urgent: false }, // Should overwrite existing id:1
        { id: 4, title: 'New Task 4', urgent: true } // Should be appended
      ];

      const merged = mergeTasks(existing, incoming);
      
      expect(merged).toHaveLength(4);
      
      // Existing order preserved, with updates
      expect(merged[0].id).toBe(1);
      expect(merged[0].title).toBe('Updated Task 1'); // Incoming wins
      expect(merged[0].urgent).toBe(false); // Incoming wins
      
      expect(merged[1].id).toBe(2);
      expect(merged[1].title).toBe('Existing Task 2'); // Unchanged
      
      expect(merged[2].id).toBe(3);
      expect(merged[2].title).toBe('Existing Task 3'); // Unchanged
      
      // New task appended at end
      expect(merged[3].id).toBe(4);
      expect(merged[3].title).toBe('New Task 4');
    });

    it('should handle empty existing tasks', () => {
      const existing = [];
      const incoming = [
        { id: 1, title: 'Task 1' },
        { id: 2, title: 'Task 2' }
      ];
      
      const merged = mergeTasks(existing, incoming);
      expect(merged).toHaveLength(2);
      expect(merged[0].title).toBe('Task 1');
      expect(merged[1].title).toBe('Task 2');
    });

    it('should handle empty incoming tasks', () => {
      const existing = [
        { id: 1, title: 'Task 1' },
        { id: 2, title: 'Task 2' }
      ];
      const incoming = [];
      
      const merged = mergeTasks(existing, incoming);
      expect(merged).toHaveLength(2);
      expect(merged[0].title).toBe('Task 1');
      expect(merged[1].title).toBe('Task 2');
    });

    it('should handle non-array inputs gracefully', () => {
      expect(mergeTasks(null, [])).toEqual([]);
      expect(mergeTasks([], null)).toEqual([]);
      expect(mergeTasks(undefined, undefined)).toEqual([]);
    });

    it('should handle tasks with string ids', () => {
      const existing = [{ id: '1', title: 'Task 1' }];
      const incoming = [{ id: 1, title: 'Task 1 Updated' }];
      
      const merged = mergeTasks(existing, incoming);
      // String '1' and number 1 should be treated as same id
      expect(merged).toHaveLength(1);
      expect(merged[0].title).toBe('Task 1 Updated');
    });

    it('should skip tasks without id', () => {
      const existing = [{ id: 1, title: 'Task 1' }];
      const incoming = [
        { title: 'Task without ID' }, // Should be skipped
        { id: 2, title: 'Task 2' }
      ];
      
      const merged = mergeTasks(existing, incoming);
      expect(merged).toHaveLength(2); // Existing task 1 + incoming task 2
      expect(merged.find(t => t.id === 1)).toBeDefined();
      expect(merged.find(t => t.id === 2)).toBeDefined();
      expect(merged.find(t => !t.id)).toBeUndefined();
    });

    it('should preserve order when all incoming tasks are updates', () => {
      const existing = [
        { id: 3, title: 'Task 3' },
        { id: 1, title: 'Task 1' },
        { id: 2, title: 'Task 2' }
      ];
      const incoming = [
        { id: 1, title: 'Updated Task 1' },
        { id: 2, title: 'Updated Task 2' },
        { id: 3, title: 'Updated Task 3' }
      ];
      
      const merged = mergeTasks(existing, incoming);
      // Should preserve existing order (3, 1, 2) with updates
      expect(merged[0].id).toBe(3);
      expect(merged[0].title).toBe('Updated Task 3');
      expect(merged[1].id).toBe(1);
      expect(merged[1].title).toBe('Updated Task 1');
      expect(merged[2].id).toBe(2);
      expect(merged[2].title).toBe('Updated Task 2');
    });

    it('should handle duplicate ids in incoming array (last one wins)', () => {
      const existing = [{ id: 1, title: 'Existing' }];
      const incoming = [
        { id: 1, title: 'First' },
        { id: 1, title: 'Last' } // Last one should win
      ];
      
      const merged = mergeTasks(existing, incoming);
      expect(merged).toHaveLength(1);
      expect(merged[0].title).toBe('Last');
    });
  });
});

