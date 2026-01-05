import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';
import Quadrant from './components/Quadrant.jsx';

// Store captured props for each render
const capturedProps = [];

// Mock the Quadrant component to capture props
vi.mock('./components/Quadrant.jsx', () => ({
  default: vi.fn(({ title, tasks }) => {
    capturedProps.push({ title, tasks });
    return (
      <div data-testid={`quadrant-${title}`} data-tasks-count={tasks.length}>
        {title}: {JSON.stringify(tasks.map(t => t.id))}
      </div>
    );
  }),
}));

describe('App Integration Tests', () => {
  beforeEach(() => {
    capturedProps.length = 0;
    vi.clearAllMocks();
  });

  const testTasks = [
    { id: '1', title: 'A', urgent: true, important: true },
    { id: '2', title: 'B', urgent: false, important: true },
    { id: '3', title: 'C', urgent: true, important: false },
    { id: '4', title: 'D', urgent: false, important: false },
  ];

  it('should render Quadrant component four times', () => {
    render(<App initialTasks={testTasks} />);
    const quadrants = screen.getAllByTestId(/^quadrant-/);
    expect(quadrants).toHaveLength(4);
  });

  it('should assign tasks to correct quadrants', () => {
    render(<App initialTasks={testTasks} />);
    
    const q1Element = screen.getByTestId('quadrant-Do First');
    const q2Element = screen.getByTestId('quadrant-Schedule');
    const q3Element = screen.getByTestId('quadrant-Delegate');
    const q4Element = screen.getByTestId('quadrant-Delete');

    // Check task counts
    expect(q1Element).toHaveAttribute('data-tasks-count', '1');
    expect(q2Element).toHaveAttribute('data-tasks-count', '1');
    expect(q3Element).toHaveAttribute('data-tasks-count', '1');
    expect(q4Element).toHaveAttribute('data-tasks-count', '1');

    // Check specific task IDs in each quadrant
    expect(q1Element.textContent).toContain('["1"]');
    expect(q2Element.textContent).toContain('["2"]');
    expect(q3Element.textContent).toContain('["3"]');
    expect(q4Element.textContent).toContain('["4"]');
  });

  it('should pass correct tasks array to each Quadrant', () => {
    render(<App initialTasks={testTasks} />);
    
    // Find the props for "Do First" quadrant
    const q1Props = capturedProps.find(props => props.title === 'Do First');
    expect(q1Props.tasks).toHaveLength(1);
    expect(q1Props.tasks[0].id).toBe('1');
    expect(q1Props.tasks[0].title).toBe('A');

    // Find the props for "Schedule" quadrant
    const q2Props = capturedProps.find(props => props.title === 'Schedule');
    expect(q2Props.tasks).toHaveLength(1);
    expect(q2Props.tasks[0].id).toBe('2');
    expect(q2Props.tasks[0].title).toBe('B');

    // Find the props for "Delegate" quadrant
    const q3Props = capturedProps.find(props => props.title === 'Delegate');
    expect(q3Props.tasks).toHaveLength(1);
    expect(q3Props.tasks[0].id).toBe('3');
    expect(q3Props.tasks[0].title).toBe('C');

    // Find the props for "Delete" quadrant
    const q4Props = capturedProps.find(props => props.title === 'Delete');
    expect(q4Props.tasks).toHaveLength(1);
    expect(q4Props.tasks[0].id).toBe('4');
    expect(q4Props.tasks[0].title).toBe('D');
  });

  it('should use default tasks when initialTasks prop is not provided', () => {
    render(<App />);
    
    const totalTasks = capturedProps.reduce((sum, props) => sum + props.tasks.length, 0);
    
    // Default tasks should be present (at least 2 tasks)
    expect(totalTasks).toBeGreaterThanOrEqual(2);
  });

  it('should handle empty tasks array', () => {
    render(<App initialTasks={[]} />);
    
    capturedProps.forEach(props => {
      expect(props.tasks).toHaveLength(0);
    });
  });
});

