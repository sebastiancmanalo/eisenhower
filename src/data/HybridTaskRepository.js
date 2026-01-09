import { loadTasks as loadLocalTasks, saveTasks as saveLocalTasks, clearTasks as clearLocalTasks } from './LocalTaskRepository.js';
import { loadTasksForUser, saveTasksForUser } from './RemoteTaskRepositoryStub.js';
import { mergeLocalAndRemote } from '../sync/mergeTasks.js';
import { getOutbox, enqueueOutboxOperation, flushOutbox } from '../sync/syncOutbox.js';

/**
 * Hybrid repository that merges local and remote tasks
 * 
 * Implements TaskRepository interface:
 * - loadTasks(): loads local, optionally loads remote if authenticated, merges, saves merged back to local
 * - saveTasks(): saves local immediately, optionally saves remote if authenticated and online
 * - clearTasks(): clears local only (remote clear not implemented)
 * 
 * Requires auth context to determine if user is authenticated.
 * Fails gracefully if remote operations fail (local still works).
 */
export class HybridTaskRepository {
  constructor(authContext) {
    if (!authContext) {
      throw new Error('authContext is required');
    }
    this.authContext = authContext;
  }

  /**
   * Loads tasks by merging local and remote
   * @returns {Promise<Task[] | null>}
   */
  async loadTasks() {
    // Always load local first
    const localTasks = await loadLocalTasks() || [];

    // If user is authenticated, also load remote
    if (this.authContext.user && this.authContext.user.id) {
      try {
        const remoteTasks = await loadTasksForUser(this.authContext.user.id) || [];
        
        // Merge local and remote
        const { mergedTasks } = mergeLocalAndRemote(localTasks, remoteTasks);
        
        // Save merged back to local
        await saveLocalTasks(mergedTasks);
        
        return mergedTasks;
      } catch (error) {
        // Remote failed - still return local
        console.warn('Failed to load remote tasks, using local only:', error);
        return localTasks;
      }
    }

    // Not authenticated - return local only
    return localTasks;
  }

  /**
   * Saves tasks to local and optionally remote
   * @param {Task[]} tasks - Array of task objects to save
   * @returns {Promise<void>}
   */
  async saveTasks(tasks) {
    if (!Array.isArray(tasks)) {
      throw new Error('tasks must be an array');
    }

    // Always save local immediately
    await saveLocalTasks(tasks);

    // If user is authenticated and online, also save remote
    if (this.authContext.user && this.authContext.user.id) {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          await saveTasksForUser(this.authContext.user.id, tasks);
          
          // If save succeeded, try to flush outbox
          await flushOutbox(this.authContext.user.id, saveTasksForUser);
        } catch (error) {
          // Remote save failed - enqueue to outbox
          console.warn('Failed to save remote tasks, enqueueing to outbox:', error);
          await enqueueOutboxOperation({
            type: 'saveSnapshot',
            payload: { tasks, userId: this.authContext.user.id }
          });
        }
      } else {
        // Offline - enqueue to outbox
        await enqueueOutboxOperation({
          type: 'saveSnapshot',
          payload: { tasks, userId: this.authContext.user.id }
        });
      }
    }
  }

  /**
   * Clears local tasks only (remote clear not implemented)
   * @returns {Promise<void>}
   */
  async clearTasks() {
    await clearLocalTasks();
  }
}

