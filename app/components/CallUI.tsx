'use client';

import { FC, useEffect, useState, useRef } from 'react';
import { useCall } from '../context/CallContext';
import { cn } from '../lib/utils';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import Button from './Button';

interface CallUIProps {
  className?: string;
}

export const CallUI: FC<CallUIProps> = ({ className }) => {
  const { currentCall, incomingCall, acceptCall, rejectCall, endCall, isMuted, toggleMute } = useCall();
  const [callDuration, setCallDuration] = useState(0);
  
  // Use refs for audio context and oscillator
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const intervalIdRef = useRef<number | null>(null);
  
  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (err) {
        console.error('Error creating audio context:', err);
      }
    }
    
    return () => {
      // Clean up audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);
  
  // Play/stop ringtone
  const playRingtone = () => {
    if (!audioContextRef.current || isPlayingRef.current) return;
    
    try {
      // Create oscillator and gain node
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      // Configure oscillator
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioContextRef.current.currentTime); // A4 note
      
      // Configure gain node
      gainNode.gain.setValueAtTime(0.2, audioContextRef.current.currentTime);
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      // Start oscillator
      oscillator.start();
      
      // Store references
      oscillatorRef.current = oscillator;
      gainNodeRef.current = gainNode;
      isPlayingRef.current = true;
      
      // Create a pattern of rings
      let isOn = true;
      intervalIdRef.current = window.setInterval(() => {
        if (!gainNodeRef.current) return;
        
        if (isOn) {
          gainNodeRef.current.gain.setValueAtTime(0, audioContextRef.current!.currentTime);
        } else {
          gainNodeRef.current.gain.setValueAtTime(0.2, audioContextRef.current!.currentTime);
        }
        
        isOn = !isOn;
      }, 1000);
    } catch (err) {
      console.error('Error playing ringtone:', err);
    }
  };
  
  const stopRingtone = () => {
    if (!isPlayingRef.current) return;
    
    try {
      // Stop interval
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      
      // Stop oscillator
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
      
      // Disconnect gain node
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }
      
      isPlayingRef.current = false;
    } catch (err) {
      console.error('Error stopping ringtone:', err);
    }
  };
  
  // Play ringtone when there's an incoming call
  useEffect(() => {
    if (incomingCall) {
      playRingtone();
    } else {
      stopRingtone();
    }
    
    return () => {
      stopRingtone();
    };
  }, [incomingCall]);
  
  // Update call duration
  useEffect(() => {
    let interval: number | null = null;
    
    if (currentCall && currentCall.status === 'connected') {
      // Reset duration when call starts
      setCallDuration(0);
      
      // Start timer
      interval = window.setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentCall]);
  
  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle call actions
  const handleAcceptCall = () => {
    stopRingtone();
    acceptCall();
  };
  
  const handleRejectCall = () => {
    stopRingtone();
    rejectCall();
  };
  
  const handleEndCall = () => {
    endCall();
  };
  
  // Render nothing if there's no call
  if (!currentCall && !incomingCall) {
    return null;
  }
  
  return (
    <div className={cn(
      "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50",
      "w-80 bg-gray-800 rounded-lg shadow-lg border border-gray-700",
      className
    )}>
      {/* Incoming call UI */}
      {incomingCall && !currentCall && (
        <div className="p-4">
          <div className="text-center mb-4">
            <div className="text-lg font-semibold text-white">Incoming Call</div>
            <div className="text-sm text-gray-400">{incomingCall.callerName}</div>
          </div>
          
          <div className="flex justify-center gap-4">
            <Button
              onClick={handleRejectCall}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject
            </Button>
            <Button
              onClick={handleAcceptCall}
              className="bg-green-600 hover:bg-green-700"
            >
              Accept
            </Button>
          </div>
        </div>
      )}
      
      {/* Active call UI */}
      {currentCall && (
        <div className="p-4">
          <div className="text-center mb-4">
            <div className="text-lg font-semibold text-white">
              {currentCall.status === 'ringing' ? 'Calling...' : 
               currentCall.status === 'connected' ? 'On Call' : 
               currentCall.status === 'rejected' ? 'Call Rejected' : 
               'Call Ended'}
            </div>
            <div className="text-sm text-gray-400">
              {currentCall.callerId === currentCall.targetId ? 
                currentCall.callerName : 
                currentCall.targetName || 'Unknown'}
            </div>
            {currentCall.status === 'connected' && (
              <div className="text-xs text-gray-500 mt-1">
                {formatDuration(callDuration)}
              </div>
            )}
          </div>
          
          <div className="flex justify-center gap-4">
            {currentCall.status === 'connected' && (
              <button
                onClick={toggleMute}
                className={cn(
                  "p-2 rounded-full",
                  isMuted ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"
                )}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            )}
            
            {(currentCall.status === 'ringing' || currentCall.status === 'connected') && (
              <button
                onClick={handleEndCall}
                className="p-2 rounded-full bg-red-600 hover:bg-red-700"
              >
                <PhoneOff size={20} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CallUI; 