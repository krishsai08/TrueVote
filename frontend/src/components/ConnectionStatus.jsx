import React, { useState, useEffect } from 'react';
import socketManager from '../utils/socket.js';

export default function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      setIsConnected(socketManager.getConnectionStatus());
    };

    // Check initial status
    updateStatus();

    // Set up interval to check status
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      padding: '8px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 'bold',
      zIndex: 1000,
      backgroundColor: isConnected ? '#4CAF50' : '#f44336',
      color: 'white',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
    }}>
      {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
    </div>
  );
} 