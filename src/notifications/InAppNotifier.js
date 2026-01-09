/**
 * In-app notifier - displays notifications using the toast system
 * 
 * This is a simple wrapper around the toast push function.
 * The actual toast system is managed in App.jsx.
 */

/**
 * Shows an in-app notification via toast
 * 
 * @param {Object} notification - Notification object with message and optional tone
 * @param {Function} pushToast - Function to push toast (from App.jsx)
 */
export function show(notification, pushToast) {
  if (!notification || !pushToast) {
    return;
  }
  
  const tone = notification.type === 'drift' ? 'neutral' : 'neutral';
  
  pushToast({
    message: notification.message,
    tone: tone,
    durationMs: 5000
  });
}

