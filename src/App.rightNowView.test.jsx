import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';

describe('Right Now View', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders Right Now view with header title and helper text', async () => {
    const user = userEvent.setup();
    const testTasks = [
      { id: '1', title: 'Test Task', urgent: true, important: true, estimateMinutesTotal: 30 }
    ];

    render(<App initialTasks={testTasks} />);

    // Switch to Right Now view
    const rightNowDot = screen.getByTestId('page-dot-rightNow');
    await user.click(rightNowDot);

    // Assert Right Now view is visible
    await waitFor(() => {
      expect(screen.getByTestId('right-now-view')).toBeInTheDocument();
    });

    // Assert "Right Now" title is rendered
    const title = screen.getByRole('heading', { name: 'Right Now', level: 1 });
    expect(title).toBeInTheDocument();

    // Wait for helper text to appear (after animation delay)
    const helperText = await waitFor(() => {
      const element = screen.getByTestId('right-now-helper');
      expect(element).toBeInTheDocument();
      return element;
    }, { timeout: 1000 });

    // Assert helper text is rendered and is one of the allowed strings
    const allowedTexts = [
      'Quick wins first, then what matters most.',
      'Your next best move — sorted for momentum.'
    ];
    expect(allowedTexts).toContain(helperText.textContent);
  });

  it('renders Right Now view with tasks sorted correctly', async () => {
    const testTasks = [
      { id: '1', title: 'Short Task', urgent: true, important: true, estimateMinutesTotal: 15 },
      { id: '2', title: 'Long Task', urgent: false, important: false, estimateMinutesTotal: 60 },
      { id: '3', title: 'Medium Task', urgent: false, important: true, estimateMinutesTotal: 30 }
    ];

    render(<App initialTasks={testTasks} />);

    // Switch to Right Now view
    const rightNowDot = screen.getByTestId('page-dot-rightNow');
    await userEvent.click(rightNowDot);

    // Assert Right Now view is visible
    await waitFor(() => {
      expect(screen.getByTestId('right-now-view')).toBeInTheDocument();
    });

    // Assert tasks are sorted by estimate (15, 30, 60) then quadrant (Q1, Q2, Q4)
    const taskItems = screen.getAllByTestId(/^right-now-task-/);
    expect(taskItems).toHaveLength(3);
    expect(taskItems[0]).toHaveTextContent('Short Task'); // 15min, Q1
    expect(taskItems[1]).toHaveTextContent('Medium Task'); // 30min, Q2
    expect(taskItems[2]).toHaveTextContent('Long Task'); // 60min, Q4
  });

  it('displays quadrant indicator for each task', async () => {
    const user = userEvent.setup();
    const testTasks = [
      { id: '1', title: 'Q1 Task', urgent: true, important: true, estimateMinutesTotal: 30 },
      { id: '2', title: 'Q2 Task', urgent: false, important: true, estimateMinutesTotal: 30 }
    ];

    render(<App initialTasks={testTasks} />);

    const rightNowDot = screen.getByTestId('page-dot-rightNow');
    await user.click(rightNowDot);

    await waitFor(() => {
      expect(screen.getByTestId('right-now-view')).toBeInTheDocument();
    });

    // Assert quadrant indicators are displayed
    expect(screen.getByTestId('right-now-quadrant-1')).toHaveTextContent('Q1');
    expect(screen.getByTestId('right-now-quadrant-2')).toHaveTextContent('Q2');
  });

  it('displays estimate badge when present', async () => {
    const user = userEvent.setup();
    const testTasks = [
      { id: '1', title: 'Task with Estimate', urgent: true, important: true, estimateMinutesTotal: 45 }
    ];

    render(<App initialTasks={testTasks} />);

    const rightNowDot = screen.getByTestId('page-dot-rightNow');
    await user.click(rightNowDot);

    await waitFor(() => {
      expect(screen.getByTestId('right-now-view')).toBeInTheDocument();
    });

    // Assert estimate badge is displayed (formatted as "45m")
    expect(screen.getByTestId('right-now-estimate-1')).toHaveTextContent('45m');
  });

  it('displays priority badge when present', async () => {
    const user = userEvent.setup();
    const testTasks = [
      { id: '1', title: 'Task with Priority', urgent: true, important: true, estimateMinutesTotal: 30, priority: 'high' }
    ];

    render(<App initialTasks={testTasks} />);

    const rightNowDot = screen.getByTestId('page-dot-rightNow');
    await user.click(rightNowDot);

    await waitFor(() => {
      expect(screen.getByTestId('right-now-view')).toBeInTheDocument();
    });

    // Assert priority badge is displayed
    expect(screen.getByTestId('right-now-priority-1')).toHaveTextContent('high');
  });

  it('clicking a task in Right Now opens TaskDetailsModal', async () => {
    const user = userEvent.setup();
    const testTasks = [
      { id: '1', title: 'Clickable Task', urgent: true, important: true, estimateMinutesTotal: 30 }
    ];

    render(<App initialTasks={testTasks} />);

    const rightNowDot = screen.getByTestId('page-dot-rightNow');
    await user.click(rightNowDot);

    await waitFor(() => {
      expect(screen.getByTestId('right-now-view')).toBeInTheDocument();
    });

    // Click on task
    const taskItem = screen.getByTestId('right-now-task-1');
    fireEvent.click(taskItem);

    // Assert modal is opened
    await waitFor(() => {
      expect(screen.getByTestId('task-modal')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Clickable Task', level: 2 })).toBeInTheDocument();
    });
  });

  it('mark complete from Right Now removes task from list and matrix', async () => {
    const user = userEvent.setup();
    const testTasks = [
      { id: '1', title: 'Task to Complete', urgent: true, important: true, estimateMinutesTotal: 30 }
    ];

    render(<App initialTasks={testTasks} />);

    // Verify task is in Q1 (matrix view)
    const q1Quadrant = screen.getByTestId('quadrant-Q1');
    expect(q1Quadrant).toHaveTextContent('Task to Complete');

    // Switch to Right Now view
    const rightNowDot = screen.getByTestId('page-dot-rightNow');
    await user.click(rightNowDot);

    await waitFor(() => {
      expect(screen.getByTestId('right-now-view')).toBeInTheDocument();
    });

    // Assert task is in Right Now list
    expect(screen.getByTestId('right-now-task-1')).toBeInTheDocument();

    // Click complete button
    const completeButton = screen.getByTestId('right-now-complete-1');
    await user.click(completeButton);

    // Assert task is removed from Right Now list
    await waitFor(() => {
      expect(screen.queryByTestId('right-now-task-1')).not.toBeInTheDocument();
    });

    // Assert toast appears
    await waitFor(() => {
      expect(screen.getByText(/Completed: Task to Complete/i)).toBeInTheDocument();
    });

    // Switch back to Matrix view
    const matrixDot = screen.getByTestId('page-dot-matrix');
    await user.click(matrixDot);

    // Assert task is removed from matrix (get fresh reference)
    await waitFor(() => {
      const q1QuadrantFresh = screen.getByTestId('quadrant-Q1');
      expect(q1QuadrantFresh).not.toHaveTextContent('Task to Complete');
    });
  });

  it('page dots navigation switches between Matrix and Right Now views', async () => {
    const user = userEvent.setup();
    const testTasks = [
      { id: '1', title: 'Test Task', urgent: true, important: true }
    ];

    render(<App initialTasks={testTasks} />);

    // Initially Matrix view is shown
    expect(screen.getByTestId('quadrant-Q1')).toBeInTheDocument();
    expect(screen.queryByTestId('right-now-view')).not.toBeInTheDocument();

    // Assert page dots exist
    expect(screen.getByTestId('page-dots')).toBeInTheDocument();
    expect(screen.getByTestId('page-dot-matrix')).toBeInTheDocument();
    expect(screen.getByTestId('page-dot-rightNow')).toBeInTheDocument();

    // Switch to Right Now view
    const rightNowDot = screen.getByTestId('page-dot-rightNow');
    await user.click(rightNowDot);

    await waitFor(() => {
      expect(screen.getByTestId('right-now-view')).toBeInTheDocument();
      expect(screen.queryByTestId('quadrant-Q1')).not.toBeInTheDocument();
    });

    // Switch back to Matrix view
    const matrixDot = screen.getByTestId('page-dot-matrix');
    await user.click(matrixDot);

    await waitFor(() => {
      expect(screen.getByTestId('quadrant-Q1')).toBeInTheDocument();
      expect(screen.queryByTestId('right-now-view')).not.toBeInTheDocument();
    });
  });

  it('page dots indicate active view', async () => {
    const user = userEvent.setup();
    const testTasks = [
      { id: '1', title: 'Test Task', urgent: true, important: true }
    ];

    render(<App initialTasks={testTasks} />);

    // Initially Matrix view is active
    const matrixDot = screen.getByTestId('page-dot-matrix');
    const rightNowDot = screen.getByTestId('page-dot-rightNow');
    
    expect(matrixDot).toHaveClass('page-dots__dot--active');
    expect(rightNowDot).not.toHaveClass('page-dots__dot--active');

    // Switch to Right Now view
    await user.click(rightNowDot);

    await waitFor(() => {
      expect(matrixDot).not.toHaveClass('page-dots__dot--active');
      expect(rightNowDot).toHaveClass('page-dots__dot--active');
    });
  });

  it('ArrowRight switches to Right Now view', async () => {
    const user = userEvent.setup();
    const testTasks = [
      { id: '1', title: 'Test Task', urgent: true, important: true }
    ];

    render(<App initialTasks={testTasks} />);

    // Initially Matrix view is shown
    expect(screen.getByTestId('quadrant-Q1')).toBeInTheDocument();

    // Press ArrowRight
    await user.keyboard('{ArrowRight}');

    await waitFor(() => {
      expect(screen.getByTestId('right-now-view')).toBeInTheDocument();
      expect(screen.queryByTestId('quadrant-Q1')).not.toBeInTheDocument();
    });

    // Assert page dot reflects active view
    const rightNowDot = screen.getByTestId('page-dot-rightNow');
    expect(rightNowDot).toHaveClass('page-dots__dot--active');
  });

  it('ArrowLeft switches to Matrix view', async () => {
    const user = userEvent.setup();
    const testTasks = [
      { id: '1', title: 'Test Task', urgent: true, important: true }
    ];

    render(<App initialTasks={testTasks} />);

    // Switch to Right Now view first
    const rightNowDot = screen.getByTestId('page-dot-rightNow');
    await user.click(rightNowDot);

    await waitFor(() => {
      expect(screen.getByTestId('right-now-view')).toBeInTheDocument();
    });

    // Press ArrowLeft
    await user.keyboard('{ArrowLeft}');

    await waitFor(() => {
      expect(screen.getByTestId('quadrant-Q1')).toBeInTheDocument();
      expect(screen.queryByTestId('right-now-view')).not.toBeInTheDocument();
    });

    // Assert page dot reflects active view
    const matrixDot = screen.getByTestId('page-dot-matrix');
    expect(matrixDot).toHaveClass('page-dots__dot--active');
  });

  it('arrow keys do not switch views while typing in input', async () => {
    const user = userEvent.setup();
    const testTasks = [
      { id: '1', title: 'Test Task', urgent: true, important: true }
    ];

    render(<App initialTasks={testTasks} />);

    // Open task creation form
    const fab = screen.getByLabelText('Add new task');
    await user.click(fab);

    // Wait for overlay to appear and find title input
    await waitFor(() => {
      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });

    // Find title input and focus it
    const titleInput = screen.getByLabelText(/title/i);
    await user.click(titleInput);
    expect(titleInput).toHaveFocus();

    // Type in input
    await user.type(titleInput, 'New Task');
    
    // Assert Matrix view is still shown (typing didn't switch views)
    expect(screen.getByTestId('quadrant-Q1')).toBeInTheDocument();
    expect(screen.queryByTestId('right-now-view')).not.toBeInTheDocument();

    // Try pressing ArrowRight while focused on input
    await user.keyboard('{ArrowRight}');

    // Assert view didn't change
    await waitFor(() => {
      expect(screen.getByTestId('quadrant-Q1')).toBeInTheDocument();
      expect(screen.queryByTestId('right-now-view')).not.toBeInTheDocument();
    });
  });

  it('shows empty state when no active tasks', async () => {
    const user = userEvent.setup();
    const testTasks = [
      { id: '1', title: 'Completed Task', urgent: true, important: true, completedAt: Date.now() }
    ];

    render(<App initialTasks={testTasks} />);

    const rightNowDot = screen.getByTestId('page-dot-rightNow');
    await user.click(rightNowDot);

    await waitFor(() => {
      expect(screen.getByTestId('right-now-view')).toBeInTheDocument();
      expect(screen.getByText('All done!')).toBeInTheDocument();
      expect(screen.getByText('No active tasks right now.')).toBeInTheDocument();
    });

    // Assert header is still rendered in empty state
    const title = screen.getByRole('heading', { name: 'Right Now', level: 1 });
    expect(title).toBeInTheDocument();
    
    // Wait for helper text to appear (after animation delay)
    const helperText = await waitFor(() => {
      const element = screen.getByTestId('right-now-helper');
      expect(element).toBeInTheDocument();
      return element;
    }, { timeout: 1000 });
    
    const allowedTexts = [
      'Quick wins first, then what matters most.',
      'Your next best move — sorted for momentum.'
    ];
    expect(allowedTexts).toContain(helperText.textContent);
  });

  it('sorts tasks correctly: estimate first, then quadrant, then tie-breaker', async () => {
    const user = userEvent.setup();
    const testTasks = [
      { id: '1', title: 'Q4 Task', urgent: false, important: false, estimateMinutesTotal: 30, createdAt: 200 },
      { id: '2', title: 'Q1 Task A', urgent: true, important: true, estimateMinutesTotal: 30, createdAt: 100 },
      { id: '3', title: 'Q1 Task B', urgent: true, important: true, estimateMinutesTotal: 30, createdAt: 300 },
      { id: '4', title: 'Q2 Task', urgent: false, important: true, estimateMinutesTotal: 15 }
    ];

    render(<App initialTasks={testTasks} />);

    const rightNowDot = screen.getByTestId('page-dot-rightNow');
    await user.click(rightNowDot);

    await waitFor(() => {
      expect(screen.getByTestId('right-now-view')).toBeInTheDocument();
    });

    // Expected order: 15min (Q2), 30min Q1 (createdAt 100), 30min Q1 (createdAt 300), 30min Q4
    const taskItems = screen.getAllByTestId(/^right-now-task-/);
    expect(taskItems).toHaveLength(4);
    expect(taskItems[0]).toHaveTextContent('Q2 Task'); // 15min first
    expect(taskItems[1]).toHaveTextContent('Q1 Task A'); // 30min Q1, createdAt 100
    expect(taskItems[2]).toHaveTextContent('Q1 Task B'); // 30min Q1, createdAt 300
    expect(taskItems[3]).toHaveTextContent('Q4 Task'); // 30min Q4
  });
});

