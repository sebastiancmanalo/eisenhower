/**
 * Stub implementation of TaskRepository for future Supabase/Firebase integration
 * 
 * This is a placeholder that will be replaced with actual remote storage logic.
 * Currently throws clear errors to indicate remote storage is not yet implemented.
 * 
 * TODO: Replace with Supabase/Firebase client implementation:
 * - Initialize Supabase/Firebase client
 * - loadTasksForUser(): Query remote database for tasks belonging to authenticated user
 * - saveTasksForUser(): Upsert tasks to remote database with user_id filter
 * - Add real-time sync subscriptions
 * - Add conflict resolution for concurrent edits
 */

/**
 * Loads tasks from remote storage for a specific user (not yet implemented)
 * @param {string} userId - User ID
 * @returns {Promise<Task[] | null>}
 */
export async function loadTasksForUser(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }

  // TODO: Implement Supabase query
  // Example:
  // const { data, error } = await supabase
  //   .from('tasks')
  //   .select('*')
  //   .eq('user_id', userId);
  // if (error) throw error;
  // return data || [];

  // TODO: Implement Firebase query
  // Example:
  // const snapshot = await db.collection('tasks')
  //   .where('userId', '==', userId)
  //   .get();
  // return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  throw new Error('Remote task storage is not yet implemented. Use VITE_TASK_REPO=local for local storage.');
}

/**
 * Saves tasks to remote storage for a specific user (not yet implemented)
 * @param {string} userId - User ID
 * @param {Task[]} tasks - Array of task objects to save
 * @returns {Promise<void>}
 */
export async function saveTasksForUser(userId, tasks) {
  if (!userId) {
    throw new Error('userId is required');
  }
  if (!Array.isArray(tasks)) {
    throw new Error('tasks must be an array');
  }

  // TODO: Implement Supabase upsert
  // Example:
  // const { error } = await supabase
  //   .from('tasks')
  //   .upsert(tasks.map(task => ({ ...task, user_id: userId })));
  // if (error) throw error;

  // TODO: Implement Firebase batch write
  // Example:
  // const batch = db.batch();
  // tasks.forEach(task => {
  //   const ref = db.collection('tasks').doc(task.id);
  //   batch.set(ref, { ...task, userId });
  // });
  // await batch.commit();

  throw new Error('Remote task storage is not yet implemented. Use VITE_TASK_REPO=local for local storage.');
}

/**
 * Loads tasks from remote storage (not yet implemented)
 * @returns {Promise<Task[] | null>}
 */
export async function loadTasks() {
  throw new Error('Remote task storage is not yet implemented. Use loadTasksForUser(userId) or VITE_TASK_REPO=local for local storage.');
}

/**
 * Saves tasks to remote storage (not yet implemented)
 * @param {Task[]} tasks - Array of task objects to save
 * @returns {Promise<void>}
 */
export async function saveTasks(tasks) {
  throw new Error('Remote task storage is not yet implemented. Use saveTasksForUser(userId, tasks) or VITE_TASK_REPO=local for local storage.');
}

/**
 * Clears all tasks from remote storage (not yet implemented)
 * @returns {Promise<void>}
 */
export async function clearTasks() {
  throw new Error('Remote task storage is not yet implemented. Use VITE_TASK_REPO=local for local storage.');
}

