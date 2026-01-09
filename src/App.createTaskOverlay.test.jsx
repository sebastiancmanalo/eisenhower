import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';

describe('Task Creation Overlay Integration', () => {
  it('should create a task and display it in the correct quadrant', async () => {
    const user = userEvent.setup();

    // 1) Render <App />
    render(<App initialTasks={[]} />);

    // 2) Find and click the Floating Action Button
    const fabButton = screen.getByRole('button', { name: /add new task/i });
    await user.click(fabButton);

    // 3) Assert the task creation overlay is visible after clicking
    expect(screen.getByText('Create New Task')).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();

    // 4) Fill the form
    const titleInput = screen.getByLabelText(/title/i);
    const urgentCheckbox = screen.getByRole('checkbox', { name: /urgent/i });
    const importantCheckbox = screen.getByRole('checkbox', { name: /important/i });
    const priorityInput = screen.getByLabelText(/priority/i);
    const hoursInput = screen.getByLabelText(/hours/i);
    const minutesInput = screen.getByLabelText(/minutes/i);

    await user.type(titleInput, 'Pay rent');
    await user.click(urgentCheckbox);
    await user.click(importantCheckbox);
    await user.type(priorityInput, 'high');
    await user.type(hoursInput, '0');
    await user.type(minutesInput, '30');

    // 5) Submit the form
    const submitButton = screen.getByRole('button', { name: /create task/i });
    await user.click(submitButton);

    // 6) Assert the overlay closes (form fields are no longer in the document)
    await waitFor(() => {
      expect(screen.queryByLabelText(/title/i)).not.toBeInTheDocument();
      expect(screen.queryByText('Create New Task')).not.toBeInTheDocument();
    });

    // 7) Assert the assignment overlay appears (task was created)
    await waitFor(() => {
      expect(screen.getByTestId('assignment-overlay')).toBeInTheDocument();
    });

    // 8) Assert it appears in the correct quadrant for urgent=true, important=true (Q1)
    // Note: The task appears in Q1 immediately, even while assignment overlay is open
    const q1Quadrant = screen.getByTestId('quadrant-Q1');
    expect(q1Quadrant).toBeInTheDocument();
    expect(q1Quadrant).toHaveTextContent('Pay rent');
  });

  it('should create a task with dueDate and notificationFrequency', async () => {
    const user = userEvent.setup();

    render(<App initialTasks={[]} />);

    const fabButton = screen.getByRole('button', { name: /add new task/i });
    await user.click(fabButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/title/i);
    const dueDateInput = screen.getByLabelText(/due date/i);
    const highFrequencyButton = screen.getByRole('button', { name: /^high$/i });

    await user.type(titleInput, 'Task with due date');
    await user.type(dueDateInput, '2026-12-31');
    await user.click(highFrequencyButton);

    const submitButton = screen.getByRole('button', { name: /create task/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText('Create New Task')).not.toBeInTheDocument();
    });

    // Wait for assignment overlay to close (it auto-closes after 10 seconds or can be closed)
    // For now, we'll wait for the task to appear in the quadrant
    await waitFor(() => {
      const q4Quadrant = screen.getByTestId('quadrant-Q4');
      expect(q4Quadrant).toHaveTextContent('Task with due date');
    }, { timeout: 15000 });

    // Wait for assignment overlay to be gone
    await waitFor(() => {
      expect(screen.queryByTestId('assignment-overlay')).not.toBeInTheDocument();
    }, { timeout: 15000 });

    // Verify task has dueDate and notificationFrequency stored
    const taskBubbles = screen.getAllByText('Task with due date');
    const taskBubble = taskBubbles.find(el => el.closest('.task-bubble'));
    await user.click(taskBubble);

    await waitFor(() => {
      expect(screen.getByTestId('task-modal')).toBeInTheDocument();
    });

    // Check that dueDate and frequency are displayed in modal
    const modal = screen.getByTestId('task-modal');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveTextContent(/due date/i);
    expect(modal).toHaveTextContent(/reminder frequency/i);
    expect(modal).toHaveTextContent(/high/i);
  });

  it('should default frequency to high for Q1 tasks', async () => {
    const user = userEvent.setup();

    render(<App initialTasks={[]} />);

    const fabButton = screen.getByRole('button', { name: /add new task/i });
    await user.click(fabButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/title/i);
    const urgentCheckbox = screen.getByRole('checkbox', { name: /urgent/i });
    const importantCheckbox = screen.getByRole('checkbox', { name: /important/i });

    await user.type(titleInput, 'Q1 Task');
    await user.click(urgentCheckbox);
    await user.click(importantCheckbox);

    // Wait for frequency to update (should be high for Q1)
    await waitFor(() => {
      const highButton = screen.getByRole('button', { name: /^high$/i });
      expect(highButton).toHaveClass('task-creation-overlay__frequency-button--active');
    });

    const submitButton = screen.getByRole('button', { name: /create task/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText('Create New Task')).not.toBeInTheDocument();
    });

    // Verify task was created and has high frequency
    await waitFor(() => {
      const q1Quadrant = screen.getByTestId('quadrant-Q1');
      expect(q1Quadrant).toHaveTextContent('Q1 Task');
    }, { timeout: 15000 });

    // Wait for assignment overlay to be gone
    await waitFor(() => {
      expect(screen.queryByTestId('assignment-overlay')).not.toBeInTheDocument();
    }, { timeout: 15000 });

    const taskBubbles = screen.getAllByText('Q1 Task');
    const taskBubble = taskBubbles.find(el => el.closest('.task-bubble'));
    await user.click(taskBubble);

    await waitFor(() => {
      expect(screen.getByTestId('task-modal')).toBeInTheDocument();
    });

    expect(screen.getByText(/high/i)).toBeInTheDocument();
  });

  it('should default frequency to medium for Q2 tasks', async () => {
    const user = userEvent.setup();

    render(<App initialTasks={[]} />);

    const fabButton = screen.getByRole('button', { name: /add new task/i });
    await user.click(fabButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/title/i);
    const importantCheckbox = screen.getByRole('checkbox', { name: /important/i });

    await user.type(titleInput, 'Q2 Task');
    await user.click(importantCheckbox);

    // Wait for frequency to update (should be medium for Q2)
    await waitFor(() => {
      const mediumButton = screen.getByRole('button', { name: /^medium$/i });
      expect(mediumButton).toHaveClass('task-creation-overlay__frequency-button--active');
    });

    const submitButton = screen.getByRole('button', { name: /create task/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText('Create New Task')).not.toBeInTheDocument();
    });

    // Verify task was created and has medium frequency
    await waitFor(() => {
      const q2Quadrant = screen.getByTestId('quadrant-Q2');
      expect(q2Quadrant).toHaveTextContent('Q2 Task');
    });
  });

  it('should default frequency to low for Q3/Q4 tasks', async () => {
    const user = userEvent.setup();

    render(<App initialTasks={[]} />);

    const fabButton = screen.getByRole('button', { name: /add new task/i });
    await user.click(fabButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/title/i);
    const urgentCheckbox = screen.getByRole('checkbox', { name: /urgent/i });

    await user.type(titleInput, 'Q3 Task');
    await user.click(urgentCheckbox);

    // Wait for frequency to update (should be low for Q3)
    await waitFor(() => {
      const lowButton = screen.getByRole('button', { name: /^low$/i });
      expect(lowButton).toHaveClass('task-creation-overlay__frequency-button--active');
    });

    const submitButton = screen.getByRole('button', { name: /create task/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText('Create New Task')).not.toBeInTheDocument();
    });

    // Verify task was created and has low frequency
    await waitFor(() => {
      const q3Quadrant = screen.getByTestId('quadrant-Q3');
      expect(q3Quadrant).toHaveTextContent('Q3 Task');
    });
  });

  it('should not change frequency after user manually selects it', async () => {
    const user = userEvent.setup();

    render(<App initialTasks={[]} />);

    const fabButton = screen.getByRole('button', { name: /add new task/i });
    await user.click(fabButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/title/i);
    const urgentCheckbox = screen.getByRole('checkbox', { name: /urgent/i });
    const importantCheckbox = screen.getByRole('checkbox', { name: /important/i });

    await user.type(titleInput, 'Override Frequency Task');
    
    // User manually selects low frequency first
    const lowButton = screen.getByRole('button', { name: /^low$/i });
    await user.click(lowButton);

    // Then user sets urgent and important (should default to high, but user already selected)
    await user.click(urgentCheckbox);
    await user.click(importantCheckbox);

    // Low should still be selected (user override)
    await waitFor(() => {
      expect(lowButton).toHaveClass('task-creation-overlay__frequency-button--active');
    });

    const submitButton = screen.getByRole('button', { name: /create task/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText('Create New Task')).not.toBeInTheDocument();
    });

    // Verify task was created with low frequency (user override)
    await waitFor(() => {
      const q1Quadrant = screen.getByTestId('quadrant-Q1');
      expect(q1Quadrant).toHaveTextContent('Override Frequency Task');
    }, { timeout: 15000 });

    // Wait for assignment overlay to be gone
    await waitFor(() => {
      expect(screen.queryByTestId('assignment-overlay')).not.toBeInTheDocument();
    }, { timeout: 15000 });

    const taskBubbles = screen.getAllByText('Override Frequency Task');
    const taskBubble = taskBubbles.find(el => el.closest('.task-bubble'));
    await user.click(taskBubble);

    await waitFor(() => {
      expect(screen.getByTestId('task-modal')).toBeInTheDocument();
    });

    const modal = screen.getByTestId('task-modal');
    expect(modal).toHaveTextContent(/low/i);
  });
});

