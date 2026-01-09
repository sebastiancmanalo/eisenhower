/**
 * Merge engine for syncing local and remote tasks
 * 
 * Pure function that merges two arrays of tasks based on sync fields:
 * - id: unique identifier (UUID)
 * - updatedAt: ISO string timestamp
 * - deletedAt: ISO string | null (tombstone delete)
 * - revision: number (incremented on every mutation)
 * 
 * Merge rules:
 * - Key by task.id
 * - If one side missing => include existing (unless tombstoned)
 * - If deletedAt present on one side and newer than other side's updatedAt => deletion wins
 * - If both present: choose the one with higher revision
 * - If revision equal, choose later updatedAt
 * - Preserve unknown fields (forward compat)
 * - Ensure mergedTasks never duplicates ids
 * - Keep tombstones (deletedAt) so remote deletions propagate
 * 
 * @param {Array} localTasks - Array of local task objects
 * @param {Array} remoteTasks - Array of remote task objects
 * @returns {Object} { mergedTasks, changedLocal, changedRemote }
 *   - mergedTasks: Array of merged task objects
 *   - changedLocal: Array of task IDs that changed on local side
 *   - changedRemote: Array of task IDs that changed on remote side
 */
export function mergeLocalAndRemote(localTasks, remoteTasks) {
  if (!Array.isArray(localTasks)) {
    throw new Error('localTasks must be an array');
  }
  if (!Array.isArray(remoteTasks)) {
    throw new Error('remoteTasks must be an array');
  }

  const localMap = new Map();
  const remoteMap = new Map();
  const mergedMap = new Map();
  const changedLocal = [];
  const changedRemote = [];

  // Build maps keyed by id
  for (const task of localTasks) {
    if (task && task.id) {
      localMap.set(String(task.id), task);
    }
  }

  for (const task of remoteTasks) {
    if (task && task.id) {
      remoteMap.set(String(task.id), task);
    }
  }

  // Collect all unique IDs
  const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);

  // Merge each task
  for (const id of allIds) {
    const local = localMap.get(id);
    const remote = remoteMap.get(id);

    // If one side missing, include existing (unless tombstoned)
    if (!local && remote) {
      // Only include remote if not tombstoned, or if tombstoned, still include it (for propagation)
      mergedMap.set(id, { ...remote });
      changedRemote.push(id);
      continue;
    }

    if (local && !remote) {
      // Only include local if not tombstoned, or if tombstoned, still include it (for propagation)
      mergedMap.set(id, { ...local });
      changedLocal.push(id);
      continue;
    }

    // Both present - need to resolve conflict
    const localDeletedAt = local.deletedAt ? new Date(local.deletedAt).getTime() : null;
    const remoteDeletedAt = remote.deletedAt ? new Date(remote.deletedAt).getTime() : null;
    const localUpdatedAt = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
    const remoteUpdatedAt = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;

    // Check if deletion wins
    if (localDeletedAt && remoteDeletedAt) {
      // Both deleted - choose the later deletion
      if (localDeletedAt >= remoteDeletedAt) {
        mergedMap.set(id, { ...local });
        changedLocal.push(id);
      } else {
        mergedMap.set(id, { ...remote });
        changedRemote.push(id);
      }
      continue;
    }

    if (localDeletedAt && !remoteDeletedAt) {
      // Local deleted, remote not deleted
      // Deletion wins if local deletion is newer than remote update
      if (localDeletedAt >= remoteUpdatedAt) {
        mergedMap.set(id, { ...local });
        changedLocal.push(id);
      } else {
        mergedMap.set(id, { ...remote });
        changedRemote.push(id);
      }
      continue;
    }

    if (!localDeletedAt && remoteDeletedAt) {
      // Remote deleted, local not deleted
      // Deletion wins if remote deletion is newer than local update
      if (remoteDeletedAt >= localUpdatedAt) {
        mergedMap.set(id, { ...remote });
        changedRemote.push(id);
      } else {
        mergedMap.set(id, { ...local });
        changedLocal.push(id);
      }
      continue;
    }

    // Neither deleted - compare revision, then updatedAt
    const localRevision = typeof local.revision === 'number' ? local.revision : 0;
    const remoteRevision = typeof remote.revision === 'number' ? remote.revision : 0;

    if (localRevision > remoteRevision) {
      mergedMap.set(id, { ...local });
      changedLocal.push(id);
    } else if (remoteRevision > localRevision) {
      mergedMap.set(id, { ...remote });
      changedRemote.push(id);
    } else {
      // Equal revision - use updatedAt tie-break
      if (localUpdatedAt >= remoteUpdatedAt) {
        mergedMap.set(id, { ...local });
        changedLocal.push(id);
      } else {
        mergedMap.set(id, { ...remote });
        changedRemote.push(id);
      }
    }
  }

  // Convert map to array, ensuring no duplicates
  const mergedTasks = Array.from(mergedMap.values());

  return {
    mergedTasks,
    changedLocal: [...new Set(changedLocal)],
    changedRemote: [...new Set(changedRemote)]
  };
}

