/**
 * Notification preferences model and storage
 * 
 * Default preferences:
 * - quietHours: { start: "22:00", end: "08:00" }
 * - inAppReminders: true
 * - browserNotifications: false
 * - defaultTimes: {
 *     low: { dayOfWeek: 0, hour: 18 }, // Sunday 18:00
 *     medium: { daysOfWeek: [1, 3, 5], hour: 9 }, // Mon/Wed/Fri 09:00
 *     high: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], hour: 9 } // Daily 09:00
 *   }
 */

const STORAGE_KEY = "eisenhower.notificationPreferences.v1";

/**
 * Default notification preferences
 * @returns {Object} Default preferences object
 */
export function getDefaultPreferences() {
  return {
    quietHours: {
      start: "22:00", // 10:00 PM
      end: "08:00"    // 8:00 AM
    },
    inAppReminders: true,
    browserNotifications: false,
    defaultTimes: {
      low: {
        dayOfWeek: 0, // Sunday
        hour: 18       // 6:00 PM
      },
      medium: {
        daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
        hour: 9                 // 9:00 AM
      },
      high: {
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // All days
        hour: 9                              // 9:00 AM
      }
    }
  };
}

/**
 * Loads notification preferences from localStorage
 * @returns {Object} Preferences object (defaults if not found)
 */
export function loadPreferences() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultPreferences();
    }
    
    const parsed = JSON.parse(stored);
    // Merge with defaults to handle missing fields
    return {
      ...getDefaultPreferences(),
      ...parsed,
      quietHours: {
        ...getDefaultPreferences().quietHours,
        ...(parsed.quietHours || {})
      },
      defaultTimes: {
        ...getDefaultPreferences().defaultTimes,
        ...(parsed.defaultTimes || {})
      }
    };
  } catch (error) {
    console.error('Failed to load notification preferences:', error);
    return getDefaultPreferences();
  }
}

/**
 * Saves notification preferences to localStorage
 * @param {Object} preferences - Preferences object to save
 */
export function savePreferences(preferences) {
  try {
    const json = JSON.stringify(preferences);
    localStorage.setItem(STORAGE_KEY, json);
  } catch (error) {
    console.error('Failed to save notification preferences:', error);
  }
}

