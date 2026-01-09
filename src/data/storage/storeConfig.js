/**
 * Store configuration - selects local or remote storage implementation
 * 
 * Controls which storage implementation App.jsx uses:
 * - 'local' (default): TaskStore (localStorage)
 * - 'remote': RemoteTaskStore.stub (throws "Not configured" until implemented)
 * 
 * Future: When Supabase/Firebase is implemented, replace RemoteTaskStore.stub
 * with real implementation and all App logic will automatically use remote storage.
 */

import * as TaskStore from './TaskStore.js';
import * as RemoteTaskStore from './RemoteTaskStore.stub.js';

const STORAGE_TYPE = import.meta.env.VITE_STORAGE_TYPE || 'local';

/**
 * Gets the storage implementation based on config
 * @returns {Object} Storage implementation with loadTasks, saveTasks, clearTasks
 */
export function getStore() {
  if (STORAGE_TYPE === 'remote') {
    // Use remote storage (stub for now)
    return RemoteTaskStore;
  }

  // Default to local storage
  return TaskStore;
}

/**
 * Gets storage type (for debugging/logging)
 * @returns {string} 'local' or 'remote'
 */
export function getStorageType() {
  return STORAGE_TYPE;
}

