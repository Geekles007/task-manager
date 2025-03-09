'use client';

import { FC, useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useCall } from '../context/CallContext';
import { cn } from '../lib/utils';
import Button from './Button';

interface ConnectionControlProps {
  className?: string;
}

export const ConnectionControl: FC<ConnectionControlProps> = ({ className }) => {
  const { socket, isConnected, connect, disconnect } = useSocket();
  const { currentUserId, currentUserName } = useCall();
  const [userName, setUserName] = useState(currentUserName);
  const [userId, setUserId] = useState(currentUserId);
  const [connectionStatus, setConnectionStatus] = useState('idle');
  
  // Update connection status for UI feedback
  useEffect(() => {
    if (isConnected) {
      setConnectionStatus('connected');
    } else {
      // Only set to disconnected if we were previously connected
      if (connectionStatus === 'connecting' || connectionStatus === 'connected') {
        setConnectionStatus('disconnected');
      }
    }
  }, [isConnected, connectionStatus]);
  
  // Update localStorage when user ID or name changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('userId', userId);
      window.localStorage.setItem('userName', userName);
    }
  }, [userId, userName]);
  
  const handleConnect = () => {
    setConnectionStatus('connecting');
    console.log('Connecting with user:', { userId, userName });
    connect(userId, userName);
  };
  
  const handleDisconnect = () => {
    setConnectionStatus('disconnecting');
    disconnect();
  };
  
  const handleRandomizeUser = () => {
    const newUserId = `user-${Math.floor(Math.random() * 1000)}`;
    const newUserName = `User ${Math.floor(Math.random() * 1000)}`;
    
    setUserId(newUserId);
    setUserName(newUserName);
    
    if (isConnected && socket) {
      socket.emit('user:active', {
        userId: newUserId,
        userName: newUserName,
      });
    }
  };
  
  return (
    <div className={cn("bg-gray-800 rounded-lg p-4", className)}>
      <h2 className="text-lg font-semibold text-white mb-4">Connection Control</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-3 h-3 rounded-full", 
              isConnected ? "bg-green-500" : 
              connectionStatus === 'connecting' ? "bg-yellow-500 animate-pulse" : 
              "bg-red-500"
            )} />
            <span className="text-sm text-gray-300">
              {connectionStatus === 'connecting' ? "Connecting..." : 
               connectionStatus === 'disconnecting' ? "Disconnecting..." : 
               isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Button 
                variant="danger" 
                size="sm" 
                onClick={handleDisconnect}
                disabled={connectionStatus === 'disconnecting'}
              >
                {connectionStatus === 'disconnecting' ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            ) : (
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleConnect}
                disabled={connectionStatus === 'connecting'}
              >
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}
              </Button>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex flex-col">
            <label className="text-xs text-gray-400 mb-1">User ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="flex flex-col">
            <label className="text-xs text-gray-400 mb-1">User Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleRandomizeUser}
            className="w-full mt-2"
          >
            Randomize User
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionControl; 