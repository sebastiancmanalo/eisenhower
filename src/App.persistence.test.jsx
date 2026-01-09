import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';
import { STORAGE_KEY } from './utils/storage.js';
import { saveTasks, clearTasks } from './data/storage/TaskStore.js';

describe('App Persistence', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    clearTasks();
  });

  afterEach(() => {
    // Clean up localStorage after each test
    clearTasks();
  });

  it('should load tasks from localStorage when initialTasks is not provided', async () => {
    // Arrange: set localStorage key to JSON of tasks (using repository)
    const storedTasks = [
      { id: '1', title: 'Stored Task 1', urgent: true, important: true, createdAt: Date.now(), dueDate: null, notificationFrequency: 'high' },
      { id: '2', title: 'Stored Task 2', urgent: false, important: true, createdAt: Date.now(), dueDate: null, notificationFrequency: 'medium' }
    ];
    await saveTasks(storedTasks);

    // Act: render App without initialTasks
    render(<App />);

    // Assert: tasks appear in correct quadrants (wait for async load)
    await waitFor(() => {
      const q1Dropzone = screen.getByTestId('dropzone-Q1');
      expect(q1Dropzone).toHaveTextContent('Stored Task 1');
    });
    
    const q2Dropzone = screen.getByTestId('dropzone-Q2');
    expect(q2Dropzone).toHaveTextContent('Stored Task 2');
  });

  it('should persist tasks to localStorage when initialTasks not provided', async () => {
    const user = userEvent.setup();

    // Arrange: render App without initialTasks
    render(<App />);
    
    // Wait for async loading to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add new task/i })).toBeInTheDocument();
    }, { timeout: 2000 });

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

    // Wait for auto-placement to complete
    await waitFor(() => {
      expect(screen.queryByTestId('assignment-overlay')).not.toBeInTheDocument();
    }, { timeout: 12000 });

    // Wait for debounced save (200ms) plus a buffer
    await waitFor(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored);
      // Handle versioned format
      const tasks = parsed.version === 1 ? parsed.tasks : parsed;
      expect(Array.isArray(tasks)).toBe(true);
      const hasNewTask = tasks.some(task => task.title === 'New Persisted Task');
      expect(hasNewTask).toBe(true);
    }, { timeout: 10000 });
  });

  it('should use initialTasks and not load from localStorage when initialTasks is provided', async () => {
    // Arrange: put tasks in localStorage
    const storedTasks = [
      { id: 'stored-1', title: 'Stored Task', urgent: true, important: true, createdAt: Date.now(), dueDate: null, notificationFrequency: 'high' }
    ];
    await saveTasks(storedTasks);

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
      { id: 'test-1', title: 'Test Task', urgent: true, important: true, createdAt: Date.now(), dueDate: null, notificationFrequency: 'high' }
    ];
    render(<App initialTasks={initialTasks} />);

    // Act: create a new task
    const fabButton = screen.getByRole('button', { name: /add new task/i });
    await user.click(fabButton);

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Should Not Persist');

    const submitButton = screen.getByRole('button', { name: /create task/i });
    await user.click(submitButton);

    // Wait for auto-placement
    await waitFor(() => {
      expect(screen.queryByTestId('assignment-overlay')).not.toBeInTheDocument();
    }, { timeout: 12000 });

    // Wait for debounce period plus buffer, then check
    await waitFor(() => {
      // Assert: localStorage should not contain the new task (test mode, no persistence)
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const tasks = parsed.version === 1 ? parsed.tasks : parsed;
        const hasNewTask = tasks.some(task => task.title === 'Should Not Persist');
        expect(hasNewTask).toBe(false);
      }
    }, { timeout: 10000 });
  });

  it('should handle corrupted localStorage and load demo tasks without crashing', async () => {
    // Arrange: set localStorage to invalid JSON
    localStorage.setItem(STORAGE_KEY, 'invalid json{broken');

    // Act: render App without initialTasks
    render(<App />);

    // Assert: app should not crash and should load demo tasks
    await waitFor(() => {
      // Demo tasks should be visible (TaskStore returns empty on parse error, app falls back to defaults)
      expect(screen.getByRole('button', { name: /add new task/i })).toBeInTheDocument();
    }, { timeout: 2000 });

    // Verify demo tasks are present (at least one default task should be visible)
    await waitFor(() => {
      const q1Dropzone = screen.getByTestId('dropzone-Q1');
      // Default tasks should include at least one task
      expect(q1Dropzone.textContent).toBeTruthy();
    }, { timeout: 2000 });
  });

  it('should persist created task and reload it after unmount/remount', async () => {
    const user = userEvent.setup();

    // Arrange: clear localStorage
    clearTasks();

    // Act 1: render App and create a task
    const { unmount } = render(<App />);
    
    // Wait for async loading to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add new task/i })).toBeInTheDocument();
    }, { timeout: 2000 });

    // Create a task
    const fabButton = screen.getByRole('button', { name: /add new task/i });
    await user.click(fabButton);

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Persistent Task');

    const submitButton = screen.getByRole('button', { name: /create task/i });
    await user.click(submitButton);

    // Wait for assignment overlay
    await waitFor(() => {
      expect(screen.queryByTestId('assignment-overlay')).toBeInTheDocument();
    });

    // Wait for auto-placement to complete (10 seconds)
    await waitFor(() => {
      expect(screen.queryByTestId('assignment-overlay')).not.toBeInTheDocument();
    }, { timeout: 12000 });

    // Wait for debounced save (250ms) plus a buffer
    await waitFor(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored);
      const tasks = parsed.version === 1 ? parsed.tasks : parsed;
      const hasNewTask = tasks.some(task => task.title === 'Persistent Task');
      expect(hasNewTask).toBe(true);
    }, { timeout: 10000 });

    // Unmount App
    unmount();

    // Act 2: remount App
    render(<App />);

    // Assert: task should be reloaded and visible
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add new task/i })).toBeInTheDocument();
    }, { timeout: 2000 });

    await waitFor(() => {
      // Task should be visible in the correct quadrant (it was auto-placed based on flags)
      const dropzones = screen.getAllByTestId(/^dropzone-/);
      const hasPersistentTask = dropzones.some(dz => dz.textContent.includes('Persistent Task'));
      expect(hasPersistentTask).toBe(true);
    }, { timeout: 5000 });
  });
});

