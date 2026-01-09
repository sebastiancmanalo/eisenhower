/**
 * Gets or creates a unique device ID for this browser/device
 * Persisted in localStorage under "eisenhower.deviceId"
 * @returns {string} UUID string identifying this device
 */
export function getDeviceId() {
  const STORAGE_KEY = 'eisenhower.deviceId';
  
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) {
      return existing;
    }
    
    // Generate new UUID
    const newId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    localStorage.setItem(STORAGE_KEY, newId);
    return newId;
  } catch (error) {
    // Fallback if localStorage fails
    console.error('Failed to get/create device ID:', error);
    return `device-${Date.now()}-${Math.random()}`;
  }
}

