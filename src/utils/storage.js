/**
 * Storage utilities for persisting tasks to localStorage
 * 
 * Storage format:
 * - Version 1: { version: 1, tasks: [...] }
 * - Version 0 (legacy): [...] (array of tasks, no version wrapper)
 */

export const STORAGE_KEY = "eisenhower.tasks.v1";
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Loads raw data from localStorage (may be old array format or new versioned format)
 * @returns {Object|null} Versioned schema object if valid, null otherwise
 * @returns {Object.version} Schema version (0 for legacy array, 1 for versioned)
 * @returns {Object.tasks} Array of tasks (or raw array for version 0)
 */
export function loadRawStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }
    
    const parsed = JSON.parse(stored);
    
    // Check if it's the new versioned format
    if (parsed && typeof parsed === 'object' && 'version' in parsed && 'tasks' in parsed) {
      // Version 1 format
      if (parsed.version === 1 && Array.isArray(parsed.tasks)) {
        return { version: 1, tasks: parsed.tasks };
      }
      // Unknown version - treat as corrupted
      return null;
    }
    
    // Check if it's the old array format (version 0)
    if (Array.isArray(parsed)) {
      return { version: 0, tasks: parsed };
    }
    
    // Invalid format
    return null;
  } catch (error) {
    // If JSON.parse fails or any other error, return null
    return null;
  }
}

/**
 * Saves tasks to localStorage in versioned format
 * @param {Array} tasks - Array of task objects to save
 */
export function saveTasks(tasks) {
  try {
    if (!Array.isArray(tasks)) {
      console.error('saveTasks: tasks must be an array');
      return;
    }
    
    // Guard against extremely large arrays (e.g., > 10000 tasks)
    if (tasks.length > 10000) {
      console.error('saveTasks: tasks array too large, refusing to save');
      return;
    }
    
    const versioned = {
      version: CURRENT_SCHEMA_VERSION,
      tasks: tasks
    };
    
    const json = JSON.stringify(versioned);
    localStorage.setItem(STORAGE_KEY, json);
  } catch (error) {
    // Silently fail if localStorage is unavailable or quota exceeded
    // In production, might want to log this
    console.error('Failed to save tasks to localStorage:', error);
  }
}

/**
 * Clears tasks from localStorage
 */
export function clearTasks() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // Silently fail if localStorage is unavailable
  }
}

