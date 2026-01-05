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
});

