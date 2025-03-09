'use client';

import { FC, ReactNode } from 'react';
import AppLayout from './AppLayout';
import SettingsSidebar from './SettingsSidebar';
import { cn } from '../lib/utils';

interface SettingsLayoutProps {
  children: ReactNode;
  activeSection?: string;
  className?: string;
}

export const SettingsLayout: FC<SettingsLayoutProps> = ({ 
  children, 
  activeSection = 'general',
  className 
}) => {
  return (
    <AppLayout>
      <div className="flex h-full">
        <SettingsSidebar activeSection={activeSection} />
        <div className={cn("flex-1 p-6 overflow-auto", className)}>
          {children}
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsLayout; 