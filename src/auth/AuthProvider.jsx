import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Auth context for managing user authentication state
 * 
 * This is a placeholder implementation that will be replaced with real Supabase/Firebase auth.
 * Currently stores user state in localStorage and memory.
 */

const AuthContext = createContext(null);

/**
 * AuthProvider component that provides auth context to children
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('anonymous');

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('eisenhower.auth.user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) {
          setUser(parsed);
          setStatus('authenticated');
        }
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
    }
  }, []);

  /**
   * Placeholder sign-in function
   * For now, creates a mock user. Later will integrate with Supabase/Firebase OAuth.
   */
  const signIn = () => {
    // TODO: Implement real OAuth flow with Supabase/Firebase
    // For now, create a mock user
    const mockUser = {
      id: crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}`,
      email: 'user@example.com'
    };
    
    setUser(mockUser);
    setStatus('authenticated');
    
    // Persist to localStorage
    try {
      localStorage.setItem('eisenhower.auth.user', JSON.stringify(mockUser));
    } catch (error) {
      console.error('Failed to save auth state:', error);
    }
  };

  /**
   * Sign out function
   * Clears user state and localStorage
   */
  const signOut = () => {
    setUser(null);
    setStatus('anonymous');
    
    // Clear from localStorage
    try {
      localStorage.removeItem('eisenhower.auth.user');
    } catch (error) {
      console.error('Failed to clear auth state:', error);
    }
  };

  const value = {
    user,
    status,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 * @returns {Object} Auth context with user, status, signIn, signOut
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // Return default context for tests or when not wrapped
    return {
      user: null,
      status: 'anonymous',
      signIn: () => {},
      signOut: () => {}
    };
  }
  return context;
}

