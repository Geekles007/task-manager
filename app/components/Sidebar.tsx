'use client';

import { FC, useState } from 'react';
import Link from 'next/link';
import { 
  Home, 
  Inbox, 
  Calendar, 
  Users, 
  Settings, 
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  className?: string;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

const NavItem: FC<NavItemProps> = ({ icon, label, href, active }) => {
  return (
    <Link 
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        active 
          ? "bg-gray-800/50 text-white" 
          : "text-gray-400 hover:text-white hover:bg-gray-800/30"
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
};

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: FC<CollapsibleSectionProps> = ({ 
  title, 
  children,
  defaultOpen = true
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-t border-gray-800">
      <div 
        className="p-3 flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-xs font-medium text-gray-400">{title}</span>
        <div className="flex items-center">
          <Plus className="w-3 h-3 text-gray-400" />
          {isOpen ? (
            <ChevronDown className="w-3 h-3 ml-1 text-gray-400" />
          ) : (
            <ChevronRight className="w-3 h-3 ml-1 text-gray-400" />
          )}
        </div>
      </div>
      <div className={cn("space-y-1 px-3 pb-3", !isOpen && "hidden")}>
        {children}
      </div>
    </div>
  );
};

export const Sidebar: FC<SidebarProps> = ({ className }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  return (
    <div className={cn("flex flex-col h-screen w-56 bg-gray-900 text-white border-r border-gray-800", className)}>
      {/* Workspace Selector */}
      <div className="p-3 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-indigo-500 flex items-center justify-center text-xs font-bold">L</div>
          <span className="font-medium">Linear Clone</span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </div>
      
      {/* Search */}
      <div className="p-3">
        <div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-800/50 text-gray-400 text-sm cursor-pointer"
          onClick={() => setIsSearchOpen(true)}
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 truncate">Search...</span>
          <div className="text-xs bg-gray-700 px-1.5 py-0.5 rounded">⌘K</div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <NavItem icon={<Home className="w-4 h-4" />} label="Home" href="/" active />
        <NavItem icon={<Inbox className="w-4 h-4" />} label="Inbox" href="/inbox" />
        <NavItem icon={<Calendar className="w-4 h-4" />} label="My Issues" href="/issues" />
        <NavItem icon={<Users className="w-4 h-4" />} label="Team" href="/team" />
        
        {/* Projects Section */}
        <CollapsibleSection title="PROJECTS">
          <NavItem icon={<div className="w-2 h-2 rounded-full bg-blue-500" />} label="Frontend" href="/projects/frontend" />
          <NavItem icon={<div className="w-2 h-2 rounded-full bg-green-500" />} label="Backend" href="/projects/backend" />
          <NavItem icon={<div className="w-2 h-2 rounded-full bg-purple-500" />} label="Design System" href="/projects/design" />
        </CollapsibleSection>
      </nav>
      
      {/* Settings */}
      <div className="p-3 border-t border-gray-800">
        <NavItem icon={<Settings className="w-4 h-4" />} label="Settings" href="/settings" />
      </div>
      
      {/* User Profile */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs">U</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">User Name</div>
            <div className="text-xs text-gray-400 truncate">user@example.com</div>
          </div>
        </div>
      </div>
      
      {/* Search Modal (for mobile) */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Search</h3>
              <button 
                className="text-gray-400 hover:text-white"
                onClick={() => setIsSearchOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-md">
              <Search className="w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="flex-1 bg-transparent border-none text-white focus:outline-none"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar; 