/**
 * Formats total minutes into a human-readable time estimate string.
 * 
 * @param {number} totalMinutes - Total minutes to format
 * @returns {string|null} Formatted string (e.g., "1h 05m", "30m", "2h") or null if invalid
 */
export function formatEstimateMinutes(totalMinutes) {
  if (!totalMinutes || typeof totalMinutes !== 'number' || totalMinutes <= 0) {
    return null;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    // Pad minutes to 2 digits when hours exist and minutes > 0
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  } else if (hours > 0) {
    // No minutes when minutes are 0
    return `${hours}h`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  }

  return null;
}





