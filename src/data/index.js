/**
 * Repository selection and export
 * 
 * Selects the appropriate task repository implementation based on environment variable.
 * - VITE_TASK_REPO_MODE=local (default) => LocalTaskRepository (localStorage)
 * - VITE_TASK_REPO_MODE=hybrid => HybridTaskRepository (local + remote sync)
 * - VITE_TASK_REPO_MODE=remote => RemoteTaskRepositoryStub (placeholder, not fully implemented)
 * 
 * All UI code should import taskRepository from this file, not directly from concrete implementations.
 * 
 * Note: HybridTaskRepository requires authContext, which must be provided via getTaskRepository(authContext).
 */

import { loadTasks as loadLocalTasks, saveTasks as saveLocalTasks, clearTasks as clearLocalTasks } from './LocalTaskRepository.js';
import { loadTasks as loadStubTasks, saveTasks as saveStubTasks, clearTasks as clearStubTasks } from './RemoteTaskRepositoryStub.js';
import { HybridTaskRepository } from './HybridTaskRepository.js';

const repoMode = import.meta.env.VITE_TASK_REPO_MODE || import.meta.env.VITE_TASK_REPO || 'local';

/**
 * Gets the task repository instance
 * @param {Object} authContext - Auth context (required for hybrid mode)
 * @returns {Object} Task repository with loadTasks, saveTasks, clearTasks methods
 */
export function getTaskRepository(authContext) {
  if (repoMode === 'hybrid') {
    if (!authContext) {
      // Fallback to local if no auth context provided
      console.warn('Hybrid mode requires authContext, falling back to local');
      return {
        loadTasks: loadLocalTasks,
        saveTasks: saveLocalTasks,
        clearTasks: clearLocalTasks
      };
    }
    const hybridRepo = new HybridTaskRepository(authContext);
    return {
      loadTasks: hybridRepo.loadTasks.bind(hybridRepo),
      saveTasks: hybridRepo.saveTasks.bind(hybridRepo),
      clearTasks: hybridRepo.clearTasks.bind(hybridRepo)
    };
  }

  if (repoMode === 'remote') {
    return {
      loadTasks: loadStubTasks,
      saveTasks: saveStubTasks,
      clearTasks: clearStubTasks
    };
  }

  // Default to local storage
  return {
    loadTasks: loadLocalTasks,
    saveTasks: saveLocalTasks,
    clearTasks: clearLocalTasks
  };
}

// Default export for backward compatibility (local only, no auth)
// For hybrid mode, use getTaskRepository(authContext) instead
const defaultRepo = {
  loadTasks: loadLocalTasks,
  saveTasks: saveLocalTasks,
  clearTasks: clearLocalTasks
};

export const loadTasks = defaultRepo.loadTasks;
export const saveTasks = defaultRepo.saveTasks;
export const clearTasks = defaultRepo.clearTasks;

// Also export as named export for convenience
export const taskRepository = defaultRepo;

