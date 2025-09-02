import { io } from 'socket.io-client';

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map();
  }

  connect() {
    if (this.socket && this.isConnected) return;

    const baseURL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    this.socket = io(baseURL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Join election room for real-time updates
  joinElection(electionId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-election', electionId);
    }
  }

  // Leave election room
  leaveElection(electionId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-election', electionId);
    }
  }

  // Join admin room
  joinAdmin() {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-admin');
    }
  }

  // Join user room
  joinUser(userId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-user', userId);
    }
  }

  // Listen for real-time updates
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      
      // Store listener for cleanup
      if (!this.eventListeners.has(event)) {
        this.eventListeners.set(event, []);
      }
      this.eventListeners.get(event).push(callback);
    }
  }

  // Remove event listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
      
      // Remove from stored listeners
      if (this.eventListeners.has(event)) {
        const listeners = this.eventListeners.get(event);
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    }
  }

  // Emit custom events
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }
}

// Create singleton instance
const socketManager = new SocketManager();

export default socketManager; 