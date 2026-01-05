/**
 * Pure utility function to determine quadrant assignment for a task
 * based on urgency and importance flags.
 * 
 * @param {Object} task - Task object with urgent and important boolean properties
 * @returns {string} Quadrant identifier: "Q1", "Q2", "Q3", or "Q4"
 */
export function getQuadrant(task) {
  // Basic input validation: treat missing flags as false/false => "Q4"
  const urgent = task?.urgent === true;
  const important = task?.important === true;

  if (urgent && important) {
    return 'Q1';
  }
  if (!urgent && important) {
    return 'Q2';
  }
  if (urgent && !important) {
    return 'Q3';
  }
  // !urgent && !important (including missing flags)
  return 'Q4';
}


