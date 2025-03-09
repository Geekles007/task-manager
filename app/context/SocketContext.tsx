'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Issue, Activity, User } from '../types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  activeUsers: User[];
  activities: Activity[];
  connect: (userId?: string, userName?: string) => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  activeUsers: [],
  activities: [],
  connect: () => {},
  disconnect: () => {},
});

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  // Initialize socket once
  useEffect(() => {
    // Create a socket connection but don't connect automatically
    const socketInstance = io({
      path: '/api/socket',
      autoConnect: false, // Don't connect automatically
    });

    // Socket event handlers
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    socketInstance.on('users:active', (users: User[]) => {
      setActiveUsers(users);
    });

    socketInstance.on('activity:new', (activity: Activity) => {
      setActivities((prev) => [activity, ...prev].slice(0, 20));
    });

    setSocket(socketInstance);

    // Connect by default
    socketInstance.connect();

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Connect method
  const connect = useCallback((userId?: string, userName?: string) => {
    if (!socket) return;
    
    console.log('Connecting socket...');
    socket.connect();
    
    // If user info is provided, emit user:active event
    if (userId && userName) {
      setTimeout(() => {
        if (socket.connected) {
          console.log('Emitting user:active with:', { userId, userName });
          socket.emit('user:active', { userId, userName });
        }
      }, 500); // Small delay to ensure connection is established
    }
  }, [socket]);

  // Disconnect method
  const disconnect = useCallback(() => {
    if (!socket) return;
    
    console.log('Disconnecting socket...');
    socket.disconnect();
  }, [socket]);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      isConnected, 
      activeUsers, 
      activities,
      connect,
      disconnect
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext); 