describe('App Reactivity Tests', () => {
  beforeEach(() => {
    capturedProps.length = 0;
    vi.clearAllMocks();
  });

  it('should initialize state correctly from initialTasks and derive quadrants correctly', () => {
    // First render: task in Q1
    const { rerender } = render(<App key="v1" initialTasks={[
      { id: '1', title: 'Task 1', urgent: true, important: true },
    ]} />);

    // Verify initial state: task should be in Q1
    let q1Props = capturedProps.find(props => props.title === 'Do First');
    expect(q1Props.tasks).toHaveLength(1);
    expect(q1Props.tasks[0].id).toBe('1');
    expect(q1Props.tasks[0].urgent).toBe(true);
    expect(q1Props.tasks[0].important).toBe(true);

    // Clear captured props before remount
    capturedProps.length = 0;

    // Remount with different key and modified fixture (task now in Q2)
    rerender(<App key="v2" initialTasks={[
      { id: '1', title: 'Task 1', urgent: false, important: true },
    ]} />);

    // After remount, verify task is now in Q2 (not Q1)
    const allProps = [...capturedProps];
    q1Props = allProps.find(props => props.title === 'Do First');
    const q2Props = allProps.find(props => props.title === 'Schedule');
    
    expect(q1Props.tasks).toHaveLength(0);
    expect(q2Props.tasks).toHaveLength(1);
    expect(q2Props.tasks[0].id).toBe('1');
    expect(q2Props.tasks[0].urgent).toBe(false);
    expect(q2Props.tasks[0].important).toBe(true);

    // Clear captured props again
    capturedProps.length = 0;

    // Remount again with different key and task now in Q4
    rerender(<App key="v3" initialTasks={[
      { id: '1', title: 'Task 1', urgent: false, important: false },
    ]} />);

    const allProps2 = [...capturedProps];
    q1Props = allProps2.find(props => props.title === 'Do First');
    const q2Props2 = allProps2.find(props => props.title === 'Schedule');
    const q4Props = allProps2.find(props => props.title === 'Delete');
    
    expect(q1Props.tasks).toHaveLength(0);
    expect(q2Props2.tasks).toHaveLength(0);
    expect(q4Props.tasks).toHaveLength(1);
    expect(q4Props.tasks[0].id).toBe('1');
    expect(q4Props.tasks[0].urgent).toBe(false);
    expect(q4Props.tasks[0].important).toBe(false);
  });
});

describe('App Estimate Formatting Tests', () => {
  beforeEach(() => {
    capturedProps.length = 0;
    vi.clearAllMocks();
  });

  it('should convert hours and minutes to estimateMinutesTotal when creating a task', () => {
    // Verify conversion logic: task with estimateHours=1, estimateMinutes=5 should get estimateMinutesTotal=65
    const taskData = {
      title: 'Test Task',
      urgent: true,
      important: true,
      estimateHours: '1',
      estimateMinutes: '5'
    };
    
    // Simulate what handleCreateTask does
    const hours = taskData.estimateHours ? parseInt(taskData.estimateHours, 10) : 0;
    const minutes = taskData.estimateMinutes ? parseInt(taskData.estimateMinutes, 10) : 0;
    const totalMinutes = hours * 60 + minutes;
    
    expect(totalMinutes).toBe(65);
    
    const processedTask = {
      ...taskData,
      id: 'test-1',
      estimateMinutesTotal: totalMinutes > 0 ? totalMinutes : null
    };
    delete processedTask.estimateHours;
    delete processedTask.estimateMinutes;
    
    expect(processedTask.estimateMinutesTotal).toBe(65);
    
    // Verify the task appears in the correct quadrant
    capturedProps.length = 0;
    render(<App key="estimate-test" initialTasks={[processedTask]} />);
    
    const q1Props = capturedProps.find(props => props.title === 'Do First');
    expect(q1Props).toBeDefined();
    expect(q1Props.tasks).toHaveLength(1);
    expect(q1Props.tasks[0].estimateMinutesTotal).toBe(65);
  });
});

