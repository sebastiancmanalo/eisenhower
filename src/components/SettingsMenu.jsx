import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../auth/AuthProvider.jsx';
import './SettingsMenu.css';

function SettingsMenu({ onExport, onImport, onReset, notificationPreferences, onUpdateNotificationPreferences, onRequestBrowserPermission, onAuthStateChange }) {
  const auth = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, flipped: false });
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Calculate menu position when opening or when content changes
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const calculatePosition = () => {
      if (!buttonRef.current) return;
      
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = 12;
      
      // Estimate menu dimensions (will be refined after render)
      const menuWidth = 280;
      const estimatedMenuHeight = 500;
      
      // Measure actual menu if available (refined after first render)
      let actualMenuHeight = estimatedMenuHeight;
      if (menuRef.current) {
        const menuRect = menuRef.current.getBoundingClientRect();
        if (menuRect.height > 0) {
          actualMenuHeight = menuRect.height;
        }
      }
      
      // Align right edge of menu to right edge of button
      let left = buttonRect.right - menuWidth;
      
      // Ensure 12px margin from viewport edges
      const minLeft = margin;
      const maxLeft = viewportWidth - menuWidth - margin;
      
      if (left < minLeft) {
        left = minLeft;
      }
      if (left > maxLeft) {
        left = maxLeft;
      }
      
      // Position below button by default
      let top = buttonRect.bottom + 8;
      let flipped = false;
      
      // Check if menu would overflow bottom, flip upward if needed
      const minTop = margin;
      const maxBottom = viewportHeight - margin;
      
      if (top + actualMenuHeight > maxBottom) {
        // Flip upward
        top = buttonRect.top - actualMenuHeight - 8;
        flipped = true;
        
        // Ensure it still fits
        if (top < minTop) {
          top = minTop;
        }
        if (top + actualMenuHeight > maxBottom) {
          // If it still doesn't fit, position at viewport edge
          top = Math.max(minTop, viewportHeight - actualMenuHeight - margin);
        }
      } else if (top < minTop) {
        top = minTop;
      }
      
      setMenuPosition({ top, left, flipped });
    };

    // Initial calculation with estimate
    calculatePosition();

    // Refine position after menu renders in DOM
    const timeoutId = setTimeout(() => {
      calculatePosition();
    }, 0);

    // Recalculate on window resize
    const handleResize = () => {
      calculatePosition();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, showNotificationSettings, notificationPreferences, auth]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle Escape key and click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleExport = () => {
    onExport();
    setIsOpen(false);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (event) => {
      const file = event.target.files?.[0];
      if (file) {
        onImport(file);
      }
      setIsOpen(false);
    };
    input.click();
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all local data? This cannot be undone.')) {
      onReset();
      setIsOpen(false);
    }
  };

  const handleToggleInAppReminders = () => {
    if (onUpdateNotificationPreferences && notificationPreferences) {
      onUpdateNotificationPreferences({
        ...notificationPreferences,
        inAppReminders: !notificationPreferences.inAppReminders
      });
    }
  };

  const handleToggleBrowserNotifications = () => {
    if (!notificationPreferences) return;
    
    if (notificationPreferences.browserNotifications) {
      // Disable
      if (onUpdateNotificationPreferences) {
        onUpdateNotificationPreferences({
          ...notificationPreferences,
          browserNotifications: false
        });
      }
    } else {
      // Enable - request permission
      if (onRequestBrowserPermission) {
        onRequestBrowserPermission();
      }
    }
  };

  const handleQuietHoursChange = (field, value) => {
    if (onUpdateNotificationPreferences && notificationPreferences) {
      onUpdateNotificationPreferences({
        ...notificationPreferences,
        quietHours: {
          ...notificationPreferences.quietHours,
          [field]: value
        }
      });
    }
  };

  const handleSignIn = () => {
    auth.signIn();
    if (onAuthStateChange) {
      onAuthStateChange();
    }
  };

  const handleSignOut = () => {
    auth.signOut();
    if (onAuthStateChange) {
      onAuthStateChange();
    }
  };

  const menuContent = isOpen ? (
    <div className="settings-menu__overlay">
      <div
        className="settings-menu__backdrop"
        onClick={() => setIsOpen(false)}
        data-testid="overflow-menu-backdrop"
      />
      <div
        ref={menuRef}
        className={`settings-menu__dropdown ${menuPosition.flipped ? 'settings-menu__dropdown--flipped' : ''}`}
        style={{
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`,
        }}
        data-testid="overflow-menu-panel"
      >
        <button
          className="settings-menu__item"
          onClick={handleExport}
          type="button"
        >
          Export tasks
        </button>
        <button
          className="settings-menu__item"
          onClick={handleImport}
          type="button"
        >
          Import tasks
        </button>
        <div className="settings-menu__divider"></div>
        <button
          className="settings-menu__item"
          onClick={() => setShowNotificationSettings(!showNotificationSettings)}
          type="button"
        >
          Notifications {showNotificationSettings ? '▼' : '▶'}
        </button>
        {showNotificationSettings && notificationPreferences && (
          <div className="settings-menu__notification-settings">
            <label className="settings-menu__toggle">
              <input
                type="checkbox"
                checked={notificationPreferences.inAppReminders}
                onChange={handleToggleInAppReminders}
              />
              <span>In-app reminders</span>
            </label>
            <label className="settings-menu__toggle">
              <input
                type="checkbox"
                checked={notificationPreferences.browserNotifications}
                onChange={handleToggleBrowserNotifications}
              />
              <span>Browser notifications</span>
            </label>
            <div className="settings-menu__quiet-hours">
              <label>Quiet hours</label>
              <div className="settings-menu__time-inputs">
                <div>
                  <label>Start:</label>
                  <input
                    type="time"
                    value={notificationPreferences.quietHours.start}
                    onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                  />
                </div>
                <div>
                  <label>End:</label>
                  <input
                    type="time"
                    value={notificationPreferences.quietHours.end}
                    onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="settings-menu__divider"></div>
        <div className="settings-menu__section">
          <div className="settings-menu__section-title">Account</div>
          {auth.status === 'anonymous' ? (
            <button
              className="settings-menu__item"
              onClick={handleSignIn}
              type="button"
            >
              Sign in (stub)
            </button>
          ) : (
            <>
              <div className="settings-menu__account-info">
                <div className="settings-menu__account-label">User ID:</div>
                <div className="settings-menu__account-value">{auth.user?.id || 'Unknown'}</div>
              </div>
              {auth.user?.email && (
                <div className="settings-menu__account-info">
                  <div className="settings-menu__account-label">Email:</div>
                  <div className="settings-menu__account-value">{auth.user.email}</div>
                </div>
              )}
              <div className="settings-menu__account-note">
                Enables sync later (stub mode)
              </div>
              <button
                className="settings-menu__item"
                onClick={handleSignOut}
                type="button"
              >
                Sign out
              </button>
            </>
          )}
        </div>
        <div className="settings-menu__divider"></div>
        <button
          className="settings-menu__item settings-menu__item--danger"
          onClick={handleReset}
          type="button"
        >
          Reset local data
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="settings-menu">
      <button
        ref={buttonRef}
        className="settings-menu__button"
        onClick={handleToggle}
        type="button"
        aria-label="Settings menu"
        aria-expanded={isOpen}
      >
        <span className="settings-menu__icon">⋯</span>
      </button>
      {menuContent && createPortal(menuContent, document.body)}
    </div>
  );
}

export default SettingsMenu;

