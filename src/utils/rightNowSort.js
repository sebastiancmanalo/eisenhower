import { getQuadrant } from './taskLogic.js';

/**
 * Sorts tasks for the "Right Now" view.
 * 
 * Sorting criteria (in order):
 * 1. estimateMinutesTotal ascending (missing estimate -> default 30)
 * 2. Quadrant order: Q1, Q2, Q3, Q4
 * 3. Stable tie-breaker: createdAt (if present), else id (ascending)
 * 
 * @param {Array<Object>} tasks - Array of task objects
 * @returns {Array<Object>} Sorted array of tasks
 */
export function sortTasksForRightNow(tasks) {
  if (!tasks || !Array.isArray(tasks)) {
    return [];
  }

  const DEFAULT_ESTIMATE = 30;
  const QUADRANT_ORDER = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };

  return [...tasks].sort((a, b) => {
    // 1. Sort by estimateMinutesTotal ascending (missing -> default 30)
    const estimateA = a.estimateMinutesTotal ?? DEFAULT_ESTIMATE;
    const estimateB = b.estimateMinutesTotal ?? DEFAULT_ESTIMATE;
    
    if (estimateA !== estimateB) {
      return estimateA - estimateB;
    }

    // 2. Sort by quadrant order: Q1, Q2, Q3, Q4
    const quadrantA = getQuadrant(a);
    const quadrantB = getQuadrant(b);
    const orderA = QUADRANT_ORDER[quadrantA] ?? 99;
    const orderB = QUADRANT_ORDER[quadrantB] ?? 99;
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // 3. Stable tie-breaker: createdAt (if present), else id (ascending)
    const tieBreakerA = a.createdAt ?? a.id ?? 0;
    const tieBreakerB = b.createdAt ?? b.id ?? 0;
    
    // Handle numeric comparison
    if (typeof tieBreakerA === 'number' && typeof tieBreakerB === 'number') {
      return tieBreakerA - tieBreakerB;
    }
    
    // String comparison as fallback
    return String(tieBreakerA).localeCompare(String(tieBreakerB));
  });
}

