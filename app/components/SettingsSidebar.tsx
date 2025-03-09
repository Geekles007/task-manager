'use client';

import { FC } from 'react';
import Link from 'next/link';
import { cn } from '../lib/utils';

interface SettingsSidebarProps {
  className?: string;
  activeSection?: string;
}

interface SettingsNavItemProps {
  label: string;
  href: string;
  active?: boolean;
}

const SettingsNavItem: FC<SettingsNavItemProps> = ({ label, href, active }) => {
  return (
    <Link 
      href={href}
      className={cn(
        "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
        active 
          ? "bg-gray-800/50 text-white" 
          : "text-gray-400 hover:text-white hover:bg-gray-800/30"
      )}
    >
      {label}
    </Link>
  );
};

export const SettingsSidebar: FC<SettingsSidebarProps> = ({ 
  className,
  activeSection = 'general'
}) => {
  return (
    <div className={cn("w-56 border-r border-gray-800 p-4", className)}>
      <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>
      
      <div className="space-y-1">
        <h3 className="text-xs font-medium text-gray-400 uppercase px-3 py-2">Personal</h3>
        <SettingsNavItem 
          label="General" 
          href="/settings" 
          active={activeSection === 'general'} 
        />
        <SettingsNavItem 
          label="My Account" 
          href="/settings/account" 
          active={activeSection === 'account'} 
        />
        <SettingsNavItem 
          label="Notifications" 
          href="/settings/notifications" 
          active={activeSection === 'notifications'} 
        />
        <SettingsNavItem 
          label="Appearance" 
          href="/settings/appearance" 
          active={activeSection === 'appearance'} 
        />
      </div>
      
      <div className="mt-6 space-y-1">
        <h3 className="text-xs font-medium text-gray-400 uppercase px-3 py-2">Workspace</h3>
        <SettingsNavItem 
          label="General" 
          href="/settings/workspace" 
          active={activeSection === 'workspace'} 
        />
        <SettingsNavItem 
          label="Members" 
          href="/settings/members" 
          active={activeSection === 'members'} 
        />
        <SettingsNavItem 
          label="Teams" 
          href="/settings/teams" 
          active={activeSection === 'teams'} 
        />
        <SettingsNavItem 
          label="Integrations" 
          href="/settings/integrations" 
          active={activeSection === 'integrations'} 
        />
      </div>
      
      <div className="mt-6 space-y-1">
        <h3 className="text-xs font-medium text-gray-400 uppercase px-3 py-2">Billing</h3>
        <SettingsNavItem 
          label="Plans" 
          href="/settings/plans" 
          active={activeSection === 'plans'} 
        />
        <SettingsNavItem 
          label="Invoices" 
          href="/settings/invoices" 
          active={activeSection === 'invoices'} 
        />
      </div>
    </div>
  );
};

export default SettingsSidebar; 