import React, { createContext, useContext, useState, useEffect } from 'react';
const AuthCtx = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');
    return token ? { token, role, name } : null;
  });

  const login = ({ token, role, name }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('name', name);
    setUser({ token, role, name });
  };

  const logout = () => { 
    localStorage.clear(); 
    sessionStorage.clear();
    setUser(null); 
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

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);

    // Cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
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

  return <AuthCtx.Provider value={{ user, login, logout }}>{children}</AuthCtx.Provider>;
}

export function useAuth() { return useContext(AuthCtx); }
