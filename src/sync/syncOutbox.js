/**
 * Sync outbox for queuing failed remote operations
 * 
 * Stores operations in localStorage under "eisenhower.syncOutbox.v1"
 * Format: Array of { id, type, createdAtISO, payload }
 * 
 * Operations are deduplicated: only latest snapshot per userId is kept.
 */

const OUTBOX_STORAGE_KEY = 'eisenhower.syncOutbox.v1';

/**
 * Loads outbox from localStorage
 * @returns {Array} Array of outbox operations
 */
export function getOutbox() {
  try {
    const stored = localStorage.getItem(OUTBOX_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to load outbox:', error);
    return [];
  }
}

/**
 * Saves outbox to localStorage
 * @param {Array} operations - Array of outbox operations
 */
function saveOutbox(operations) {
  try {
    localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(operations));
  } catch (error) {
    console.error('Failed to save outbox:', error);
  }
}

/**
 * Enqueues an operation to the outbox
 * @param {Object} operation - Operation object with type and payload
 * @returns {Promise<void>}
 */
export async function enqueueOutboxOperation(operation) {
  const operations = getOutbox();
  const now = new Date().toISOString();
  
  const newOp = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    type: operation.type,
    createdAtISO: now,
    payload: operation.payload
  };

  // Dedupe: for saveSnapshot operations, keep only latest per userId
  if (operation.type === 'saveSnapshot' && operation.payload && operation.payload.userId) {
    const filtered = operations.filter(op => 
      !(op.type === 'saveSnapshot' && op.payload && op.payload.userId === operation.payload.userId)
    );
    operations.length = 0;
    operations.push(...filtered);
  }

  operations.push(newOp);
  saveOutbox(operations);
}

/**
 * Flushes outbox by retrying operations
 * @param {string} userId - User ID
 * @param {Function} saveTasksForUser - Function to save tasks (from RemoteTaskRepositoryStub)
 * @returns {Promise<void>}
 */
export async function flushOutbox(userId, saveTasksForUser) {
  if (!userId || !saveTasksForUser) {
    return;
  }

  const operations = getOutbox();
  const remaining = [];
  let flushed = false;

  for (const op of operations) {
    if (op.type === 'saveSnapshot' && op.payload && op.payload.userId === userId) {
      try {
        await saveTasksForUser(userId, op.payload.tasks);
        flushed = true;
        // Don't add to remaining (operation succeeded)
      } catch (error) {
        // Operation still failed - keep it in outbox
        console.warn('Failed to flush outbox operation:', error);
        remaining.push(op);
      }
    } else {
      // Keep operations for other users or unknown types
      remaining.push(op);
    }
  }

  if (flushed) {
    saveOutbox(remaining);
  }
}

/**
 * Clears all operations from outbox
 * @returns {Promise<void>}
 */
export async function clearOutbox() {
  saveOutbox([]);
}

