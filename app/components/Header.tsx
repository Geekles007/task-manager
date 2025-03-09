'use client';

import { FC, useState } from 'react';
import { 
  Plus, 
  Filter, 
  SlidersHorizontal, 
  MoreHorizontal,
  ChevronDown,
  Search,
  PanelRight
} from 'lucide-react';
import { cn } from '../lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  onToggleRightSidebar?: () => void;
  showRightSidebarToggle?: boolean;
}

export const Header: FC<HeaderProps> = ({ 
  title, 
  subtitle, 
  className,
  onToggleRightSidebar,
  showRightSidebarToggle = false
}) => {
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  
  return (
    <header className={cn("flex flex-col border-b border-gray-800 bg-gray-900", className)}>
      {/* Top navigation */}
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-lg font-semibold text-white truncate">{title}</h1>
          {subtitle && (
            <>
              <span className="text-gray-400 hidden sm:inline">/</span>
              <span className="text-gray-400 hidden sm:inline truncate">{subtitle}</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Issue</span>
          </button>
          
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors sm:inline hidden">
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            {showRightSidebarToggle && onToggleRightSidebar && (
              <button 
                className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors md:hidden"
                onClick={onToggleRightSidebar}
              >
                <PanelRight className="w-4 h-4" />
              </button>
            )}
            <button 
              className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile filter menu */}
      {isFilterMenuOpen && (
        <div className="absolute right-4 top-14 z-10 bg-gray-800 rounded-md shadow-lg p-2 border border-gray-700 sm:hidden">
          <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-md">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Customize</span>
          </button>
          <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-md">
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </div>
      )}
      
      {/* Tabs/filters */}
      <div className="flex items-center px-4 h-10 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-4 text-sm">
          <button className="text-white font-medium border-b-2 border-indigo-500 pb-2 whitespace-nowrap">All Issues</button>
          <button className="text-gray-400 hover:text-white pb-2 border-b-2 border-transparent whitespace-nowrap">Active</button>
          <button className="text-gray-400 hover:text-white pb-2 border-b-2 border-transparent whitespace-nowrap">Backlog</button>
          <button className="text-gray-400 hover:text-white pb-2 border-b-2 border-transparent whitespace-nowrap hidden sm:block">Completed</button>
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-1 px-2 py-1 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors hidden sm:flex">
            <span>View</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header; 