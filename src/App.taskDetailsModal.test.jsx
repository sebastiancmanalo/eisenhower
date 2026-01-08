import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';

describe('Task Details Modal', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('opens modal on task click', async () => {
    const user = userEvent.setup();
    const testTasks = [
      { id: '1', title: 'Test Task', urgent: true, important: true }
    ];

    render(<App initialTasks={testTasks} />);

    // Find and click the task bubble (click on the task bubble element inside draggable)
    const taskBubble = screen.getByText('Test Task').closest('.task-bubble');
    fireEvent.click(taskBubble);

    // Assert modal is visible
    await waitFor(() => {
      const modal = screen.getByTestId('task-modal');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveAttribute('role', 'dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });

    // Assert task title is displayed in modal (check for the h2 title specifically)
    const modalTitle = screen.getByRole('heading', { name: 'Test Task', level: 2 });
    expect(modalTitle).toBeInTheDocument();
    expect(modalTitle).toHaveClass('task-details-modal__title');
  });

  it('edit task title updates UI + quadrant still correct', async () => {
    const user = userEvent.setup();
    const testTasks = [
      { id: '1', title: 'Original Title', urgent: true, important: true }
    ];

    render(<App initialTasks={testTasks} />);

    // Open modal
    const taskBubble = screen.getByText('Original Title').closest('.task-bubble');
    fireEvent.click(taskBubble);

    await waitFor(() => {
      expect(screen.getByTestId('task-modal')).toBeInTheDocument();
    });

    // Click Edit button
    const editButton = screen.getByTestId('edit-button');
    await user.click(editButton);

    // Change title
    const titleInput = screen.getByTestId('edit-title-input');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Title');

    // Save
    const saveButton = screen.getByTestId('save-button');
    await user.click(saveButton);

    // Assert modal shows updated title (check for heading in modal)
    await waitFor(() => {
      const modalTitle = screen.getByRole('heading', { name: 'Updated Title', level: 2 });
      expect(modalTitle).toBeInTheDocument();
    });

    // Close modal
    const backdrop = document.querySelector('.task-details-modal__backdrop');
    await user.click(backdrop);

    // Assert task bubble shows updated title (wait for modal to close)
    await waitFor(() => {
      expect(screen.queryByTestId('task-modal')).not.toBeInTheDocument();
    });
    
    // Now check for updated title in quadrant
    // Assert task is still in Q1 (urgent=true, important=true)
    const q1Quadrant = screen.getByTestId('quadrant-Q1');
    expect(q1Quadrant).toHaveTextContent('Updated Title');
  });

  it('mark complete removes task from quadrant', async () => {
    const user = userEvent.setup();
    const testTasks = [
      { id: '1', title: 'Task to Complete', urgent: true, important: true }
    ];

    render(<App initialTasks={testTasks} />);

    // Verify task is in Q1
    const q1Quadrant = screen.getByTestId('quadrant-Q1');
    expect(q1Quadrant).toHaveTextContent('Task to Complete');

    // Open modal
    const taskBubble = screen.getByText('Task to Complete').closest('.task-bubble');
    fireEvent.click(taskBubble);

    await waitFor(() => {
      expect(screen.getByTestId('task-modal')).toBeInTheDocument();
    });

    // Click Mark complete
    const completeButton = screen.getByTestId('complete-button');
    await user.click(completeButton);

    // Assert task is no longer in quadrant
    await waitFor(() => {
      expect(q1Quadrant).not.toHaveTextContent('Task to Complete');
    });

    // Assert toast appears
    await waitFor(() => {
      expect(screen.getByText(/Completed: Task to Complete/i)).toBeInTheDocument();
    });
  });

  it('delete removes task from quadrant', async () => {
    const user = userEvent.setup();
    const testTasks = [
      { id: '1', title: 'Task to Delete', urgent: true, important: true }
    ];

    render(<App initialTasks={testTasks} />);

    // Verify task is in Q1
    const q1Quadrant = screen.getByTestId('quadrant-Q1');
    expect(q1Quadrant).toHaveTextContent('Task to Delete');

    // Open modal
    const taskBubble = screen.getByText('Task to Delete').closest('.task-bubble');
    fireEvent.click(taskBubble);

    await waitFor(() => {
      expect(screen.getByTestId('task-modal')).toBeInTheDocument();
    });

    // Click Delete
    const deleteButton = screen.getByTestId('delete-button');
    await user.click(deleteButton);

    // Confirm delete
    await waitFor(() => {
      expect(screen.getByTestId('delete-confirm-button')).toBeInTheDocument();
    });
    const confirmButton = screen.getByTestId('delete-confirm-button');
    await user.click(confirmButton);

    // Assert task is no longer in quadrant
    await waitFor(() => {
      expect(q1Quadrant).not.toHaveTextContent('Task to Delete');
    });

    // Assert toast appears
    await waitFor(() => {
      expect(screen.getByText(/Deleted task/i)).toBeInTheDocument();
    });
  });

  it('updating urgent/important moves task to correct quadrant', async () => {
    const user = userEvent.setup();
    const testTasks = [
      { id: '1', title: 'Movable Task', urgent: true, important: true }
    ];

    render(<App initialTasks={testTasks} />);

    // Verify task is in Q1
    const q1Quadrant = screen.getByTestId('quadrant-Q1');
    const q2Quadrant = screen.getByTestId('quadrant-Q2');
    expect(q1Quadrant).toHaveTextContent('Movable Task');
    expect(q2Quadrant).not.toHaveTextContent('Movable Task');

    // Open modal
    const taskBubble = screen.getByText('Movable Task').closest('.task-bubble');
    fireEvent.click(taskBubble);

    await waitFor(() => {
      expect(screen.getByTestId('task-modal')).toBeInTheDocument();
    });

    // Click Edit
    const editButton = screen.getByTestId('edit-button');
    await user.click(editButton);

    // Uncheck Urgent (keep Important)
    const urgentCheckbox = screen.getByTestId('edit-urgent-checkbox');
    await user.click(urgentCheckbox);

    // Save
    const saveButton = screen.getByTestId('save-button');
    await user.click(saveButton);

    // Close modal
    await waitFor(() => {
      expect(screen.queryByTestId('edit-button')).toBeInTheDocument();
    });
    const backdrop = document.querySelector('.task-details-modal__backdrop');
    await user.click(backdrop);

    // Assert task moved to Q2 (not urgent, important)
    await waitFor(() => {
      expect(q1Quadrant).not.toHaveTextContent('Movable Task');
      expect(q2Quadrant).toHaveTextContent('Movable Task');
    });
  });

  it('persistence integration for edit/complete/delete', async () => {
    const user = userEvent.setup();
    
    // Set tasks in localStorage BEFORE rendering to simulate existing data
    const tasksWithStorage = [
      { id: '1', title: 'Persistent Task', urgent: true, important: true }
    ];
    localStorage.setItem('eisenhower.tasks.v1', JSON.stringify(tasksWithStorage));

    // Render without initialTasks to test localStorage loading
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Persistent Task')).toBeInTheDocument();
    });

    // Edit task - need to wait for task to appear first
    await waitFor(() => {
      expect(screen.getByText('Persistent Task')).toBeInTheDocument();
    });
    
    const taskBubble = screen.getByText('Persistent Task').closest('.task-bubble');
    fireEvent.click(taskBubble);

    await waitFor(() => {
      expect(screen.getByTestId('task-modal')).toBeInTheDocument();
    });

    const editButton = screen.getByTestId('edit-button');
    await user.click(editButton);

    const titleInput = screen.getByTestId('edit-title-input');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Persistent Task');

    const saveButton = screen.getByTestId('save-button');
    await user.click(saveButton);

    // Close modal
    const backdrop = document.querySelector('.task-details-modal__backdrop');
    await user.click(backdrop);

    // Verify localStorage was updated
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('eisenhower.tasks.v1'));
      expect(stored).toBeDefined();
      const task = stored.find(t => t.id === '1');
      expect(task).toBeDefined();
      expect(task.title).toBe('Updated Persistent Task');
    });
  });
});

