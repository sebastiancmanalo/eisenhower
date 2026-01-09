import { loadRawStorage, saveTasks as saveTasksImpl, STORAGE_KEY, CURRENT_SCHEMA_VERSION } from '../utils/storage.js';
import { normalizeTask as normalizeTaskUtil } from '../utils/normalizeTask.js';

/**
 * Local implementation of TaskRepository using localStorage
 * 
 * Handles:
 * - Schema versioning: migrates from version 0 (array) to version 1 (versioned object)
 * - Task format migration: adds missing fields (dueDate, notificationFrequency, createdAt)
 * - Validation and graceful failure
 * - Backwards compatibility
 * - Corruption handling: gracefully returns null on invalid data
 */

/**
 * Migrates a single task from old format to new format with defaults
 * Uses normalizeTask utility for normalization and adds repository-specific migration logic
 * @param {Object} task - Old or new task format
 * @returns {Object} - Task with all required fields
 */
function migrateTask(task) {
  if (!task || typeof task !== 'object') {
    throw new Error('Task must be a non-null object');
  }

  const migrated = { ...task };

  // Preserve unknown fields for forward compatibility
  // Only modify known fields

  // Ensure createdAt exists (use current time if missing)
  if (!migrated.createdAt) {
    migrated.createdAt = Date.now();
  }

  // Normalize name to title (repository-specific migration)
  if (migrated.name && !migrated.title) {
    migrated.title = migrated.name;
    delete migrated.name;
  }

  // Ensure required fields exist
  if (migrated.id === undefined) {
    throw new Error('Task missing required field: id');
  }
  if (migrated.title === undefined && migrated.name === undefined) {
    throw new Error('Task missing required field: title');
  }

  // Ensure urgent and important are boolean (default to false if missing)
  if (typeof migrated.urgent !== 'boolean') {
    migrated.urgent = false;
  }
  if (typeof migrated.important !== 'boolean') {
    migrated.important = false;
  }

  // Use normalizeTask utility for dueDate and notificationFrequency
  return normalizeTaskUtil(migrated);
}

/**
 * Migrates schema from version 0 (array) to version 1 (versioned object)
 * @param {Array} tasks - Array of tasks from old format
 * @returns {Array} - Array of migrated tasks
 */
function migrateSchemaFromV0ToV1(tasks) {
  if (!Array.isArray(tasks)) {
    throw new Error('Expected array of tasks for schema migration');
  }

  // Guard against extremely large arrays
  if (tasks.length > 10000) {
    throw new Error('Tasks array too large for migration');
  }

  // Migrate each task individually, catching errors per task
  const migratedTasks = [];
  for (const task of tasks) {
    try {
      const migrated = migrateTask(task);
      migratedTasks.push(migrated);
    } catch (error) {
      // Skip invalid tasks during migration, log error
      console.error('Skipping invalid task during migration:', error, task);
    }
  }

  return migratedTasks;
}

/**
 * Loads tasks from localStorage with schema versioning and migration
 * @returns {Promise<Object[] | null>} Returns null on parse errors or corruption, array of tasks if valid
 */
export async function loadTasks() {
  try {
    const rawStorage = loadRawStorage();
    if (!rawStorage) {
      return null;
    }

    let tasks;

    // Handle schema migration
    if (rawStorage.version === 0) {
      // Legacy format: array of tasks
      // Migrate to version 1 schema
      try {
        tasks = migrateSchemaFromV0ToV1(rawStorage.tasks);
        // Optionally save migrated data back (but don't block on failure)
        if (tasks.length > 0) {
          try {
            await saveTasksImpl(tasks);
          } catch (saveError) {
            // Log but don't fail - migration was successful in memory
            console.warn('Failed to persist migrated schema, will migrate again on next load:', saveError);
          }
        }
      } catch (migrationError) {
        // Migration failed - corrupted data
        console.error('Failed to migrate tasks from version 0:', migrationError);
        return null;
      }
    } else if (rawStorage.version === 1) {
      // Current format: versioned object with tasks array
      tasks = rawStorage.tasks;
      
      // Validate tasks array
      if (!Array.isArray(tasks)) {
        console.error('Invalid storage: tasks is not an array in version 1 format');
        return null;
      }

      // Guard against extremely large arrays
      if (tasks.length > 10000) {
        console.error('Tasks array too large, refusing to load');
        return null;
      }

      // Migrate each task to ensure all have required fields
      try {
        tasks = tasks.map(task => migrateTask(task));
      } catch (migrationError) {
        // Individual task migration failed - corrupted data
        console.error('Failed to migrate tasks from version 1:', migrationError);
        return null;
      }
    } else {
      // Unknown version - corrupted or unsupported
      console.error(`Unknown storage schema version: ${rawStorage.version}`);
      return null;
    }

    return tasks;
  } catch (error) {
    // Graceful failure: return null on parse/migration errors (don't crash)
    console.error('Failed to load tasks from localStorage:', error);
    return null;
  }
}

/**
 * Saves tasks to localStorage with versioned schema
 * @param {Object[]} tasks - Array of task objects to save
 * @returns {Promise<void>}
 */
export async function saveTasks(tasks) {
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

    // Validate and migrate each task before saving
    const validatedTasks = tasks.map(task => migrateTask(task));
    saveTasksImpl(validatedTasks);
  } catch (error) {
    // Graceful failure: log error but don't throw (don't crash app)
    console.error('Failed to save tasks to localStorage:', error);
  }
}

/**
 * Clears all tasks from localStorage
 * @returns {Promise<void>}
 */
export async function clearTasks() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear tasks from localStorage:', error);
  }
}

