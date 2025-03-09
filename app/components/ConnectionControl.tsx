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
  
  // Auto-connect on component mount
  useEffect(() => {
    if (!isConnected && connectionStatus === 'idle') {
      handleConnect();
    }
  }, [isConnected]); // eslint-disable-line react-hooks/exhaustive-deps
  
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
    const newUserId = `user-${Math.floor(Math.random() * 10000)}`;
    const newUserName = `User ${Math.floor(Math.random() * 10000)}`;
    
    setUserId(newUserId);
    setUserName(newUserName);
    
    // If connected, disconnect and reconnect with new identity
    if (isConnected) {
      disconnect();
      setTimeout(() => {
        connect(newUserId, newUserName);
      }, 500);
    }
  };
  
  return (
    <div className={cn("p-4 bg-gray-800 rounded-md", className)}>
      <h3 className="text-sm font-semibold text-white mb-3">Connection</h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">User ID</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={isConnected}
            className={cn(
              "w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white",
              isConnected && "opacity-70 cursor-not-allowed"
            )}
          />
        </div>
        
        <div>
          <label className="block text-xs text-gray-400 mb-1">User Name</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            disabled={isConnected}
            className={cn(
              "w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white",
              isConnected && "opacity-70 cursor-not-allowed"
            )}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              connectionStatus === 'connected' && "bg-green-500",
              connectionStatus === 'connecting' && "bg-yellow-500",
              connectionStatus === 'disconnected' && "bg-red-500",
              connectionStatus === 'disconnecting' && "bg-orange-500",
              connectionStatus === 'idle' && "bg-gray-500"
            )} />
            <span className="text-xs text-gray-300 capitalize">{connectionStatus}</span>
          </div>
          
          <button
            onClick={handleRandomizeUser}
            className="text-xs text-indigo-400 hover:text-indigo-300"
            disabled={connectionStatus === 'connecting' || connectionStatus === 'disconnecting'}
          >
            Randomize
          </button>
        </div>
        
        <div className="flex gap-2">
          {!isConnected ? (
            <Button
              onClick={handleConnect}
              disabled={connectionStatus === 'connecting'}
              className="w-full"
            >
              {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}
            </Button>
          ) : (
            <Button
              onClick={handleDisconnect}
              disabled={connectionStatus === 'disconnecting'}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {connectionStatus === 'disconnecting' ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionControl; 