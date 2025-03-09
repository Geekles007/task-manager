'use client';

import { ReactNode } from 'react';
import { SocketProvider } from './context/SocketContext';
import { CallProvider } from './context/CallContext';
import CallUI from './components/CallUI';

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <SocketProvider>
      <CallProvider>
        {children}
        <CallUI />
      </CallProvider>
    </SocketProvider>
  );
} 