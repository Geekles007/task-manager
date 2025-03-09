'use client';

import { useState, useEffect } from 'react';
import AppLayout from './components/AppLayout';
import Header from './components/Header';
import IssuesList from './components/IssuesList';
import ActivityFeed from './components/ActivityFeed';
import ActiveUsers from './components/ActiveUsers';
import ConnectionControl from './components/ConnectionControl';
import { useSocket } from './context/SocketContext';
import { Issue } from './types';

// Sample data for demonstration
const initialIssues: Issue[] = [
  {
    id: 'LIN-1',
    title: 'Implement authentication flow',
    status: 'in-progress',
    priority: 'high',
    assignee: {
      name: 'John Doe',
    },
    labels: ['Frontend', 'Auth'],
  },
  {
    id: 'LIN-2',
    title: 'Design system component library',
    status: 'todo',
    priority: 'medium',
    assignee: {
      name: 'Jane Smith',
    },
    dueDate: 'May 15',
    labels: ['Design', 'UI'],
  },
  {
    id: 'LIN-3',
    title: 'API integration for user profiles',
    status: 'backlog',
    priority: 'low',
    labels: ['Backend', 'API'],
  },
  {
    id: 'LIN-4',
    title: 'Fix responsive layout issues',
    status: 'done',
    priority: 'high',
    assignee: {
      name: 'Alex Johnson',
    },
  },
  {
    id: 'LIN-5',
    title: 'Performance optimization for dashboard',
    status: 'todo',
    priority: 'urgent',
    assignee: {
      name: 'Sarah Williams',
    },
    dueDate: 'May 10',
    labels: ['Performance', 'Frontend'],
  },
  {
    id: 'LIN-6',
    title: 'Implement dark mode toggle',
    status: 'todo',
    priority: 'medium',
    assignee: {
      name: 'Mike Brown',
    },
    labels: ['UI', 'Feature'],
  },
  {
    id: 'LIN-7',
    title: 'Fix search functionality',
    status: 'in-progress',
    priority: 'high',
    assignee: {
      name: 'Lisa Chen',
    },
    dueDate: 'May 20',
    labels: ['Bug', 'Frontend'],
  },
];

export default function Home() {
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const { isConnected } = useSocket();
  const [isMobile, setIsMobile] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);

  // Check if we're on mobile on initial render and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-hide sidebar on mobile
      if (mobile) {
        setShowRightSidebar(false);
      } else {
        setShowRightSidebar(true);
      }
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

  const handleIssuesReorder = (reorderedIssues: Issue[]) => {
    setIssues(reorderedIssues);
    // In a real app, you would save this to the server
    console.log('Issues reordered:', reorderedIssues);
  };

  const toggleRightSidebar = () => {
    setShowRightSidebar(!showRightSidebar);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <Header 
          title="Issues" 
          onToggleRightSidebar={toggleRightSidebar}
          showRightSidebarToggle={isMobile}
        />
        <div className="flex flex-1 overflow-hidden relative">
          <div className={`flex-1 overflow-auto ${showRightSidebar && isMobile ? 'hidden md:block' : ''}`}>
            <div className="max-w-4xl mx-auto px-4">
              <IssuesList 
                issues={issues} 
                onIssuesReorder={handleIssuesReorder}
                className="py-4"
              />
            </div>
          </div>
          
          {/* Right sidebar - conditionally shown on mobile */}
          <div 
            className={`${showRightSidebar ? 'block' : 'hidden md:block'} 
                       w-full md:w-80 p-4 border-l border-gray-800 overflow-auto
                       ${isMobile ? 'absolute inset-0 z-10 bg-gray-900' : ''}`}
          >
            {isMobile && (
              <button 
                onClick={toggleRightSidebar}
                className="md:hidden absolute top-2 right-2 p-1 rounded-md bg-gray-800 text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            )}
            <div className="space-y-4">
              <ConnectionControl />
              <ActivityFeed />
              <ActiveUsers />
            </div>
          </div>
        </div>
      </div>
      
      {/* Connection status indicator */}
      <div className="fixed bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-full shadow-lg z-20">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-xs text-gray-300">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </AppLayout>
  );
}
