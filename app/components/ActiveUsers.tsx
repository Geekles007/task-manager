'use client';

import { FC } from 'react';
import { useSocket } from '../context/SocketContext';
import { cn } from '../lib/utils';
import UserCallButton from './UserCallButton';

interface ActiveUsersProps {
  className?: string;
}

export const ActiveUsers: FC<ActiveUsersProps> = ({ className }) => {
  const { activeUsers, isConnected } = useSocket();
  
  return (
    <div className={cn("bg-gray-800 rounded-lg p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Online</h2>
        <div className="flex items-center">
          <div className={cn("w-2 h-2 rounded-full mr-2", isConnected ? "bg-green-500" : "bg-red-500")} />
          <span className="text-xs text-gray-400">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>
      
      {activeUsers.length === 0 ? (
        <p className="text-gray-400 text-sm">No users online</p>
      ) : (
        <div className="space-y-2">
          {activeUsers.map((user) => (
            <div key={user.userId} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                  {user.userName.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{user.userName}</div>
                  <div className="text-xs text-gray-400">
                    Active {user.lastActive ? `${Math.floor((Date.now() - user.lastActive) / 1000)}s ago` : 'now'}
                  </div>
                </div>
              </div>
              
              <UserCallButton 
                userId={user.userId} 
                userName={user.userName} 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveUsers; 