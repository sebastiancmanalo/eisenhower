/**
 * Repository interface for task persistence
 * 
 * This abstraction allows swapping between local storage, Supabase, Firebase, etc.
 * without changing UI/business logic.
 * 
 * @typedef {Object} Task
 * @property {string|number} id
 * @property {string} title
 * @property {boolean} urgent
 * @property {boolean} important
 * @property {string|null} priority
 * @property {number|null} estimateMinutesTotal
 * @property {string|null} dueDate - ISO string or date string (e.g., "2026-01-08T00:00:00.000Z" or "2026-01-08")
 * @property {"low"|"medium"|"high"|null} notificationFrequency
 * @property {number|null} createdAt - timestamp in milliseconds
 * @property {number|null} completedAt - timestamp in milliseconds
 */

/**
 * Loads all tasks from storage
 * @returns {Promise<Task[] | null>} Array of tasks, or null if no tasks or error occurred
 */
export async function loadTasks() {
  throw new Error('loadTasks must be implemented by concrete repository');
}

/**
 * Saves all tasks to storage
 * @param {Task[]} tasks - Array of task objects to save
 * @returns {Promise<void>}
 */
export async function saveTasks(tasks) {
  throw new Error('saveTasks must be implemented by concrete repository');
}

