import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';
import { STORAGE_KEY, saveTasks, clearTasks } from './utils/storage.js';

describe('App Persistence', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    clearTasks();
  });

  afterEach(() => {
    // Clean up localStorage after each test
    clearTasks();
  });

  it('should load tasks from localStorage when initialTasks is not provided', () => {
    // Arrange: set localStorage key to JSON of tasks
    const storedTasks = [
      { id: '1', title: 'Stored Task 1', urgent: true, important: true },
      { id: '2', title: 'Stored Task 2', urgent: false, important: true }
    ];
    saveTasks(storedTasks);

    // Act: render App without initialTasks
    render(<App />);

    // Assert: tasks appear in correct quadrants
    const q1Dropzone = screen.getByTestId('dropzone-Q1');
    const q2Dropzone = screen.getByTestId('dropzone-Q2');
    
    expect(q1Dropzone).toHaveTextContent('Stored Task 1');
    expect(q2Dropzone).toHaveTextContent('Stored Task 2');
  });

  it('should persist tasks to localStorage when initialTasks not provided', async () => {
    const user = userEvent.setup();

    // Arrange: render App without initialTasks
    render(<App />);

    // Act: create a task through the UI
    const fabButton = screen.getByRole('button', { name: /add new task/i });
    await user.click(fabButton);

    const titleInput = screen.getByLabelText(/title/i);
    const urgentCheckbox = screen.getByRole('checkbox', { name: /urgent/i });
    const importantCheckbox = screen.getByRole('checkbox', { name: /important/i });

    await user.type(titleInput, 'New Persisted Task');
    await user.click(urgentCheckbox);
    await user.click(importantCheckbox);

    const submitButton = screen.getByRole('button', { name: /create task/i });
    await user.click(submitButton);

    // Wait for task to be created and persisted
    await waitFor(() => {
      expect(screen.queryByTestId('assignment-overlay')).toBeInTheDocument();
    });

    // Close the assignment overlay by waiting for auto-place or manually
    await waitFor(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored);
      expect(parsed).toBeInstanceOf(Array);
      const hasNewTask = parsed.some(task => task.title === 'New Persisted Task');
      expect(hasNewTask).toBe(true);
    }, { timeout: 15000 });
  });

  it('should use initialTasks and not load from localStorage when initialTasks is provided', () => {
    // Arrange: put tasks in localStorage
    const storedTasks = [
      { id: 'stored-1', title: 'Stored Task', urgent: true, important: true }
    ];
    saveTasks(storedTasks);

    // Arrange: different tasks via initialTasks prop
    const injectedTasks = [
      { id: 'injected-1', title: 'Injected Task', urgent: false, important: true }
    ];

    // Act: render with initialTasks
    render(<App initialTasks={injectedTasks} />);

    // Assert: rendered tasks come from initialTasks, not storage
    const q1Dropzone = screen.getByTestId('dropzone-Q1');
    const q2Dropzone = screen.getByTestId('dropzone-Q2');
    
    // Injected task should be in Q2 (not urgent, important)
    expect(q2Dropzone).toHaveTextContent('Injected Task');
    
    // Stored task should NOT appear
    expect(q1Dropzone).not.toHaveTextContent('Stored Task');
  });

  it('should not persist when initialTasks is provided', async () => {
    const user = userEvent.setup();

    // Arrange: clear localStorage and render with initialTasks
    clearTasks();
    const initialTasks = [
      { id: 'test-1', title: 'Test Task', urgent: true, important: true }
    ];
    render(<App initialTasks={initialTasks} />);

    // Act: create a new task
    const fabButton = screen.getByRole('button', { name: /add new task/i });
    await user.click(fabButton);

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Should Not Persist');

    const submitButton = screen.getByRole('button', { name: /create task/i });
    await user.click(submitButton);

    // Wait a bit for any persistence to occur
    await waitFor(() => {
      // Assert: localStorage should not contain the new task
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const hasNewTask = parsed.some(task => task.title === 'Should Not Persist');
        expect(hasNewTask).toBe(false);
      }
    }, { timeout: 2000 });
  });
});

