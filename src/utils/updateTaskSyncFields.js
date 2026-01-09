/**
 * Updates sync fields on a task when it's mutated
 * - Increments revision
 * - Updates updatedAt to current time
 * 
 * @param {Object} task - Task object
 * @returns {Object} Task with updated sync fields
 */
export function updateTaskSyncFields(task) {
  if (!task) {
    throw new Error('Task is required');
  }

  const now = new Date().toISOString();
  const currentRevision = typeof task.revision === 'number' ? task.revision : 0;

  return {
    ...task,
    revision: currentRevision + 1,
    updatedAt: now
  };
}

