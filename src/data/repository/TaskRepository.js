/**
 * TaskRepository - User-scoped task storage wrapper
 * 
 * Wraps TaskStore to provide user-scoped storage namespacing.
 * Uses SessionStore to get current userId and namespaces storage keys:
 * - anonymous user: "tasks::anon"
 * - signed-in user: "tasks::<userId>"
 * 
 * Exposes the same interface as TaskStore:
 * - loadTasks(): loads tasks from current user's scope
 * - saveTasks(tasks): saves tasks to current user's scope
 * - clearTasks(): clears tasks from current user's scope
 * 
 * Future-proofed for Supabase/Firebase by making APIs backend-agnostic.
 */

import * as TaskStore from '../storage/TaskStore.js';
import { getSession } from '../session/SessionStore.js';

/**
 * Gets the storage key for the current user
 * @returns {string} Storage key (e.g., "tasks::anon" or "tasks::user_xxx")
 */
function getStorageKey() {
  const session = getSession();
  if (session.isSignedIn && session.userId) {
    return `tasks::${session.userId}`;
  }
  return 'tasks::anon';
}

/**
 * Loads tasks from the current user's storage scope
 * @returns {Promise<{ tasks: Array, meta: { version: number } }>} Returns tasks and metadata
 */
export async function loadTasks() {
  const storageKey = getStorageKey();
  return await TaskStore.loadTasks({ storageKey });
}

/**
 * Saves tasks to the current user's storage scope
 * @param {Array} tasks - Array of task objects to save
 * @returns {Promise<void>}
 */
export async function saveTasks(tasks) {
  const storageKey = getStorageKey();
  return await TaskStore.saveTasks(tasks, { storageKey });
}

/**
 * Clears tasks from the current user's storage scope
 * @returns {Promise<void>}
 */
export async function clearTasks() {
  const storageKey = getStorageKey();
  return await TaskStore.clearTasks({ storageKey });
}

