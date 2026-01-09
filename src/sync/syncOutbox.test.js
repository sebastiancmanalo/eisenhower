import { describe, it, expect, beforeEach } from 'vitest';
import { getOutbox, enqueueOutboxOperation, flushOutbox, clearOutbox } from './syncOutbox.js';

describe('syncOutbox', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should enqueue operation to outbox', async () => {
    await enqueueOutboxOperation({
      type: 'saveSnapshot',
      payload: { tasks: [{ id: '1', title: 'Task 1' }], userId: 'user-1' }
    });

    const outbox = getOutbox();
    expect(outbox).toHaveLength(1);
    expect(outbox[0].type).toBe('saveSnapshot');
    expect(outbox[0].payload.userId).toBe('user-1');
    expect(outbox[0].payload.tasks).toHaveLength(1);
  });

  it('should dedupe outbox: keep only latest snapshot per userId', async () => {
    await enqueueOutboxOperation({
      type: 'saveSnapshot',
      payload: { tasks: [{ id: '1', title: 'Task 1' }], userId: 'user-1' }
    });

    await enqueueOutboxOperation({
      type: 'saveSnapshot',
      payload: { tasks: [{ id: '1', title: 'Task 1 Updated' }], userId: 'user-1' }
    });

    const outbox = getOutbox();
    expect(outbox).toHaveLength(1);
    expect(outbox[0].payload.tasks[0].title).toBe('Task 1 Updated');
  });

  it('should flush outbox when remote succeeds', async () => {
    await enqueueOutboxOperation({
      type: 'saveSnapshot',
      payload: { tasks: [{ id: '1', title: 'Task 1' }], userId: 'user-1' }
    });

    const mockSaveTasksForUser = vi.fn().mockResolvedValue(undefined);

    await flushOutbox('user-1', mockSaveTasksForUser);

    expect(mockSaveTasksForUser).toHaveBeenCalledWith('user-1', [{ id: '1', title: 'Task 1' }]);
    
    const outbox = getOutbox();
    expect(outbox).toHaveLength(0);
  });

  it('should keep operation in outbox when remote fails', async () => {
    await enqueueOutboxOperation({
      type: 'saveSnapshot',
      payload: { tasks: [{ id: '1', title: 'Task 1' }], userId: 'user-1' }
    });

    const mockSaveTasksForUser = vi.fn().mockRejectedValue(new Error('Network error'));

    await flushOutbox('user-1', mockSaveTasksForUser);

    const outbox = getOutbox();
    expect(outbox).toHaveLength(1);
  });

  it('should clear outbox', async () => {
    await enqueueOutboxOperation({
      type: 'saveSnapshot',
      payload: { tasks: [{ id: '1', title: 'Task 1' }], userId: 'user-1' }
    });

    await clearOutbox();

    const outbox = getOutbox();
    expect(outbox).toHaveLength(0);
  });
});

