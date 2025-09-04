import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
const AuthCtx = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');
    const loginTime = localStorage.getItem('loginTime');
    
    // Check if session has expired (30 minutes = 1800000 ms)
    if (token && loginTime) {
      const now = Date.now();
      const sessionDuration = 30 * 60 * 1000; // 30 minutes
      if (now - parseInt(loginTime) > sessionDuration) {
        localStorage.clear();
        sessionStorage.clear();
        return null;
      }
    }
    
    return token ? { token, role, name } : null;
  });

  const sessionTimeoutRef = useRef(null);

  const login = ({ token, role, name }) => {
    const loginTime = Date.now().toString();
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('name', name);
    localStorage.setItem('loginTime', loginTime);
    setUser({ token, role, name });
    
    // Set session timeout for 30 minutes
    setSessionTimeout();
  };

  const logout = () => { 
    localStorage.clear(); 
    sessionStorage.clear();
    setUser(null);
    
    // Clear session timeout
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
  };

  const setSessionTimeout = () => {
    // Clear existing timeout
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    
    // Set new timeout for 30 minutes
    sessionTimeoutRef.current = setTimeout(() => {
      console.log('Session expired - logging out user');
      logout();
    }, 30 * 60 * 1000); // 30 minutes
  };

  const resetSessionTimeout = () => {
    if (user) {
      setSessionTimeout();
    }
  };

  // Handle session logout when browser/tab is closed
  useEffect(() => {
    if (!user) return;

    // Store session flag in sessionStorage (cleared when tab/browser closes)
    sessionStorage.setItem('userSession', 'active');

    const handleBeforeUnload = (event) => {
      // Clear session data when page is about to unload
      sessionStorage.removeItem('userSession');
    };

    const handleVisibilityChange = () => {
      // Check if session is still valid when tab becomes visible again
      if (document.visibilityState === 'visible') {
        const sessionActive = sessionStorage.getItem('userSession');
        if (!sessionActive) {
          // Session was cleared (tab was closed), logout user
          logout();
        }
      }
    };

    const handleStorageChange = (event) => {
      // Handle logout from other tabs
      if (event.key === 'userSession' && !event.newValue) {
        logout();
      }
    };

    // Activity tracking for session timeout reset
    const handleUserActivity = () => {
      resetSessionTimeout();
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);
    
    // Track user activity to reset session timeout
    document.addEventListener('mousedown', handleUserActivity);
    document.addEventListener('keypress', handleUserActivity);
    document.addEventListener('scroll', handleUserActivity, true);
    document.addEventListener('touchstart', handleUserActivity);

    // Cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('mousedown', handleUserActivity);
      document.removeEventListener('keypress', handleUserActivity);
      document.removeEventListener('scroll', handleUserActivity, true);
      document.removeEventListener('touchstart', handleUserActivity);
    };
  }, [user]);

  // Check for existing session on mount
  useEffect(() => {
    const sessionActive = sessionStorage.getItem('userSession');
    if (!sessionActive && user) {
      // No active session found, logout user
      logout();
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, []);

  return <AuthCtx.Provider value={{ user, login, logout, resetSessionTimeout }}>{children}</AuthCtx.Provider>;
}

export function useAuth() { return useContext(AuthCtx); }
