/**
 * TaskStore - Storage abstraction layer for task persistence
 * 
 * Provides a simple interface for loading, saving, and clearing tasks.
 * Currently implemented using localStorage, but designed to be swappable
 * with remote storage (Supabase/Firebase) without changing App logic.
 * 
 * Functions:
 * - loadTasks({ storageKey }?): returns { tasks, meta } where meta includes version
 * - saveTasks(tasks, { storageKey }?): persists tasks
 * - clearTasks({ storageKey }?): clears persisted data
 * 
 * If storageKey is not provided, uses default key for backward compatibility.
 */

const DEFAULT_STORAGE_KEY = "eisenhower.tasks.v1";
const CURRENT_SCHEMA_VERSION = 1;

/**
 * Loads tasks from localStorage
 * @param {{ storageKey?: string }} options - Optional storage key override
 * @returns {Promise<{ tasks: Array, meta: { version: number } }>} Returns tasks and metadata, or empty array if no data/corrupted
 */
export async function loadTasks(options = {}) {
  const storageKey = options.storageKey || DEFAULT_STORAGE_KEY;
  
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      return { tasks: [], meta: { version: CURRENT_SCHEMA_VERSION } };
    }

    // Safe parse with fallback
    let parsed;
    try {
      parsed = JSON.parse(stored);
    } catch (parseError) {
      // Corrupt JSON - return empty
      console.error('Failed to parse stored tasks (corrupt JSON):', parseError);
      return { tasks: [], meta: { version: CURRENT_SCHEMA_VERSION } };
    }

    // Handle versioned format
    if (parsed && typeof parsed === 'object' && 'version' in parsed && 'tasks' in parsed) {
      // Version 1 format
      if (parsed.version === 1) {
        if (Array.isArray(parsed.tasks)) {
          return { tasks: parsed.tasks, meta: { version: parsed.version } };
        }
        // Version 1 with invalid tasks format - return empty (corrupted)
        console.error('Invalid tasks format in version 1 storage (tasks is not an array)');
        return { tasks: [], meta: { version: CURRENT_SCHEMA_VERSION } };
      }
      // Unknown version - return empty (corrupted)
      console.error('Unknown storage schema version:', parsed.version);
      return { tasks: [], meta: { version: CURRENT_SCHEMA_VERSION } };
    }

    // Handle legacy array format (version 0) - migrate to version 1
    if (Array.isArray(parsed)) {
      return { tasks: parsed, meta: { version: 0 } };
    }

    // Invalid format - return empty
    console.error('Invalid storage format:', parsed);
    return { tasks: [], meta: { version: CURRENT_SCHEMA_VERSION } };
  } catch (error) {
    // Any other error - return empty (don't crash)
    console.error('Failed to load tasks from storage:', error);
    return { tasks: [], meta: { version: CURRENT_SCHEMA_VERSION } };
  }
}

/**
 * Saves tasks to localStorage
 * @param {Array} tasks - Array of task objects to save
 * @param {{ storageKey?: string }} options - Optional storage key override
 * @returns {Promise<void>}
 */
export async function saveTasks(tasks, options = {}) {
  const storageKey = options.storageKey || DEFAULT_STORAGE_KEY;
  
  try {
    if (!Array.isArray(tasks)) {
      console.error('saveTasks: tasks must be an array');
      return;
    }

    // Guard against extremely large arrays
    if (tasks.length > 10000) {
      console.error('saveTasks: tasks array too large, refusing to save');
      return;
    }

    const versioned = {
      version: CURRENT_SCHEMA_VERSION,
      tasks: tasks
    };

    const json = JSON.stringify(versioned);
    localStorage.setItem(storageKey, json);
  } catch (error) {
    // Graceful failure - log but don't throw (don't crash app)
    console.error('Failed to save tasks to storage:', error);
  }
}

/**
 * Clears all persisted tasks from localStorage
 * @param {{ storageKey?: string }} options - Optional storage key override
 * @returns {Promise<void>}
 */
export async function clearTasks(options = {}) {
  const storageKey = options.storageKey || DEFAULT_STORAGE_KEY;
  
  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    // Graceful failure - log but don't throw
    console.error('Failed to clear tasks from storage:', error);
  }
}

