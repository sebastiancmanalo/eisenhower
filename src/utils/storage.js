/**
 * Storage utilities for persisting tasks to localStorage
 */

export const STORAGE_KEY = "eisenhower.tasks.v1";

/**
 * Loads tasks from localStorage
 * @returns {Array|null} Array of tasks if valid, null otherwise
 */
export function loadTasks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }
    
    const parsed = JSON.parse(stored);
    
    // Validate it's an array
    if (!Array.isArray(parsed)) {
      return null;
    }
    
    // Validate each item has at least id, title/name, urgent, important
    // Be permissive - just check for basic structure
    const isValid = parsed.every(task => {
      return (
        task &&
        typeof task === 'object' &&
        (task.id !== undefined) &&
        (task.title !== undefined || task.name !== undefined) &&
        (task.urgent !== undefined || typeof task.urgent === 'boolean') &&
        (task.important !== undefined || typeof task.important === 'boolean')
      );
    });
    
    if (!isValid) {
      return null;
    }
    
    return parsed;
  } catch (error) {
    // If JSON.parse fails or any other error, return null
    return null;
  }
}

/**
 * Saves tasks to localStorage
 * @param {Array} tasks - Array of task objects to save
 */
export function saveTasks(tasks) {
  try {
    const json = JSON.stringify(tasks);
    localStorage.setItem(STORAGE_KEY, json);
  } catch (error) {
    // Silently fail if localStorage is unavailable or quota exceeded
    // In production, might want to log this
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

