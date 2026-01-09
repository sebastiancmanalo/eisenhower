/**
 * Notification scheduler - pure function for planning notifications
 * 
 * This is a pure function with no side effects, making it fully testable.
 * Later, we can swap in Supabase/Firebase scheduling by implementing the same interface.
 * 
 * @typedef {Object} PlannedNotification
 * @property {string} id - Stable notification ID (for deduplication)
 * @property {string|number} taskId - ID of the task this notification is for
 * @property {string} fireAtISO - ISO string of when to fire this notification
 * @property {"reminder"|"drift"} type - Type of notification
 * @property {string} message - Message to display
 */

import { deriveEffectiveFrequency, shouldDriftToQ1 } from './notificationRules.js';
import { getQuadrant } from '../utils/taskLogic.js';

/**
 * Adjusts a fire time to respect quiet hours
 * If the fire time falls within quiet hours, pushes it forward to the end of quiet hours
 * 
 * @param {Date} fireTime - Proposed fire time
 * @param {Object} quietHours - { start: "HH:MM", end: "HH:MM" }
 * @returns {Date} Adjusted fire time
 */
function adjustForQuietHours(fireTime, quietHours) {
  const fireDate = new Date(fireTime);
  const fireHour = fireDate.getHours();
  const fireMinute = fireDate.getMinutes();
  const fireTimeMinutes = fireHour * 60 + fireMinute;
  
  // Parse quiet hours
  const [startHour, startMinute] = quietHours.start.split(':').map(Number);
  const [endHour, endMinute] = quietHours.end.split(':').map(Number);
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  // Check if fire time is within quiet hours
  let isInQuietHours = false;
  
  if (startMinutes > endMinutes) {
    // Quiet hours span midnight (e.g., 22:00 - 08:00)
    isInQuietHours = fireTimeMinutes >= startMinutes || fireTimeMinutes < endMinutes;
  } else {
    // Quiet hours within same day (e.g., 14:00 - 16:00)
    isInQuietHours = fireTimeMinutes >= startMinutes && fireTimeMinutes < endMinutes;
  }
  
  if (!isInQuietHours) {
    return fireDate;
  }
  
  // Push forward to end of quiet hours
  const adjusted = new Date(fireDate);
  adjusted.setHours(endHour, endMinute, 0, 0);
  
  // If end is before start (spans midnight) and we're in the early part, move to next day
  if (startMinutes > endMinutes && fireTimeMinutes >= startMinutes) {
    adjusted.setDate(adjusted.getDate() + 1);
  }
  
  return adjusted;
}

/**
 * Calculates the next notification time for a given frequency tier
 * 
 * @param {"low"|"medium"|"high"} frequency - Notification frequency tier
 * @param {Date} now - Current time
 * @param {Object} defaultTimes - Default times configuration from preferences
 * @returns {Date} Next notification time
 */
