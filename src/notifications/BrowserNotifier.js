/**
 * Browser notifier - optional browser Notification API integration
 * 
 * Must be opt-in and safe if unsupported.
 * Only shows notifications when user has granted permission.
 */

/**
 * Checks if browser notifications are supported
 * @returns {boolean} True if Notification API is available
 */
export function isSupported() {
  return typeof Notification !== 'undefined';
}

/**
 * Gets current notification permission status
 * @returns {"granted"|"denied"|"default"} Permission status
 */
export function getPermissionStatus() {
  if (!isSupported()) {
    return 'denied';
  }
  
  return Notification.permission;
}

/**
 * Requests notification permission from the user
 * @returns {Promise<"granted"|"denied"|"default">} Permission status after request
 */
export async function requestPermission() {
  if (!isSupported()) {
    return 'denied';
  }
  
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  if (Notification.permission === 'denied') {
    return 'denied';
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return 'denied';
  }
}

/**
 * Shows a browser notification
 * 
 * @param {Object} notification - Notification object with message
 * @returns {Notification|null} Notification object if shown, null otherwise
 */
export function show(notification) {
  if (!isSupported()) {
    return null;
  }
  
  if (Notification.permission !== 'granted') {
    return null;
  }
  
  if (!notification || !notification.message) {
    return null;
  }
  
  try {
    const browserNotification = new Notification('Eisenhower Task Manager', {
      body: notification.message,
      icon: '/favicon.ico', // Optional: add icon later
      tag: notification.id, // Use notification ID for deduplication
      requireInteraction: false
    });
    
    // Auto-close after 5 seconds
    setTimeout(() => {
      browserNotification.close();
    }, 5000);
    
    return browserNotification;
  } catch (error) {
    console.error('Failed to show browser notification:', error);
    return null;
  }
}

