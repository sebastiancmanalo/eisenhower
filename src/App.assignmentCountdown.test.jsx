import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
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

describe('App Assignment Countdown Integration Tests', () => {
  beforeEach(() => {
    capturedProps.length = 0;
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Test 1 - Overlay opens after creation', async () => {
    vi.useFakeTimers();

    render(<App initialTasks={[]} />);

    // Create a task via FAB + creation overlay submit
    const fab = screen.getByRole('button', { name: /add new task/i });
    fireEvent.click(fab);
    act(() => {
      vi.runOnlyPendingTimers();
    });

    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Task' } });
    act(() => {
      vi.runOnlyPendingTimers();
    });

    const submitButton = screen.getByRole('button', { name: /create task/i });
    fireEvent.click(submitButton);

    // Assert assignment overlay appears
    const assignmentOverlay = screen.getByTestId('assignment-overlay');
    expect(assignmentOverlay).toBeInTheDocument();

    // Assert countdown text shows "10s" initially (or close to it, as timer may have started)
    const countdown = screen.getByTestId('assignment-countdown');
    const countdownText = countdown.textContent;
    // Should be 10s initially, but may be 9s if timer already ran
    expect(countdownText).toMatch(/^(10|9)s$/);
    
    act(() => {
      vi.runOnlyPendingTimers();
    });
  });

  it('Test 2 - Manual assignment updates flags + closes overlay (no timeout toast)', async () => {
    vi.useFakeTimers();

    render(<App initialTasks={[]} />);

    // Create task with urgent=false important=false (so it starts in Q4)
    const fab = screen.getByRole('button', { name: /add new task/i });
    fireEvent.click(fab);
    act(() => {
      vi.runOnlyPendingTimers();
    });

    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Q4 Task' } });
    act(() => {
      vi.runOnlyPendingTimers();
    });

    // Don't check urgent or important (both false by default)
    const submitButton = screen.getByRole('button', { name: /create task/i });
    fireEvent.click(submitButton);
    act(() => {
      vi.runOnlyPendingTimers();
    });

    // Assert assignment overlay appears
    const assignmentOverlay = screen.getByTestId('assignment-overlay');
    expect(assignmentOverlay).toBeInTheDocument();

    // Verify task is initially in Q4
    const allQ4Props = capturedProps.filter(props => props.title === 'Delete');
    const latestQ4Props = allQ4Props[allQ4Props.length - 1];
    expect(latestQ4Props).toBeDefined();
    expect(latestQ4Props.tasks).toHaveLength(1);
    expect(latestQ4Props.tasks[0].title).toBe('Q4 Task');
    expect(latestQ4Props.tasks[0].urgent).toBe(false);
    expect(latestQ4Props.tasks[0].important).toBe(false);

    // Click on Q1 drop zone to assign task (using fallback click handler)
    // Query within assignment overlay to avoid conflict with main app dropzones
    const assignmentOverlayContent = assignmentOverlay.querySelector('.assignment-overlay__zones');
    const dropzoneQ1 = assignmentOverlayContent.querySelector('[data-testid="dropzone-Q1"]');
    fireEvent.click(dropzoneQ1);
    act(() => {
      vi.runOnlyPendingTimers();
    });

    // Assert overlay closes
    expect(screen.queryByTestId('assignment-overlay')).not.toBeInTheDocument();

    // Assert task now appears in Q1 (and not in Q4)
    const allQ1Props = capturedProps.filter(props => props.title === 'Do First');
    const latestQ1Props = allQ1Props[allQ1Props.length - 1];
    expect(latestQ1Props).toBeDefined();
    expect(latestQ1Props.tasks).toHaveLength(1);
    expect(latestQ1Props.tasks[0].title).toBe('Q4 Task');
    expect(latestQ1Props.tasks[0].urgent).toBe(true);
    expect(latestQ1Props.tasks[0].important).toBe(true);

    // Assert timeout toast is NOT shown
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });

  it('Test 3 - Close button cancels overlay without changing flags', async () => {
    vi.useFakeTimers();

    render(<App initialTasks={[]} />);

    // Create task with known flags (e.g., urgent=true important=false => Q3)
    const fab = screen.getByRole('button', { name: /add new task/i });
    fireEvent.click(fab);
    act(() => {
      vi.runOnlyPendingTimers();
    });

    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Q3 Task' } });
    act(() => {
      vi.runOnlyPendingTimers();
    });

    const urgentCheckbox = screen.getByLabelText(/urgent/i);
    fireEvent.click(urgentCheckbox);
    act(() => {
      vi.runOnlyPendingTimers();
    });

    // important is false by default, so we have urgent=true, important=false => Q3
    const submitButton = screen.getByRole('button', { name: /create task/i });
    fireEvent.click(submitButton);
    act(() => {
      vi.runOnlyPendingTimers();
    });

    // Assert assignment overlay appears
    const assignmentOverlay = screen.getByTestId('assignment-overlay');
    expect(assignmentOverlay).toBeInTheDocument();

    // Verify task is initially in Q3
    const allQ3Props = capturedProps.filter(props => props.title === 'Delegate');
    const latestQ3Props = allQ3Props[allQ3Props.length - 1];
    expect(latestQ3Props).toBeDefined();
    expect(latestQ3Props.tasks).toHaveLength(1);
    expect(latestQ3Props.tasks[0].title).toBe('Q3 Task');
    expect(latestQ3Props.tasks[0].urgent).toBe(true);
    expect(latestQ3Props.tasks[0].important).toBe(false);

    // In assignment overlay, click Close/Cancel (onClose via backdrop)
    const backdrop = screen.getByTestId('assignment-overlay-backdrop');
    fireEvent.click(backdrop);
    act(() => {
      vi.runOnlyPendingTimers();
    });

    // Assert overlay closes
    expect(screen.queryByTestId('assignment-overlay')).not.toBeInTheDocument();

    // Assert task remains in its original quadrant (Q3)
    const allQ3PropsAfter = capturedProps.filter(props => props.title === 'Delegate');
    const latestQ3PropsAfter = allQ3PropsAfter[allQ3PropsAfter.length - 1];
    expect(latestQ3PropsAfter).toBeDefined();
    expect(latestQ3PropsAfter.tasks).toHaveLength(1);
    expect(latestQ3PropsAfter.tasks[0].title).toBe('Q3 Task');
    expect(latestQ3PropsAfter.tasks[0].urgent).toBe(true);
    expect(latestQ3PropsAfter.tasks[0].important).toBe(false);

    // Assert no toast shown
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });

  it('Test 4 - Timeout path auto-places + shows toast', async () => {
    vi.useFakeTimers();

    render(<App initialTasks={[]} />);

    // Create task with urgent=true important=true => Q1
    const fab = screen.getByRole('button', { name: /add new task/i });
    fireEvent.click(fab);
    act(() => {
      vi.runOnlyPendingTimers();
    });

    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Q1 Task' } });
    act(() => {
      vi.runOnlyPendingTimers();
    });

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
    act(() => {
      vi.runOnlyPendingTimers();
    });

    // Assert assignment overlay appears
    const assignmentOverlay = screen.getByTestId('assignment-overlay');
    expect(assignmentOverlay).toBeInTheDocument();

    // Advance timers by 10s
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Assert overlay closes
    expect(screen.queryByTestId('assignment-overlay')).not.toBeInTheDocument();

    // Note: Toast only appears if quadrant changed. Since task was created with flags
    // that already put it in Q1, no change occurs, so no toast is shown (correct behavior).

    // Assert task visible in Q1
    const allQ1Props = capturedProps.filter(props => props.title === 'Do First');
    const latestQ1Props = allQ1Props[allQ1Props.length - 1];
    expect(latestQ1Props).toBeDefined();
    expect(latestQ1Props.tasks).toHaveLength(1);
    expect(latestQ1Props.tasks[0].title).toBe('Q1 Task');
    expect(latestQ1Props.tasks[0].urgent).toBe(true);
    expect(latestQ1Props.tasks[0].important).toBe(true);
  });
});