function calculateNextNotificationTime(frequency, now, defaultTimes) {
  const nowDate = new Date(now);
  const config = defaultTimes[frequency];
  
  if (!config) {
    // Fallback: use high frequency config
    return calculateNextNotificationTime('high', now, defaultTimes);
  }
  
  if (frequency === 'low') {
    // Low: 1x/week (Sunday 18:00)
    const next = new Date(nowDate);
    const currentDay = next.getDay(); // 0 = Sunday, 6 = Saturday
    const targetDay = config.dayOfWeek; // 0 = Sunday
    const targetHour = config.hour; // 18
    
    // Set to target hour
    next.setHours(targetHour, 0, 0, 0);
    
    // If we've passed this week's occurrence, move to next week
    if (currentDay > targetDay || (currentDay === targetDay && nowDate.getHours() >= targetHour)) {
      next.setDate(next.getDate() + (7 - currentDay + targetDay));
    } else {
      // Move to this week's occurrence
      next.setDate(next.getDate() + (targetDay - currentDay));
    }
    
    return next;
  } else if (frequency === 'medium') {
    // Medium: 3x/week (Mon/Wed/Fri 09:00)
    const next = new Date(nowDate);
    const currentDay = next.getDay();
    const targetDays = config.daysOfWeek; // [1, 3, 5]
    const targetHour = config.hour; // 9
    
    // Find next occurrence
    for (let i = 0; i < 7; i++) {
      const checkDay = (currentDay + i) % 7;
      if (targetDays.includes(checkDay)) {
        const candidate = new Date(nowDate);
        candidate.setDate(candidate.getDate() + i);
        candidate.setHours(targetHour, 0, 0, 0);
        
        // If it's today and we haven't passed the hour, use today
        if (i === 0 && nowDate.getHours() < targetHour) {
          return candidate;
        }
        // Otherwise use the next occurrence
        if (i > 0 || nowDate.getHours() >= targetHour) {
          return candidate;
        }
      }
    }
    
    // Fallback: next Monday
    const nextMonday = new Date(nowDate);
    const daysUntilMonday = (1 - currentDay + 7) % 7 || 7;
    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
    nextMonday.setHours(targetHour, 0, 0, 0);
    return nextMonday;
  } else {
    // High: Daily (09:00)
    const next = new Date(nowDate);
    const targetHour = config.hour; // 9
    
    next.setHours(targetHour, 0, 0, 0);
    
    // If we've passed today's occurrence, move to tomorrow
    if (nowDate.getHours() >= targetHour) {
      next.setDate(next.getDate() + 1);
    }
    
    return next;
  }
}

/**
 * Generates a stable notification ID for a task and notification type
 * 
 * @param {string|number} taskId - Task ID
 * @param {string} fireAtISO - ISO string of fire time
 * @param {"reminder"|"drift"} type - Notification type
 * @returns {string} Stable notification ID
 */
function generateNotificationId(taskId, fireAtISO, type) {
  // Use date portion (YYYY-MM-DD) for daily notifications to ensure deduplication
  const datePortion = fireAtISO.split('T')[0];
  return `${taskId}-${type}-${datePortion}`;
}

/**
 * Schedules next notifications for all tasks
 * 
 * @param {Array<Object>} tasks - Array of task objects
 * @param {Object} preferences - Notification preferences (from loadPreferences)
 * @param {Date|number|string} now - Current time
 * @param {Object} firedNotifications - Map of fired notification IDs to firedAtISO timestamps
 * @returns {Array<PlannedNotification>} Array of planned notifications
 */
export function scheduleNext(tasks, preferences, now, firedNotifications = {}) {
  if (!Array.isArray(tasks)) {
    return [];
  }
  
  const nowDate = new Date(now);
  const planned = [];
  const firedSet = new Set(Object.keys(firedNotifications || {}));
  
  for (const task of tasks) {
    // Skip completed tasks
    if (task.completedAt) {
      continue;
    }
    
    // Check for drift condition
    if (shouldDriftToQ1(task, nowDate)) {
      const driftId = `drift-${task.id}`;
      if (!firedSet.has(driftId)) {
        planned.push({
          id: driftId,
          taskId: task.id,
          fireAtISO: nowDate.toISOString(),
          type: 'drift',
          message: `Task moved to Urgent: ${task.title || 'Untitled task'} is due soon.`
        });
      }
    }
    
    // Schedule reminder notifications
    const effectiveFrequency = deriveEffectiveFrequency(task, nowDate);
    const nextTime = calculateNextNotificationTime(
      effectiveFrequency,
      nowDate,
      preferences.defaultTimes
    );
    
    // Adjust for quiet hours
    const adjustedTime = adjustForQuietHours(nextTime, preferences.quietHours);
    
    // Only schedule if it's in the future (or very recent, within 1 minute)
    const timeDiff = adjustedTime.getTime() - nowDate.getTime();
    if (timeDiff >= -60000) { // Allow 1 minute tolerance for "now" notifications
      const notificationId = generateNotificationId(
        task.id,
        adjustedTime.toISOString(),
        'reminder'
      );
      
      // Skip if already fired
      if (!firedSet.has(notificationId)) {
        planned.push({
          id: notificationId,
          taskId: task.id,
          fireAtISO: adjustedTime.toISOString(),
          type: 'reminder',
          message: `Reminder: ${task.title || 'Untitled task'}`
        });
      }
    }
  }
  
  return planned;
}

