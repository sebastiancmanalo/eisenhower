/**
 * RemoteTaskStore - Stub implementation for remote storage
 * 
 * Provides the same function signatures as TaskStore but throws
 * "Not configured" errors. This will be replaced with real Supabase/Firebase
 * implementations later without changing App logic.
 * 
 * Functions:
 * - loadTasks(): throws "Not configured"
 * - saveTasks(tasks): throws "Not configured"
 * - clearTasks(): throws "Not configured"
 */

const NOT_CONFIGURED_ERROR = 'RemoteTaskStore: Not configured. Implement Supabase/Firebase integration.';

/**
 * Loads tasks from remote storage (not implemented)
 * @returns {Promise<{ tasks: Array, meta: { version: number } }>}
 * @throws {Error} Always throws "Not configured"
 */
export async function loadTasks() {
  throw new Error(NOT_CONFIGURED_ERROR);
}

/**
 * Saves tasks to remote storage (not implemented)
 * @param {Array} tasks - Array of task objects to save
 * @returns {Promise<void>}
 * @throws {Error} Always throws "Not configured"
 */
export async function saveTasks(tasks) {
  throw new Error(NOT_CONFIGURED_ERROR);
}

/**
 * Clears all persisted tasks from remote storage (not implemented)
 * @returns {Promise<void>}
 * @throws {Error} Always throws "Not configured"
 */
export async function clearTasks() {
  throw new Error(NOT_CONFIGURED_ERROR);
}

