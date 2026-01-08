import { describe, it, expect } from 'vitest';
import { sortTasksForRightNow } from './rightNowSort.js';

describe('sortTasksForRightNow', () => {
  it('should sort tasks by estimateMinutesTotal ascending', () => {
    const tasks = [
      { id: '1', title: 'Task 1', urgent: true, important: true, estimateMinutesTotal: 60 },
      { id: '2', title: 'Task 2', urgent: true, important: true, estimateMinutesTotal: 30 },
      { id: '3', title: 'Task 3', urgent: true, important: true, estimateMinutesTotal: 45 }
    ];

    const sorted = sortTasksForRightNow(tasks);

    expect(sorted[0].id).toBe('2'); // 30 minutes first
    expect(sorted[1].id).toBe('3'); // 45 minutes second
    expect(sorted[2].id).toBe('1'); // 60 minutes third
  });

  it('should use default 30 minutes for missing estimates', () => {
    const tasks = [
      { id: '1', title: 'Task 1', urgent: true, important: true, estimateMinutesTotal: 60 },
      { id: '2', title: 'Task 2', urgent: true, important: true }, // missing estimate
      { id: '3', title: 'Task 3', urgent: true, important: true, estimateMinutesTotal: 15 }
    ];

    const sorted = sortTasksForRightNow(tasks);

    expect(sorted[0].id).toBe('3'); // 15 minutes first
    expect(sorted[1].id).toBe('2'); // default 30 minutes second
    expect(sorted[2].id).toBe('1'); // 60 minutes third
  });

  it('should sort by quadrant order (Q1, Q2, Q3, Q4) when estimates are equal', () => {
    const tasks = [
      { id: '1', title: 'Task 1', urgent: false, important: false, estimateMinutesTotal: 30 }, // Q4
      { id: '2', title: 'Task 2', urgent: true, important: true, estimateMinutesTotal: 30 }, // Q1
      { id: '3', title: 'Task 3', urgent: false, important: true, estimateMinutesTotal: 30 }, // Q2
      { id: '4', title: 'Task 4', urgent: true, important: false, estimateMinutesTotal: 30 } // Q3
    ];

    const sorted = sortTasksForRightNow(tasks);

    expect(sorted[0].id).toBe('2'); // Q1 first
    expect(sorted[1].id).toBe('3'); // Q2 second
    expect(sorted[2].id).toBe('4'); // Q3 third
    expect(sorted[3].id).toBe('1'); // Q4 fourth
  });

  it('should use stable tie-breaker (createdAt) when estimates and quadrants are equal', () => {
    const tasks = [
      { id: '1', title: 'Task 1', urgent: true, important: true, estimateMinutesTotal: 30, createdAt: 300 },
      { id: '2', title: 'Task 2', urgent: true, important: true, estimateMinutesTotal: 30, createdAt: 100 },
      { id: '3', title: 'Task 3', urgent: true, important: true, estimateMinutesTotal: 30, createdAt: 200 }
    ];

    const sorted = sortTasksForRightNow(tasks);

    expect(sorted[0].id).toBe('2'); // createdAt: 100 first
    expect(sorted[1].id).toBe('3'); // createdAt: 200 second
    expect(sorted[2].id).toBe('1'); // createdAt: 300 third
  });

  it('should use id as tie-breaker when createdAt is missing', () => {
    const tasks = [
      { id: '3', title: 'Task 3', urgent: true, important: true, estimateMinutesTotal: 30 },
      { id: '1', title: 'Task 1', urgent: true, important: true, estimateMinutesTotal: 30 },
      { id: '2', title: 'Task 2', urgent: true, important: true, estimateMinutesTotal: 30 }
    ];

    const sorted = sortTasksForRightNow(tasks);

    // Should sort by id (as string or number depending on type)
    // Assuming string comparison, '1' < '2' < '3'
    expect(sorted[0].id).toBe('1');
    expect(sorted[1].id).toBe('2');
    expect(sorted[2].id).toBe('3');
  });

  it('should handle mixed estimate, quadrant, and tie-breaker sorting', () => {
    const tasks = [
      { id: '1', title: 'Task 1', urgent: false, important: false, estimateMinutesTotal: 60, createdAt: 100 }, // Q4, 60min
      { id: '2', title: 'Task 2', urgent: true, important: true, estimateMinutesTotal: 30, createdAt: 200 }, // Q1, 30min
      { id: '3', title: 'Task 3', urgent: false, important: true, estimateMinutesTotal: 30, createdAt: 300 }, // Q2, 30min
      { id: '4', title: 'Task 4', urgent: true, important: true, estimateMinutesTotal: 30, createdAt: 100 }, // Q1, 30min
      { id: '5', title: 'Task 5', urgent: true, important: false, estimateMinutesTotal: 15, createdAt: 150 } // Q3, 15min
    ];

    const sorted = sortTasksForRightNow(tasks);

    expect(sorted[0].id).toBe('5'); // 15min first (lowest estimate)
    expect(sorted[1].id).toBe('4'); // Q1, 30min, createdAt 100 (Q1 priority, then createdAt)
    expect(sorted[2].id).toBe('2'); // Q1, 30min, createdAt 200
    expect(sorted[3].id).toBe('3'); // Q2, 30min
    expect(sorted[4].id).toBe('1'); // Q4, 60min (highest estimate)
  });

  it('should handle empty array', () => {
    const tasks = [];
    const sorted = sortTasksForRightNow(tasks);
    expect(sorted).toEqual([]);
  });

  it('should handle null/undefined input', () => {
    expect(sortTasksForRightNow(null)).toEqual([]);
    expect(sortTasksForRightNow(undefined)).toEqual([]);
  });

  it('should handle tasks with null estimates (treat as missing)', () => {
    const tasks = [
      { id: '1', title: 'Task 1', urgent: true, important: true, estimateMinutesTotal: null },
      { id: '2', title: 'Task 2', urgent: true, important: true, estimateMinutesTotal: 15 }
    ];

    const sorted = sortTasksForRightNow(tasks);

    expect(sorted[0].id).toBe('2'); // 15 minutes first
    expect(sorted[1].id).toBe('1'); // null -> default 30 minutes second
  });
});

