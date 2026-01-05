import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import App from './App.jsx';

describe('App Drag and Drop', () => {
  it('should move task from Q1 to Q2 when dragged and dropped', async () => {
    const initialTask = {
      id: 'test-task-1',
      title: 'Test Task',
      urgent: true,
      important: true,
    };

    let dragEndHandler = null;
    const testSeam = {
      setHandler: (handler) => {
        dragEndHandler = handler;
      },
    };

    render(<App initialTasks={[initialTask]} __test_onDragEnd={testSeam} />);

    // Wait for the handler to be set
    await waitFor(() => {
      expect(dragEndHandler).toBeTruthy();
    });

    // Verify task starts in Q1 (urgent=true, important=true)
    const q1Dropzone = screen.getByTestId('dropzone-Q1');
    expect(q1Dropzone).toBeInTheDocument();
    expect(q1Dropzone).toHaveTextContent('Test Task');

    // Find the draggable task
    const draggableTask = screen.getByTestId(`draggable-${initialTask.id}`);
    expect(draggableTask).toBeInTheDocument();

    // Simulate drag end event: drag task to Q2
    const dragEndEvent = {
      active: { id: initialTask.id },
      over: { id: 'Q2' },
    };

    // Trigger the drag end handler
    act(() => {
      dragEndHandler(dragEndEvent);
    });

    // Wait for the task to appear in Q2
    await waitFor(() => {
      const q2Dropzone = screen.getByTestId('dropzone-Q2');
      expect(q2Dropzone).toHaveTextContent('Test Task');
    }, { timeout: 3000 });

    // Verify Q1 no longer has the task
    expect(q1Dropzone).not.toHaveTextContent('Test Task');
  });

  it('should move task from Q2 to Q3 when dragged and dropped', async () => {
    const initialTask = {
      id: 'test-task-2',
      title: 'Another Task',
      urgent: false,
      important: true,
    };

    let dragEndHandler = null;
    const testSeam = {
      setHandler: (handler) => {
        dragEndHandler = handler;
      },
    };

    render(<App initialTasks={[initialTask]} __test_onDragEnd={testSeam} />);

    await waitFor(() => {
      expect(dragEndHandler).toBeTruthy();
    });

    // Verify task starts in Q2 (urgent=false, important=true)
    const q2Dropzone = screen.getByTestId('dropzone-Q2');
    expect(q2Dropzone).toBeInTheDocument();
    expect(q2Dropzone).toHaveTextContent('Another Task');

    // Simulate drag end event: drag task to Q3
    const dragEndEvent = {
      active: { id: initialTask.id },
      over: { id: 'Q3' },
    };

    act(() => {
      dragEndHandler(dragEndEvent);
    });

    // Wait for the task to appear in Q3
    await waitFor(() => {
      const q3Dropzone = screen.getByTestId('dropzone-Q3');
      expect(q3Dropzone).toHaveTextContent('Another Task');
    }, { timeout: 3000 });
  });

  it('should move task from Q1 to Q4 when dragged and dropped', async () => {
    const initialTask = {
      id: 'test-task-3',
      title: 'Q4 Task',
      urgent: true,
      important: true,
    };

    let dragEndHandler = null;
    const testSeam = {
      setHandler: (handler) => {
        dragEndHandler = handler;
      },
    };

    render(<App initialTasks={[initialTask]} __test_onDragEnd={testSeam} />);

    await waitFor(() => {
      expect(dragEndHandler).toBeTruthy();
    });

    // Verify task starts in Q1
    const q1Dropzone = screen.getByTestId('dropzone-Q1');
    expect(q1Dropzone).toHaveTextContent('Q4 Task');

    // Simulate drag end event: drag task to Q4
    const dragEndEvent = {
      active: { id: initialTask.id },
      over: { id: 'Q4' },
    };

    act(() => {
      dragEndHandler(dragEndEvent);
    });

    // Wait for the task to appear in Q4
    await waitFor(() => {
      const q4Dropzone = screen.getByTestId('dropzone-Q4');
      expect(q4Dropzone).toHaveTextContent('Q4 Task');
    }, { timeout: 3000 });
  });
});
