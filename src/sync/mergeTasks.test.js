import { describe, it, expect } from 'vitest';
import { mergeLocalAndRemote } from './mergeTasks.js';

describe('mergeLocalAndRemote', () => {
  it('should merge when local newer wins (higher revision)', () => {
    const localTasks = [
      { id: '1', title: 'Task 1', revision: 5, updatedAt: '2026-01-08T10:00:00.000Z' }
    ];
    const remoteTasks = [
      { id: '1', title: 'Task 1 Updated', revision: 3, updatedAt: '2026-01-08T09:00:00.000Z' }
    ];

    const result = mergeLocalAndRemote(localTasks, remoteTasks);
    
    expect(result.mergedTasks).toHaveLength(1);
    expect(result.mergedTasks[0].title).toBe('Task 1');
    expect(result.mergedTasks[0].revision).toBe(5);
    expect(result.changedLocal).toContain('1');
  });

  it('should merge when remote newer wins (higher revision)', () => {
    const localTasks = [
      { id: '1', title: 'Task 1', revision: 3, updatedAt: '2026-01-08T09:00:00.000Z' }
    ];
    const remoteTasks = [
      { id: '1', title: 'Task 1 Updated', revision: 5, updatedAt: '2026-01-08T10:00:00.000Z' }
    ];

    const result = mergeLocalAndRemote(localTasks, remoteTasks);
    
    expect(result.mergedTasks).toHaveLength(1);
    expect(result.mergedTasks[0].title).toBe('Task 1 Updated');
    expect(result.mergedTasks[0].revision).toBe(5);
    expect(result.changedRemote).toContain('1');
  });

  it('should use updatedAt tie-break when revision equal', () => {
    const localTasks = [
      { id: '1', title: 'Task 1 Local', revision: 5, updatedAt: '2026-01-08T10:00:00.000Z' }
    ];
    const remoteTasks = [
      { id: '1', title: 'Task 1 Remote', revision: 5, updatedAt: '2026-01-08T11:00:00.000Z' }
    ];

    const result = mergeLocalAndRemote(localTasks, remoteTasks);
    
    expect(result.mergedTasks).toHaveLength(1);
    expect(result.mergedTasks[0].title).toBe('Task 1 Remote');
    expect(result.changedRemote).toContain('1');
  });

  it('should handle deletion tombstone wins when newer than other side', () => {
    const localTasks = [
      { id: '1', title: 'Task 1', revision: 5, updatedAt: '2026-01-08T09:00:00.000Z', deletedAt: '2026-01-08T11:00:00.000Z' }
    ];
    const remoteTasks = [
      { id: '1', title: 'Task 1 Updated', revision: 3, updatedAt: '2026-01-08T10:00:00.000Z' }
    ];

    const result = mergeLocalAndRemote(localTasks, remoteTasks);
    
    expect(result.mergedTasks).toHaveLength(1);
    expect(result.mergedTasks[0].deletedAt).toBe('2026-01-08T11:00:00.000Z');
    expect(result.changedLocal).toContain('1');
  });

  it('should handle deletion tombstone loses when older than other side', () => {
    const localTasks = [
      { id: '1', title: 'Task 1', revision: 5, updatedAt: '2026-01-08T10:00:00.000Z', deletedAt: '2026-01-08T09:00:00.000Z' }
    ];
    const remoteTasks = [
      { id: '1', title: 'Task 1 Updated', revision: 3, updatedAt: '2026-01-08T11:00:00.000Z' }
    ];

    const result = mergeLocalAndRemote(localTasks, remoteTasks);
    
    expect(result.mergedTasks).toHaveLength(1);
    expect(result.mergedTasks[0].deletedAt).toBeUndefined();
    expect(result.mergedTasks[0].title).toBe('Task 1 Updated');
    expect(result.changedRemote).toContain('1');
  });

  it('should preserve unknown fields (forward compat)', () => {
    const localTasks = [
      { id: '1', title: 'Task 1', revision: 5, updatedAt: '2026-01-08T10:00:00.000Z', customField: 'local' }
    ];
    const remoteTasks = [
      { id: '1', title: 'Task 1', revision: 3, updatedAt: '2026-01-08T09:00:00.000Z', customField: 'remote' }
    ];

    const result = mergeLocalAndRemote(localTasks, remoteTasks);
    
    expect(result.mergedTasks).toHaveLength(1);
    expect(result.mergedTasks[0].customField).toBe('local');
  });

  it('should not duplicate ids', () => {
    const localTasks = [
      { id: '1', title: 'Task 1', revision: 5, updatedAt: '2026-01-08T10:00:00.000Z' },
      { id: '2', title: 'Task 2', revision: 3, updatedAt: '2026-01-08T09:00:00.000Z' }
    ];
    const remoteTasks = [
      { id: '1', title: 'Task 1 Updated', revision: 3, updatedAt: '2026-01-08T09:00:00.000Z' },
      { id: '2', title: 'Task 2 Updated', revision: 5, updatedAt: '2026-01-08T10:00:00.000Z' }
    ];

    const result = mergeLocalAndRemote(localTasks, remoteTasks);
    
    expect(result.mergedTasks).toHaveLength(2);
    const ids = result.mergedTasks.map(t => t.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('should include task from one side if missing on other', () => {
    const localTasks = [
      { id: '1', title: 'Task 1', revision: 5, updatedAt: '2026-01-08T10:00:00.000Z' }
    ];
    const remoteTasks = [
      { id: '2', title: 'Task 2', revision: 3, updatedAt: '2026-01-08T09:00:00.000Z' }
    ];

    const result = mergeLocalAndRemote(localTasks, remoteTasks);
    
    expect(result.mergedTasks).toHaveLength(2);
    const ids = result.mergedTasks.map(t => t.id).sort();
    expect(ids).toEqual(['1', '2']);
  });

  it('should keep tombstones (deletedAt) so remote deletions propagate', () => {
    const localTasks = [
      { id: '1', title: 'Task 1', revision: 3, updatedAt: '2026-01-08T09:00:00.000Z' }
    ];
    const remoteTasks = [
      { id: '1', title: 'Task 1', revision: 5, updatedAt: '2026-01-08T10:00:00.000Z', deletedAt: '2026-01-08T11:00:00.000Z' }
    ];

    const result = mergeLocalAndRemote(localTasks, remoteTasks);
    
    expect(result.mergedTasks).toHaveLength(1);
    expect(result.mergedTasks[0].deletedAt).toBe('2026-01-08T11:00:00.000Z');
    expect(result.changedRemote).toContain('1');
  });
});

