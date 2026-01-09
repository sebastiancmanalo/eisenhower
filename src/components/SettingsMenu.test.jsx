import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsMenu from './SettingsMenu.jsx';
import { AuthProvider } from '../auth/AuthProvider.jsx';

describe('SettingsMenu Portal Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset body overflow
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // Reset body overflow (React Testing Library will clean up DOM)
    document.body.style.overflow = '';
  });

  const renderWithAuth = (component) => {
    return render(
      <AuthProvider>
        {component}
      </AuthProvider>
    );
  };

  it('should render menu button', () => {
    renderWithAuth(
      <SettingsMenu
        onExport={vi.fn()}
        onImport={vi.fn()}
        onReset={vi.fn()}
        notificationPreferences={null}
      />
    );

    const button = screen.getByRole('button', { name: /settings menu/i });
    expect(button).toBeInTheDocument();
  });

  it('should open menu and render all items when button is clicked', async () => {
    const user = userEvent.setup();
    
    renderWithAuth(
      <SettingsMenu
        onExport={vi.fn()}
        onImport={vi.fn()}
        onReset={vi.fn()}
        notificationPreferences={null}
      />
    );

    const button = screen.getByRole('button', { name: /settings menu/i });
    await user.click(button);

    // Menu should be rendered in portal (document.body)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /export tasks/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /import tasks/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset local data/i })).toBeInTheDocument();
    });

    // Verify menu is rendered in document.body (portal)
    const menu = document.body.querySelector('.settings-menu__dropdown');
    expect(menu).toBeInTheDocument();
  });

  it('should close menu when clicking outside (on backdrop)', async () => {
    const user = userEvent.setup();
    
    renderWithAuth(
      <SettingsMenu
        onExport={vi.fn()}
        onImport={vi.fn()}
        onReset={vi.fn()}
        notificationPreferences={null}
      />
    );

    const button = screen.getByRole('button', { name: /settings menu/i });
    await user.click(button);

    // Wait for menu to open
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /export tasks/i })).toBeInTheDocument();
    });

    // Click on backdrop
    const backdrop = screen.getByTestId('overflow-menu-backdrop');
    await user.click(backdrop);

    // Menu should close
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /export tasks/i })).not.toBeInTheDocument();
    });
  });

  it('should close menu when pressing Escape key', async () => {
    const user = userEvent.setup();
    
    renderWithAuth(
      <SettingsMenu
        onExport={vi.fn()}
        onImport={vi.fn()}
        onReset={vi.fn()}
        notificationPreferences={null}
      />
    );

    const button = screen.getByRole('button', { name: /settings menu/i });
    await user.click(button);

    // Wait for menu to open
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /export tasks/i })).toBeInTheDocument();
    });

    // Press Escape key
    await user.keyboard('{Escape}');

    // Menu should close
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /export tasks/i })).not.toBeInTheDocument();
    });
  });

  it('should prevent body scroll when menu is open', async () => {
    const user = userEvent.setup();
    
    renderWithAuth(
      <SettingsMenu
        onExport={vi.fn()}
        onImport={vi.fn()}
        onReset={vi.fn()}
        notificationPreferences={null}
      />
    );

    const button = screen.getByRole('button', { name: /settings menu/i });
    await user.click(button);

    // Wait for menu to open
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /export tasks/i })).toBeInTheDocument();
    });

    // Body should have overflow: hidden
    expect(document.body.style.overflow).toBe('hidden');

    // Close menu
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /export tasks/i })).not.toBeInTheDocument();
    });

    // Body overflow should be restored
    expect(document.body.style.overflow).toBe('');
  });

  it('should have correct overlay structure with backdrop and panel (regression test)', async () => {
    const user = userEvent.setup();
    
    renderWithAuth(
      <SettingsMenu
        onExport={vi.fn()}
        onImport={vi.fn()}
        onReset={vi.fn()}
        notificationPreferences={null}
      />
    );

    // Open menu via "…" button
    const button = screen.getByRole('button', { name: /settings menu/i });
    await user.click(button);

    // Wait for menu to open
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /export tasks/i })).toBeInTheDocument();
    });

    // Verify menuPanel exists in document.body (portal)
    const menuPanel = screen.getByTestId('overflow-menu-panel');
    expect(menuPanel).toBeInTheDocument();
    expect(menuPanel).toBeInTheDocument();
    expect(document.body.contains(menuPanel)).toBe(true);

    // Verify menuBackdrop exists
    const menuBackdrop = screen.getByTestId('overflow-menu-backdrop');
    expect(menuBackdrop).toBeInTheDocument();
    expect(document.body.contains(menuBackdrop)).toBe(true);

    // Verify backdrop is a child of overlay
    const overlay = menuPanel.closest('.settings-menu__overlay');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toContainElement(menuBackdrop);
    expect(overlay).toContainElement(menuPanel);

    // Menu closes on click backdrop
    await user.click(menuBackdrop);

    await waitFor(() => {
      expect(screen.queryByTestId('overflow-menu-panel')).not.toBeInTheDocument();
      expect(screen.queryByTestId('overflow-menu-backdrop')).not.toBeInTheDocument();
    });
  });
});
