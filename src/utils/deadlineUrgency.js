/**
 * Parse a due date string and interpret it as local end-of-day.
 * 
 * This function ensures that a date like "2026-01-08" is treated as "due by end of 2026-01-08"
 * (23:59:59.999) in the local timezone, avoiding timezone bugs and midnight surprises.
 * 
 * @param {string} dueDateStr - Date string in format "YYYY-MM-DD" or ISO string
 * @returns {Date|null} - Date object set to local end-of-day, or null if invalid
 */
export function parseDueDateLocal(dueDateStr) {
  if (!dueDateStr || typeof dueDateStr !== 'string') {
    return null;
  }

  try {
    // For date-only strings (YYYY-MM-DD), parse in local timezone to avoid timezone issues
    // For ISO strings with time, use Date constructor which handles them correctly
    let dueDateLocal;
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(dueDateStr)) {
      // Date-only string: parse in local timezone
      const [year, month, day] = dueDateStr.split('-').map(Number);
      // month is 0-indexed in Date constructor
      dueDateLocal = new Date(year, month - 1, day, 23, 59, 59, 999);
    } else {
      // ISO string or other format: parse normally, then normalize to local end-of-day
      const dateObj = new Date(dueDateStr);
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return null;
      }

      // Normalize to end of day (local time)
      // Extract year, month, day from the parsed date (in local time)
      dueDateLocal = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59, 999);
    }
    
    // Validate the resulting date
    if (isNaN(dueDateLocal.getTime())) {
      return null;
    }

    return dueDateLocal;
  } catch (error) {
    return null;
  }
}

/**
 * Calculates urgency color based on deadline proximity.
 * 
 * Rules:
 * - If dueDate is null/empty => null (no deadline urgency)
 * - If due date is in the past => "red"
 * - If diffMs < 2 days => "red"
 * - Else if diffMs <= 7 days => "yellow"
 * - Else => "green"
 * 
 * Thresholds (exact milliseconds):
 * - 2 days = 2 * 24 * 60 * 60 * 1000 = 172,800,000 ms
 * - 7 days = 7 * 24 * 60 * 60 * 1000 = 604,800,000 ms
 * 
 * @param {string|null} dueDate - ISO string or date string (e.g., "2026-01-08T00:00:00.000Z" or "2026-01-08")
 * @param {Date} now - Current date/time (Date object). Defaults to new Date()
 * @returns {"green"|"yellow"|"red"|null} - Urgency color, or null if no dueDate
 */
export function getDeadlineUrgency(dueDate, now = null) {
  if (!dueDate) {
    return null;
  }

  const nowDate = now instanceof Date ? now : new Date();

  // Parse and normalize dueDate to local end-of-day
  const dueEnd = parseDueDateLocal(dueDate);
  if (!dueEnd) {
    return null;
  }

  // Compute milliseconds difference = dueEnd - now
  const diffMs = dueEnd.getTime() - nowDate.getTime();

  // If due date is in the past, treat as "red"
  if (diffMs < 0) {
    return 'red';
  }

  // Thresholds (exact milliseconds)
  // 2 days = 2 * 24 * 60 * 60 * 1000 = 172,800,000 ms
  // 7 days = 7 * 24 * 60 * 60 * 1000 = 604,800,000 ms
  const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  // Apply urgency rules:
  // if diffMs < 2 days => "red"
  // else if diffMs <= 7 days => "yellow"
  // else => "green"
  if (diffMs < TWO_DAYS_MS) {
    return 'red';
  } else if (diffMs <= SEVEN_DAYS_MS) {
    return 'yellow';
  } else {
    return 'green';
  }
}

