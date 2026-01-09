/**
 * SessionStore - Session abstraction layer for user authentication state
 * 
 * Provides a simple interface for managing user session state:
 * - getSession(): returns current session state
 * - signInStub(): creates a stable random userId and persists it
 * - signOut(): clears session (but does NOT delete task data)
 * 
 * Uses localStorage for persistence. Future-proofed for Supabase/Firebase integration.
 */

import { SESSION_KEY } from './sessionKeys.js';

const CURRENT_SCHEMA_VERSION = 1;

/**
 * Generates a stable random user ID
 * @returns {string} User ID in format "user_<uuid>"
 */
function generateUserId() {
  const uuid = crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  return `user_${uuid}`;
}

/**
 * Gets the current session state
 * @returns {{ isSignedIn: boolean, userId: string | null }} Session state
 */
export function getSession() {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) {
      return { isSignedIn: false, userId: null };
    }

    let parsed;
    try {
      parsed = JSON.parse(stored);
    } catch (parseError) {
      console.error('Failed to parse stored session (corrupt JSON):', parseError);
      return { isSignedIn: false, userId: null };
    }

    // Handle versioned format
    if (parsed && typeof parsed === 'object' && 'version' in parsed) {
      if (parsed.version === 1) {
        if (parsed.userId && typeof parsed.userId === 'string') {
          return { isSignedIn: true, userId: parsed.userId };
        }
        // Version 1 with invalid userId - return signed out
        console.error('Invalid userId format in version 1 session');
        return { isSignedIn: false, userId: null };
      }
      // Unknown version - return signed out
      console.error('Unknown session schema version:', parsed.version);
      return { isSignedIn: false, userId: null };
    }

    // Handle legacy format (just userId string) - migrate to version 1
    if (typeof parsed === 'string' && parsed.startsWith('user_')) {
      // Migrate to version 1 format
      const versioned = {
        version: CURRENT_SCHEMA_VERSION,
        userId: parsed
      };
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(versioned));
      } catch (error) {
        console.error('Failed to migrate session to version 1:', error);
      }
      return { isSignedIn: true, userId: parsed };
    }

    // Invalid format - return signed out
    console.error('Invalid session format:', parsed);
    return { isSignedIn: false, userId: null };
  } catch (error) {
    console.error('Failed to load session from storage:', error);
    return { isSignedIn: false, userId: null };
  }
}

/**
 * Signs in with a stub user (creates stable random userId and persists it)
 * @returns {{ isSignedIn: boolean, userId: string }} Session state after sign-in
 */
export function signInStub() {
  const userId = generateUserId();
  
  const versioned = {
    version: CURRENT_SCHEMA_VERSION,
    userId: userId
  };

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(versioned));
    return { isSignedIn: true, userId: userId };
  } catch (error) {
    console.error('Failed to save session to storage:', error);
    // Still return the session state even if persistence failed
    return { isSignedIn: true, userId: userId };
  }
}

/**
 * Signs out (clears session, but does NOT delete task data)
 * @returns {{ isSignedIn: boolean, userId: null }} Session state after sign-out
 */
export function signOut() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear session from storage:', error);
  }
  
  return { isSignedIn: false, userId: null };
}

