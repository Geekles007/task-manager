'use client';

import { FC, ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { cn } from '../lib/utils';
import { Menu, X } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

export const AppLayout: FC<AppLayoutProps> = ({ children, className }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile on initial render and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
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

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isMobile && isSidebarOpen) {
        const sidebar = document.getElementById('sidebar');
        const toggleButton = document.getElementById('sidebar-toggle');
        
        if (sidebar && 
            !sidebar.contains(e.target as Node) && 
            toggleButton && 
            !toggleButton.contains(e.target as Node)) {
          setIsSidebarOpen(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile, isSidebarOpen]);

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden relative">
      {/* Mobile sidebar toggle button */}
      <button 
        id="sidebar-toggle"
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-gray-800 text-white"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      
      {/* Sidebar - hidden on mobile by default, shown when isSidebarOpen is true */}
      <div 
        id="sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-40 transition-transform duration-300 transform md:relative md:translate-x-0",
          isMobile && !isSidebarOpen ? "-translate-x-full" : "translate-x-0"
        )}
      >
        <Sidebar />
      </div>
      
      {/* Overlay for mobile when sidebar is open */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Main content */}
      <main className={cn(
        "flex-1 overflow-auto",
        isMobile && "pt-16", // Add padding top on mobile for the toggle button
        className
      )}>
        {children}
      </main>
    </div>
  );
};

export default AppLayout; 