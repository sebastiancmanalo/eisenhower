import { describe, it, expect, vi, beforeEach } from 'vitest';
import { serializeTasksForExport, parseImportedTasks, mergeTasks } from './data/transfer/taskTransfer.js';
import { getStore } from './data/storage/storeConfig.js';

describe('App Task Transfer Integration', () => {
  let taskStore;

  beforeEach(() => {
    taskStore = getStore();
    // Clear storage before each test
    try {
      taskStore.clearTasks();
    } catch (error) {
      // Ignore localStorage errors in test environment
    }
    vi.clearAllMocks();
  });

  it('should export tasks in correct format and parse them back', async () => {
    // Test export/import roundtrip
    const tasks = [
      { 
        id: '1', 
        title: 'Task 1', 
        urgent: true, 
        important: true, 
        createdAt: '2026-01-08T12:00:00.000Z', 
        dueDate: null, 
        notificationFrequency: 'high' 
      },
      { 
        id: '2', 
        title: 'Task 2', 
        urgent: false, 
        important: true, 
        createdAt: '2026-01-08T12:00:00.000Z', 
        dueDate: null, 
        notificationFrequency: 'medium' 
      }
    ];

    // Export tasks
    const jsonString = serializeTasksForExport(tasks);
    const parsed = JSON.parse(jsonString);
    expect(parsed.version).toBe(1);
    expect(parsed.meta.app).toBe('Eisenhower');
    expect(parsed.meta.schema).toBe('tasks');
    expect(Array.isArray(parsed.tasks)).toBe(true);
    expect(parsed.tasks.length).toBe(2);

    // Parse back
    const { tasks: parsedTasks } = parseImportedTasks(jsonString);
    expect(parsedTasks).toEqual(tasks);
  });

  it('should merge tasks correctly preserving order', () => {
    const existing = [
      { id: '1', title: 'Existing 1' },
      { id: '2', title: 'Existing 2' },
      { id: '3', title: 'Existing 3' }
    ];
    const incoming = [
      { id: '1', title: 'Updated 1' }, // Should update existing
      { id: '4', title: 'New 4' } // Should be appended
    ];

    const merged = mergeTasks(existing, incoming);
    expect(merged).toHaveLength(4);
    expect(merged[0].id).toBe('1');
    expect(merged[0].title).toBe('Updated 1'); // Incoming wins
    expect(merged[1].id).toBe('2');
    expect(merged[2].id).toBe('3');
    expect(merged[3].id).toBe('4'); // New task appended
    expect(merged[3].title).toBe('New 4');
  });

  it('should persist tasks after save and load cycle', async () => {
    const tasks = [
      { 
        id: '1', 
        title: 'Task 1', 
        urgent: true, 
        important: true, 
        createdAt: '2026-01-08T12:00:00.000Z', 
        dueDate: null, 
        notificationFrequency: 'high' 
      },
      { 
        id: '2', 
        title: 'Task 2', 
        urgent: false, 
        important: true, 
        createdAt: '2026-01-08T12:00:00.000Z', 
        dueDate: null, 
        notificationFrequency: 'medium' 
      }
    ];

    // Save tasks
    await taskStore.saveTasks(tasks);

    // Load tasks
    const { tasks: loadedTasks } = await taskStore.loadTasks();
    expect(loadedTasks).toHaveLength(2);
    expect(loadedTasks[0].id).toBe('1');
    expect(loadedTasks[1].id).toBe('2');
  });
});

