'use client';

import { FC } from 'react';
import { useCall } from '../context/CallContext';
import { Phone } from 'lucide-react';
import { cn } from '../lib/utils';

interface UserCallButtonProps {
  userId: string;
  userName: string;
  className?: string;
}

export const UserCallButton: FC<UserCallButtonProps> = ({ userId, userName, className }) => {
  const { startCall, currentCall } = useCall();
  
  const handleStartCall = () => {
    if (!currentCall) {
      startCall(userId, userName);
    }
  };
  
  return (
    <button
      onClick={handleStartCall}
      disabled={!!currentCall}
      className={cn(
        "p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors",
        currentCall && "opacity-50 cursor-not-allowed",
        className
      )}
      title={`Call ${userName}`}
    >
      <Phone className="w-4 h-4" />
    </button>
  );
};

export default UserCallButton; 