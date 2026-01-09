/**
 * Notification rules engine
 * 
 * Pure functions for determining notification behavior:
 * - deriveEffectiveFrequency: calculates effective notification frequency for a task
 * - shouldDriftToQ1: determines if a Q2 task should drift to Q1
 */

/**
 * Derives effective notification frequency for a task
 * 
 * Rules:
 * 1. Base frequency = task.notificationFrequency
 * 2. Escalation: if dueDate exists and within 4 days => force "high"
 * 
 * @param {Object} task - Task object with notificationFrequency and optional dueDate
 * @param {Date|number|string} now - Current time (Date object, timestamp, or ISO string)
 * @returns {"low"|"medium"|"high"} Effective notification frequency
 */
export function deriveEffectiveFrequency(task, now) {
  if (!task) {
    throw new Error('Task is required');
  }

  const baseFrequency = task.notificationFrequency || 'low';
  
  // Escalation rule: if dueDate exists and within 4 days, force "high"
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    const nowDate = new Date(now);
    
    if (isNaN(dueDate.getTime())) {
      // Invalid dueDate, use base frequency
      return baseFrequency;
    }
    
    const daysUntilDue = (dueDate.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysUntilDue >= 0 && daysUntilDue <= 4) {
      return 'high';
    }
  }
  
  return baseFrequency;
}

/**
 * Determines if a task in Q2 should drift to Q1
 * 
 * Condition: task is in Q2 (important=true, urgent=false) AND
 *            dueDate exists AND dueDate within 48 hours
 * 
 * @param {Object} task - Task object with urgent, important, and optional dueDate
 * @param {Date|number|string} now - Current time (Date object, timestamp, or ISO string)
 * @returns {boolean} True if task should drift to Q1
 */
export function shouldDriftToQ1(task, now) {
  if (!task) {
    return false;
  }
  
  // Must be in Q2 (important=true, urgent=false)
  if (!task.important || task.urgent) {
    return false;
  }
  
  // Must have a dueDate
  if (!task.dueDate) {
    return false;
  }
  
  const dueDate = new Date(task.dueDate);
  const nowDate = new Date(now);
  
  if (isNaN(dueDate.getTime())) {
    return false;
  }
  
  // Must be within 48 hours
  const hoursUntilDue = (dueDate.getTime() - nowDate.getTime()) / (1000 * 60 * 60);
  
  return hoursUntilDue >= 0 && hoursUntilDue <= 48;
}

