import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getSession, signInStub, signOut } from './SessionStore.js';
import { SESSION_KEY } from './sessionKeys.js';

describe('SessionStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getSession', () => {
    it('should return signed out state when no session stored', () => {
      const session = getSession();
      expect(session).toEqual({
        isSignedIn: false,
        userId: null
      });
    });

    it('should return signed in state when version 1 session stored', () => {
      const userId = 'user_test123';
      const versioned = {
        version: 1,
        userId: userId
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(versioned));

      const session = getSession();
      expect(session).toEqual({
        isSignedIn: true,
        userId: userId
      });
    });

    it('should migrate legacy string format to version 1', () => {
      const userId = 'user_test456';
      localStorage.setItem(SESSION_KEY, JSON.stringify(userId));

      const session = getSession();
      expect(session).toEqual({
        isSignedIn: true,
        userId: userId
      });

      // Verify migration persisted
      const stored = localStorage.getItem(SESSION_KEY);
      const parsed = JSON.parse(stored);
      expect(parsed).toEqual({
        version: 1,
        userId: userId
      });
    });

    it('should return signed out when JSON is corrupt', () => {
      localStorage.setItem(SESSION_KEY, 'invalid json{broken');

      const session = getSession();
      expect(session).toEqual({
        isSignedIn: false,
        userId: null
      });
    });

    it('should return signed out when version 1 has invalid userId', () => {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        version: 1,
        userId: 123 // not a string
      }));

      const session = getSession();
      expect(session).toEqual({
        isSignedIn: false,
        userId: null
      });
    });

    it('should return signed out when unknown version', () => {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        version: 999,
        userId: 'user_test'
      }));

      const session = getSession();
      expect(session).toEqual({
        isSignedIn: false,
        userId: null
      });
    });

    it('should handle localStorage.getItem throwing an error', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('localStorage unavailable');
      });

      const session = getSession();
      expect(session).toEqual({
        isSignedIn: false,
        userId: null
      });

      localStorage.getItem = originalGetItem;
    });
  });

  describe('signInStub', () => {
    it('should create a stable random userId and persist it', () => {
      const session = signInStub();

      expect(session.isSignedIn).toBe(true);
      expect(session.userId).toBeTruthy();
      expect(session.userId).toMatch(/^user_/);

      // Verify persisted
      const stored = localStorage.getItem(SESSION_KEY);
      const parsed = JSON.parse(stored);
      expect(parsed).toEqual({
        version: 1,
        userId: session.userId
      });
    });

    it('should persist userId across getSession calls after signInStub', () => {
      const session1 = signInStub();
      const session2 = getSession();

      // getSession should return the persisted userId from signInStub
      expect(session2.userId).toBe(session1.userId);
      expect(session2.isSignedIn).toBe(true);
    });

    it('should handle localStorage.setItem throwing an error', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('localStorage quota exceeded');
      });

      const session = signInStub();
      // Should still return session state even if persistence failed
      expect(session.isSignedIn).toBe(true);
      expect(session.userId).toBeTruthy();

      localStorage.setItem = originalSetItem;
    });
  });

  describe('signOut', () => {
    it('should clear session and return signed out state', () => {
      // First sign in
      signInStub();
      expect(getSession().isSignedIn).toBe(true);

      // Then sign out
      const session = signOut();
      expect(session).toEqual({
        isSignedIn: false,
        userId: null
      });

      // Verify cleared
      expect(getSession().isSignedIn).toBe(false);
      const stored = localStorage.getItem(SESSION_KEY);
      expect(stored).toBeNull();
    });

    it('should handle localStorage.removeItem throwing an error', () => {
      signInStub();

      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = vi.fn(() => {
        throw new Error('localStorage unavailable');
      });

      const session = signOut();
      // Should still return signed out state even if clear failed
      expect(session).toEqual({
        isSignedIn: false,
        userId: null
      });

      localStorage.removeItem = originalRemoveItem;
    });
  });

  describe('integration', () => {
    it('should persist session across getSession calls', () => {
      const session1 = signInStub();
      const session2 = getSession();

      expect(session1.userId).toBe(session2.userId);
      expect(session1.isSignedIn).toBe(session2.isSignedIn);
    });

    it('should switch from signed in to signed out', () => {
      signInStub();
      expect(getSession().isSignedIn).toBe(true);

      signOut();
      expect(getSession().isSignedIn).toBe(false);
    });
  });
});

