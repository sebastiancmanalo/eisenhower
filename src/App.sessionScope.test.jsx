import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';
import { signInStub, signOut, getSession } from './data/session/SessionStore.js';
import * as TaskRepository from './data/repository/TaskRepository.js';
import { SESSION_KEY } from './data/session/sessionKeys.js';

describe('App Session Scope Switching', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up localStorage after each test
    localStorage.clear();
  });

  it('should switch storage scope when signing in', async () => {
    const user = userEvent.setup();

    // Start anonymous
    expect(getSession().isSignedIn).toBe(false);

    // Render App
    render(<App />);

    // Wait for app to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add new task/i })).toBeInTheDocument();
    }, { timeout: 2000 });

    // Create a task while anonymous
    const fabButton = screen.getByRole('button', { name: /add new task/i });
    await user.click(fabButton);

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Anonymous Task');

    const submitButton = screen.getByRole('button', { name: /create task/i });
    await user.click(submitButton);

    // Wait for auto-placement to complete
    await waitFor(() => {
      expect(screen.queryByTestId('assignment-overlay')).not.toBeInTheDocument();
    }, { timeout: 12000 });

    // Verify task is visible
    await waitFor(() => {
      expect(screen.getByText('Anonymous Task')).toBeInTheDocument();
    });

    // Sign in stub
    signInStub();
    const session = getSession();
    expect(session.isSignedIn).toBe(true);

    // Trigger auth state change by clicking settings and signing in
    const settingsButton = screen.getByRole('button', { name: /settings menu/i });
    await user.click(settingsButton);

    // Wait for menu to appear
    await waitFor(() => {
      expect(screen.getByText('Sign in (stub)')).toBeInTheDocument();
    });

    const signInButton = screen.getByText('Sign in (stub)');
    await user.click(signInButton);

    // Wait for tasks to reload (should switch to signed-in scope, likely empty)
    await waitFor(() => {
      // Tasks should reload - anonymous task should disappear (different scope)
      // We expect either empty state or default tasks
      const anonymousTask = screen.queryByText('Anonymous Task');
      // Task should not be visible (different scope)
      expect(anonymousTask).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should switch back to anonymous scope when signing out', async () => {
    const user = userEvent.setup();

    // Sign in first
    signInStub();
    expect(getSession().isSignedIn).toBe(true);

    // Render App
    render(<App />);

    // Wait for app to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add new task/i })).toBeInTheDocument();
    }, { timeout: 2000 });

    // Create a task while signed in
    const fabButton = screen.getByRole('button', { name: /add new task/i });
    await user.click(fabButton);

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Signed In Task');

    const submitButton = screen.getByRole('button', { name: /create task/i });
    await user.click(submitButton);

    // Wait for auto-placement to complete
    await waitFor(() => {
      expect(screen.queryByTestId('assignment-overlay')).not.toBeInTheDocument();
    }, { timeout: 12000 });

    // Verify task is visible
    await waitFor(() => {
      expect(screen.getByText('Signed In Task')).toBeInTheDocument();
    });

    // Sign out
    signOut();
    expect(getSession().isSignedIn).toBe(false);

    // Trigger auth state change by clicking settings and signing out
    const settingsButton = screen.getByRole('button', { name: /settings menu/i });
    await user.click(settingsButton);

    // Wait for menu to appear
    await waitFor(() => {
      expect(screen.getByText(/signed in as/i)).toBeInTheDocument();
    });

    const signOutButton = screen.getByText('Sign out');
    await user.click(signOutButton);

    // Wait for tasks to reload (should switch to anonymous scope)
    await waitFor(() => {
      // Tasks should reload - signed in task should disappear (different scope)
      const signedInTask = screen.queryByText('Signed In Task');
      // Task should not be visible (different scope)
      expect(signedInTask).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should persist tasks in correct scope across reload', async () => {
    const user = userEvent.setup();

    // Sign in
    const signInResult = signInStub();
    expect(signInResult.isSignedIn).toBe(true);
    const userId = signInResult.userId;

    // Render App (capture unmount)
    const { unmount } = render(<App />);

    // Wait for app to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add new task/i })).toBeInTheDocument();
    }, { timeout: 2000 });

    // Create a task while signed in
    const fabButton = screen.getByRole('button', { name: /add new task/i });
    await user.click(fabButton);

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Persisted Signed In Task');

    const submitButton = screen.getByRole('button', { name: /create task/i });
    await user.click(submitButton);

    // Wait for auto-placement to complete
    await waitFor(() => {
      expect(screen.queryByTestId('assignment-overlay')).not.toBeInTheDocument();
    }, { timeout: 12000 });

    // Wait for debounced save
    await waitFor(async () => {
      const { tasks } = await TaskRepository.loadTasks();
      const hasTask = tasks.some(task => task.title === 'Persisted Signed In Task');
      expect(hasTask).toBe(true);
    }, { timeout: 5000 });

    // Unmount App
    unmount();

    // Verify session still exists
    const session = getSession();
    expect(session.isSignedIn).toBe(true);
    expect(session.userId).toBe(userId);

    // Remount App
    render(<App />);

    // Wait for app to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add new task/i })).toBeInTheDocument();
    }, { timeout: 2000 });

    // Verify task persists in signed-in scope
    await waitFor(() => {
      expect(screen.getByText('Persisted Signed In Task')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should show toast when signing in', async () => {
    const user = userEvent.setup();

    // Render App
    render(<App />);

    // Wait for app to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add new task/i })).toBeInTheDocument();
    }, { timeout: 2000 });

    // Open settings
    const settingsButton = screen.getByRole('button', { name: /settings menu/i });
    await user.click(settingsButton);

    // Wait for menu to appear
    await waitFor(() => {
      expect(screen.getByText('Sign in (stub)')).toBeInTheDocument();
    });

    // Sign in
    const signInButton = screen.getByText('Sign in (stub)');
    await user.click(signInButton);

    // Wait for toast
    await waitFor(() => {
      expect(screen.getByText(/signed in as/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should show toast when signing out', async () => {
    const user = userEvent.setup();

    // Sign in first
    signInStub();

    // Render App
    render(<App />);

    // Wait for app to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add new task/i })).toBeInTheDocument();
    }, { timeout: 2000 });

    // Open settings
    const settingsButton = screen.getByRole('button', { name: /settings menu/i });
    await user.click(settingsButton);

    // Wait for menu to appear
    await waitFor(() => {
      expect(screen.getByText(/signed in as/i)).toBeInTheDocument();
    });

    // Sign out
    const signOutButton = screen.getByText('Sign out');
    await user.click(signOutButton);

    // Wait for toast
    await waitFor(() => {
      expect(screen.getByText('Signed out')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

