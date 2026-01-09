/**
 * Export/Import utilities for tasks
 */

const CURRENT_EXPORT_VERSION = 1;

/**
 * Exports tasks to a JSON file
 * @param {Object[]} tasks - Array of task objects to export
 * @returns {void} Triggers browser download
 */
export function exportTasks(tasks) {
  if (!Array.isArray(tasks)) {
    throw new Error('Tasks must be an array');
  }

  const exportData = {
    version: CURRENT_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    tasks: tasks
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `eisenhower-tasks-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses and validates an imported JSON file
 * Handles both old array format and new versioned format
 * @param {string} jsonString - JSON string from file
 * @returns {Object} Parsed data with version and tasks array
 * @throws {Error} If JSON is invalid or unsupported version
 */
export function parseImportFile(jsonString) {
  let parsed;
  
  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    throw new Error('Invalid JSON file');
  }

  // Check if it's the new versioned format
  if (parsed && typeof parsed === 'object' && 'version' in parsed && 'tasks' in parsed) {
    if (parsed.version === 1 && Array.isArray(parsed.tasks)) {
      return { version: 1, tasks: parsed.tasks };
    }
    if (parsed.version === 0 && Array.isArray(parsed.tasks)) {
      return { version: 0, tasks: parsed.tasks };
    }
    throw new Error(`Unsupported export version: ${parsed.version}`);
  }

  // Check if it's the old array format (version 0)
  if (Array.isArray(parsed)) {
    return { version: 0, tasks: parsed };
  }

  throw new Error('Invalid file format: expected array of tasks or versioned export format');
}

/**
 * Merges imported tasks with existing tasks by id
 * Imported tasks overwrite existing tasks with the same id
 * @param {Object[]} existingTasks - Current tasks
 * @param {Object[]} importedTasks - Tasks to import
 * @returns {Object[]} Merged tasks array
 */
export function mergeTasksById(existingTasks, importedTasks) {
  if (!Array.isArray(existingTasks)) {
    existingTasks = [];
  }
  if (!Array.isArray(importedTasks)) {
    importedTasks = [];
  }

  // Create a map of existing tasks by id
  const existingMap = new Map();
  existingTasks.forEach(task => {
    if (task && task.id !== undefined) {
      existingMap.set(String(task.id), task);
    }
  });

  // Overwrite with imported tasks
  importedTasks.forEach(task => {
    if (task && task.id !== undefined) {
      existingMap.set(String(task.id), task);
    }
  });

  // Convert back to array, preserving order: existing tasks first, then new imported tasks
  const merged = Array.from(existingMap.values());
  
  // Sort to put existing tasks first (by original index), then new tasks
  const existingIds = new Set(existingTasks.map(t => String(t?.id)).filter(Boolean));
  const sorted = [
    ...merged.filter(t => existingIds.has(String(t.id))),
    ...merged.filter(t => !existingIds.has(String(t.id)))
  ];

  return sorted;
}

