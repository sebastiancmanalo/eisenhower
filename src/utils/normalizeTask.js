import { getQuadrant } from './taskLogic.js';
import { getDeviceId } from './deviceId.js';

/**
 * Derives default notification frequency based on quadrant
 * @param {string} quadrant - Quadrant identifier: "Q1", "Q2", "Q3", or "Q4"
 * @returns {string} - "low", "medium", or "high"
 */
export function deriveDefaultFrequency(quadrant) {
  if (quadrant === 'Q1') {
    return 'high';
  }
  if (quadrant === 'Q2') {
    return 'medium';
  }
  // Q3 and Q4 both default to low
  return 'low';
}

/**
 * Normalizes a task object to ensure all required fields are present with defaults
 * - Sets dueDate to null if missing or empty string
 * - Sets notificationFrequency to a default based on quadrant if missing
 * - Ensures sync fields: id (UUID), updatedAt, createdAt, deletedAt, completedAt, deviceId, revision
 * - Preserves all other fields (backwards compatible)
 * 
 * @param {Object} task - Task object (may be missing some fields)
 * @returns {Object} - Normalized task with all required fields
 */
export function normalizeTask(task) {
  if (!task) {
    throw new Error('Task is required');
  }

  const normalized = { ...task };
  const now = new Date().toISOString();

  // Ensure id exists (generate UUID if missing)
  if (!normalized.id) {
    normalized.id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  }
  // Ensure id is string
  normalized.id = String(normalized.id);

  // Ensure createdAt exists (default to now if missing)
  if (!normalized.createdAt) {
    normalized.createdAt = now;
  }
  // Convert createdAt to ISO string if it's a number (timestamp)
  if (typeof normalized.createdAt === 'number') {
    normalized.createdAt = new Date(normalized.createdAt).toISOString();
  }

  // Ensure updatedAt exists (default to createdAt if missing, otherwise now)
  if (!normalized.updatedAt) {
    normalized.updatedAt = normalized.createdAt || now;
  }
  // Convert updatedAt to ISO string if it's a number (timestamp)
  if (typeof normalized.updatedAt === 'number') {
    normalized.updatedAt = new Date(normalized.updatedAt).toISOString();
  }

  // Ensure deletedAt exists (default to null)
  if (normalized.deletedAt === undefined) {
    normalized.deletedAt = null;
  }
  // Convert deletedAt to ISO string if it's a number (timestamp)
  if (normalized.deletedAt !== null && typeof normalized.deletedAt === 'number') {
    normalized.deletedAt = new Date(normalized.deletedAt).toISOString();
  }

  // Ensure completedAt exists (default to null)
  if (normalized.completedAt === undefined) {
    normalized.completedAt = null;
  }
  // Convert completedAt to ISO string if it's a number (timestamp)
  if (normalized.completedAt !== null && typeof normalized.completedAt === 'number') {
    normalized.completedAt = new Date(normalized.completedAt).toISOString();
  }

  // Ensure deviceId exists (default to current deviceId)
  if (!normalized.deviceId) {
    normalized.deviceId = getDeviceId();
  }

  // Ensure revision exists (default to 0)
  if (typeof normalized.revision !== 'number') {
    normalized.revision = 0;
  }

  // Ensure dueDate exists (default to null)
  if (normalized.dueDate === undefined || normalized.dueDate === '') {
    normalized.dueDate = null;
  }

  // Ensure notificationFrequency exists
  // Default based on quadrant if not present:
  // Q1 => high, Q2 => medium, Q3/Q4 => low
  if (normalized.notificationFrequency === undefined || normalized.notificationFrequency === null) {
    const quadrant = getQuadrant(normalized);
    normalized.notificationFrequency = deriveDefaultFrequency(quadrant);
  }

  // Validate notificationFrequency is valid
  const validFrequencies = ['low', 'medium', 'high'];
  if (!validFrequencies.includes(normalized.notificationFrequency)) {
    const quadrant = getQuadrant(normalized);
    normalized.notificationFrequency = deriveDefaultFrequency(quadrant);
  }

  return normalized;
}

