'use client';

import { FC, useEffect, useState } from 'react';
import { cn } from '../lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSocket } from '../context/SocketContext';
import { User } from '../types';

interface IssueCardProps {
  id: string;
  title: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'done' | 'canceled';
  priority: 'no-priority' | 'low' | 'medium' | 'high' | 'urgent';
  assignee?: {
    name: string;
    avatar?: string;
  };
  dueDate?: string;
  labels?: string[];
  className?: string;
}

const statusColors = {
  'backlog': 'bg-gray-500',
  'todo': 'bg-blue-500',
  'in-progress': 'bg-yellow-500',
  'done': 'bg-green-500',
  'canceled': 'bg-red-500',
};

const priorityIcons = {
  'no-priority': '◯',
  'low': '↓',
  'medium': '→',
  'high': '↑',
  'urgent': '⚠️',
};

const priorityColors = {
  'no-priority': 'text-gray-400',
  'low': 'text-blue-400',
  'medium': 'text-yellow-400',
  'high': 'text-orange-400',
  'urgent': 'text-red-400',
};

// Generate a consistent user ID and name for this browser session
const sessionUserId = `user-${Math.floor(Math.random() * 1000)}`;
const sessionUserName = `User ${Math.floor(Math.random() * 1000)}`;

export const IssueCard: FC<IssueCardProps> = ({
  id,
  title,
  status,
  priority,
  assignee,
  dueDate,
  labels = [],
  className,
}) => {
  const [activeViewers, setActiveViewers] = useState<User[]>([]);
  const { socket, isConnected } = useSocket();
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if we're on mobile on initial render and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // Check on initial render
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  useEffect(() => {
    if (!socket || !isConnected) return;
    
    // Notify others when viewing this issue
    socket.emit('issue:view', { 
      issueId: id, 
      userId: sessionUserId, 
      userName: sessionUserName 
    });
    
    // Listen for others viewing this issue
    socket.on('issue:viewing', ({ issueId, users }: { issueId: string; users: User[] }) => {
      if (issueId === id) {
        // Filter out the current user from the viewers list
        const filteredUsers = users.filter(user => user.userId !== sessionUserId);
        setActiveViewers(filteredUsers);
      }
    });
    
    return () => {
      socket.emit('issue:leave', { issueId: id, userId: sessionUserId });
      socket.off('issue:viewing');
    };
  }, [id, socket, isConnected]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "p-3 bg-gray-800 rounded-md border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer w-full",
        isDragging && "shadow-lg",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className={cn("w-2 h-2 rounded-full", statusColors[status])} />
        </div>
        
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{id}</span>
              <span className={cn("text-xs font-medium", priorityColors[priority])}>
                {priorityIcons[priority]}
              </span>
            </div>
            
            {assignee && (
              <div className="flex items-center">
                <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center text-xs overflow-hidden">
                  {assignee.avatar ? (
                    <img src={assignee.avatar} alt={assignee.name} className="w-full h-full object-cover" />
                  ) : (
                    assignee.name.charAt(0)
                  )}
                </div>
              </div>
            )}
          </div>
          
          <h3 className="text-sm font-medium text-white mb-1 truncate">{title}</h3>
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400 capitalize">
              {status.replace('-', ' ')}
            </span>
            
            {labels.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {labels.map((label, index) => (
                  <div 
                    key={index}
                    className="px-1.5 py-0.5 bg-gray-700 rounded text-xs text-gray-300"
                  >
                    {label}
                  </div>
                ))}
              </div>
            )}
            
            {dueDate && (
              <div className="text-xs text-gray-400 ml-auto">
                {dueDate}
              </div>
            )}
          </div>
          
          {activeViewers.length > 0 && (
            <div className="mt-2 flex items-center gap-1">
              {activeViewers.map((viewer) => (
                <div 
                  key={viewer.userId} 
                  className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white" 
                  title={`${viewer.userName} is viewing`}
                >
                  {viewer.userName.charAt(0)}
                </div>
              ))}
              {activeViewers.length > 1 && (
                <span className="text-xs text-gray-400 ml-1">
                  {activeViewers.length} viewers
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IssueCard; 