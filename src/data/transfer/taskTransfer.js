/**
 * Task Transfer Utilities
 * 
 * Pure functions for serializing, parsing, and merging tasks for import/export.
 * Fully testable with no side effects.
 */

/**
 * Serializes tasks for export to JSON string
 * @param {Array} tasks - Array of task objects to export
 * @returns {string} JSON string with version, exportedAt, tasks, and meta
 */
export function serializeTasksForExport(tasks) {
  if (!Array.isArray(tasks)) {
    throw new Error('Tasks must be an array');
  }

  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks: tasks,
    meta: {
      app: 'Eisenhower',
      schema: 'tasks'
    }
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Parses imported JSON text and validates task structure
 * Supports versioned object format (version 1) and legacy array format
 * @param {string} jsonText - JSON string from file
 * @returns {{ tasks: Array, meta: Object }} Parsed tasks and metadata
 * @throws {Error} If JSON is invalid, corrupt, or tasks are invalid
 */
export function parseImportedTasks(jsonText) {
  if (typeof jsonText !== 'string') {
    throw new Error('Input must be a JSON string');
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    throw new Error('Invalid JSON file: ' + error.message);
  }

  let tasks = null;
  let meta = {};

  // Handle versioned object format (version 1)
  if (parsed && typeof parsed === 'object' && 'version' in parsed && 'tasks' in parsed) {
    if (parsed.version === 1) {
      if (!Array.isArray(parsed.tasks)) {
        throw new Error('Invalid format: tasks must be an array');
      }
      tasks = parsed.tasks;
      meta = {
        version: parsed.version,
        exportedAt: parsed.exportedAt || null,
        ...(parsed.meta || {})
      };
    } else {
      throw new Error(`Unsupported export version: ${parsed.version}`);
    }
  } else if (Array.isArray(parsed)) {
    // Handle legacy format: raw array of tasks
    tasks = parsed;
    meta = {
      version: 0,
      exportedAt: null
    };
  } else {
    throw new Error('Invalid file format: expected versioned object or array of tasks');
  }

  // Validate tasks array
  if (!Array.isArray(tasks)) {
    throw new Error('Invalid format: tasks must be an array');
  }

  // Validate each task has at least id and title/name
  const invalidTasks = [];
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (!task || typeof task !== 'object') {
      invalidTasks.push(`Task at index ${i} is not an object`);
      continue;
    }
    if (task.id === undefined || task.id === null) {
      invalidTasks.push(`Task at index ${i} is missing id`);
      continue;
    }
    if (!task.title && !task.name) {
      invalidTasks.push(`Task at index ${i} is missing both title and name`);
      continue;
    }
  }

  if (invalidTasks.length > 0) {
    throw new Error(`Invalid tasks found: ${invalidTasks.join('; ')}`);
  }

  return { tasks, meta };
}

/**
 * Merges incoming tasks with existing tasks by id
 * - Incoming tasks win for same id (overwrite existing)
 * - Preserves stable ordering: keep existing order, append truly new tasks at end
 * @param {Array} existing - Current tasks array
 * @param {Array} incoming - Tasks to merge in
 * @returns {Array} Merged tasks array
 */
export function mergeTasks(existing, incoming) {
  if (!Array.isArray(existing)) {
    existing = [];
  }
  if (!Array.isArray(incoming)) {
    incoming = [];
  }

  // Create a map of existing tasks by id for quick lookup
  const existingMap = new Map();
  existing.forEach(task => {
    if (task && task.id !== undefined && task.id !== null) {
      existingMap.set(String(task.id), task);
    }
  });

  // Track which incoming task ids we've seen
  const incomingIds = new Set();
  incoming.forEach(task => {
    if (task && task.id !== undefined && task.id !== null) {
      incomingIds.add(String(task.id));
      // Incoming wins: overwrite existing task with same id
      existingMap.set(String(task.id), task);
    }
  });

  // Build result: existing order first (with updates from incoming), then new tasks
  const result = [];
  const seenIds = new Set();

  // First pass: preserve existing order, update with incoming where applicable
  existing.forEach(task => {
    if (task && task.id !== undefined && task.id !== null) {
      const idStr = String(task.id);
      if (!seenIds.has(idStr)) {
        seenIds.add(idStr);
        // Use updated version from map (incoming wins if it exists)
        result.push(existingMap.get(idStr));
      }
    }
  });

  // Second pass: append truly new tasks (not in existing)
  incoming.forEach(task => {
    if (task && task.id !== undefined && task.id !== null) {
      const idStr = String(task.id);
      if (!seenIds.has(idStr)) {
        seenIds.add(idStr);
        result.push(task);
      }
    }
  });

  return result;
}