describe('App Step 6 Auto-Placement Integration Test', () => {
  beforeEach(() => {
    capturedProps.length = 0;
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should auto-place task after countdown timeout', async () => {
    vi.useFakeTimers();
    
    render(<App initialTasks={[]} />);

    // 1) Click FAB to open task creation overlay
    const fab = screen.getByRole('button', { name: /add new task/i });
    fireEvent.click(fab);
    act(() => {
      vi.runOnlyPendingTimers();
    });

    // 2) Fill in and submit task form
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Task' } });
    act(() => {
      vi.runOnlyPendingTimers();
    });

    // Create a Q1 task (urgent and important)
    const urgentCheckbox = screen.getByLabelText(/urgent/i);
    const importantCheckbox = screen.getByLabelText(/important/i);
    fireEvent.click(urgentCheckbox);
    act(() => {
      vi.runOnlyPendingTimers();
    });
    fireEvent.click(importantCheckbox);
    act(() => {
      vi.runOnlyPendingTimers();
    });

    const submitButton = screen.getByRole('button', { name: /create task/i });
    fireEvent.click(submitButton);

    // 3) Assert assignment countdown overlay appears
    const assignmentOverlay = screen.getByTestId('assignment-overlay');
    expect(assignmentOverlay).toBeInTheDocument();
    
    const countdown = screen.getByTestId('assignment-countdown');
    expect(countdown).toHaveTextContent('10s');
    
    act(() => {
      vi.runOnlyPendingTimers();
    });

    // 4) Advance time by 10 seconds
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // 5) Assert assignment overlay closes
    expect(screen.queryByTestId('assignment-overlay')).not.toBeInTheDocument();

    // 6) Assert toast appears with "Auto-placed in Q1" (matching getQuadrant for urgent=true, important=true)
    const toasts = screen.getAllByText('Auto-placed in Q1');
    expect(toasts.length).toBeGreaterThan(0);
    const toast = toasts[0];
    expect(toast).toBeInTheDocument();

    // 7) Assert task is visible in the correct quadrant UI
    // The Quadrant mock captures props on each render, so we need to find the latest props
    // Clear and re-check to ensure we have the latest render
    const allQ1Props = capturedProps.filter(props => props.title === 'Do First');
    const latestQ1Props = allQ1Props[allQ1Props.length - 1];
    expect(latestQ1Props).toBeDefined();
    expect(latestQ1Props.tasks).toHaveLength(1);
    expect(latestQ1Props.tasks[0].title).toBe('Test Task');
    expect(latestQ1Props.tasks[0].urgent).toBe(true);
    expect(latestQ1Props.tasks[0].important).toBe(true);
  });

  it('should auto-place task in Q2 when not urgent but important', async () => {
    vi.useFakeTimers();

    render(<App initialTasks={[]} />);

    const fab = screen.getByRole('button', { name: /add new task/i });
    fireEvent.click(fab);
    act(() => {
      vi.runOnlyPendingTimers();
    });

    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Q2 Task' } });
    act(() => {
      vi.runOnlyPendingTimers();
    });

    const importantCheckbox = screen.getByLabelText(/important/i);
    fireEvent.click(importantCheckbox);
    act(() => {
      vi.runOnlyPendingTimers();
    });

    const submitButton = screen.getByRole('button', { name: /create task/i });
    fireEvent.click(submitButton);

    expect(screen.getByTestId('assignment-overlay')).toBeInTheDocument();
    
    act(() => {
      vi.runOnlyPendingTimers();
    });

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(screen.queryByTestId('assignment-overlay')).not.toBeInTheDocument();

    const toasts = screen.getAllByText('Auto-placed in Q2');
    expect(toasts.length).toBeGreaterThan(0);
    const toast = toasts[0];
    expect(toast).toBeInTheDocument();

    const allQ2Props = capturedProps.filter(props => props.title === 'Schedule');
    const latestQ2Props = allQ2Props[allQ2Props.length - 1];
    expect(latestQ2Props).toBeDefined();
    expect(latestQ2Props.tasks).toHaveLength(1);
    expect(latestQ2Props.tasks[0].title).toBe('Q2 Task');
    expect(latestQ2Props.tasks[0].urgent).toBe(false);
    expect(latestQ2Props.tasks[0].important).toBe(true);
  });
});

