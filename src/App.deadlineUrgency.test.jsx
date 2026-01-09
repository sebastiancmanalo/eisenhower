import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';
import { clearTasks } from './data/LocalTaskRepository.js';
import * as deadlineUrgencyModule from './utils/deadlineUrgency.js';

// Use hoisted to create a function that bypasses the spy
const { getDeadlineUrgency: originalGetDeadlineUrgency } = vi.hoisted(() => {
  // Import fresh to avoid circular dependency
  return require('./utils/deadlineUrgency.js');
});

describe('App Deadline Urgency', () => {
  // Fixed "now" for deterministic testing: 2026-01-08T12:00:00 local
  const FIXED_NOW = new Date('2026-01-08T12:00:00');

  beforeEach(() => {
    clearTasks();
    // Mock getDeadlineUrgency to always use FIXED_NOW for deterministic testing
    vi.spyOn(deadlineUrgencyModule, 'getDeadlineUrgency').mockImplementation((dueDate) => {
      // Call the hoisted original function with FIXED_NOW
      return originalGetDeadlineUrgency(dueDate, FIXED_NOW);
    });
  });

  afterEach(() => {
    clearTasks();
    vi.restoreAllMocks();
  });

  it('should show green indicator when dueDate is more than 7 days away', async () => {
    // Fixed now: 2026-01-08T12:00:00
    // Due date: 2026-01-18 (10 days ahead)
    const dueDate = '2026-01-18';

    const tasks = [
      {
        id: 1,
        title: 'Future Task',
        urgent: false,
        important: false, // Would normally be green (Q4)
        dueDate: dueDate, // 10 days away
        createdAt: FIXED_NOW.getTime()
      }
    ];

    render(<App initialTasks={tasks} />);

    // Wait for tasks to render
    await waitFor(() => {
      expect(screen.getByText('Future Task')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Find the priority dot element - it should have green background (CSS variable)
    const taskElement = screen.getByText('Future Task').closest('.task-bubble');
    const priorityDot = taskElement?.querySelector('[data-testid="task-urgency-indicator"]');
    
    expect(priorityDot).toBeInTheDocument();
    expect(priorityDot).toHaveStyle({ backgroundColor: 'var(--urgency-green)' });
  });

  it('should show yellow indicator when dueDate is 2-7 days away', async () => {
    // Fixed now: 2026-01-08T12:00:00
    // Due date: 2026-01-11 (3 days ahead)
    const dueDate = '2026-01-11';

    const tasks = [
      {
        id: 1,
        title: 'Near Task',
        urgent: true,
        important: true, // Would normally be red (Q1)
        dueDate: dueDate, // 3 days away
        createdAt: FIXED_NOW.getTime()
      }
    ];

    render(<App initialTasks={tasks} />);

    // Wait for tasks to render
    await waitFor(() => {
      expect(screen.getByText('Near Task')).toBeInTheDocument();
    });

    const taskElement = screen.getByText('Near Task').closest('.task-bubble');
    const priorityDot = taskElement?.querySelector('[data-testid="task-urgency-indicator"]');
    
    // Should be yellow (deadline urgency) not red (quadrant urgency)
    expect(priorityDot).toBeInTheDocument();
    expect(priorityDot).toHaveStyle({ backgroundColor: 'var(--urgency-yellow)' });
  });

  it('should show red indicator when dueDate is less than 2 days away', async () => {
    // Fixed now: 2026-01-08T12:00:00
    // Due date: 2026-01-09 (1 day ahead)
    const dueDate = '2026-01-09';

    const tasks = [
      {
        id: 1,
        title: 'Urgent Task',
        urgent: false,
        important: false, // Would normally be green (Q4)
        dueDate: dueDate, // 1 day away
        createdAt: FIXED_NOW.getTime()
      }
    ];

    render(<App initialTasks={tasks} />);

    await waitFor(() => {
      expect(screen.getByText('Urgent Task')).toBeInTheDocument();
    }, { timeout: 2000 });

    const taskElement = screen.getByText('Urgent Task').closest('.task-bubble');
    const priorityDot = taskElement?.querySelector('[data-testid="task-urgency-indicator"]');
    
    // Should be red (deadline urgency) not green (quadrant urgency)
    expect(priorityDot).toBeInTheDocument();
    expect(priorityDot).toHaveStyle({ backgroundColor: 'var(--urgency-red)' });
  });

  it('should show red indicator when dueDate is today', async () => {
    // Fixed now: 2026-01-08T12:00:00
    // Due date: 2026-01-08 (today, end-of-day logic still <2 days)
    const dueDate = '2026-01-08';

    const tasks = [
      {
        id: 1,
        title: 'Today Task',
        urgent: false,
        important: false, // Would normally be green (Q4)
        dueDate: dueDate, // today
        createdAt: FIXED_NOW.getTime()
      }
    ];

    render(<App initialTasks={tasks} />);

    await waitFor(() => {
      expect(screen.getByText('Today Task')).toBeInTheDocument();
    }, { timeout: 2000 });

    const taskElement = screen.getByText('Today Task').closest('.task-bubble');
    const priorityDot = taskElement?.querySelector('[data-testid="task-urgency-indicator"]');
    
    // Should be red (deadline urgency, today is <2 days)
    expect(priorityDot).toBeInTheDocument();
    expect(priorityDot).toHaveStyle({ backgroundColor: 'var(--urgency-red)' });
  });

  it('should fall back to quadrant-based urgency when no dueDate', async () => {
    const tasks = [
      {
        id: 1,
        title: 'No Due Date Task',
        urgent: true,
        important: true, // Q1 = red
        dueDate: null,
        createdAt: FIXED_NOW.getTime()
      }
    ];

    render(<App initialTasks={tasks} />);

    await waitFor(() => {
      expect(screen.getByText('No Due Date Task')).toBeInTheDocument();
    }, { timeout: 2000 });

    const taskElement = screen.getByText('No Due Date Task').closest('.task-bubble');
    const priorityDot = taskElement?.querySelector('[data-testid="task-urgency-indicator"]');
    
    // Should use quadrant-based urgency (red for Q1) - which maps to CSS variable since urgency='red'
    expect(priorityDot).toBeInTheDocument();
    expect(priorityDot).toHaveStyle({ backgroundColor: 'var(--urgency-red)' });
  });
});

