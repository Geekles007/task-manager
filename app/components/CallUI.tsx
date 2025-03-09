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
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.2;
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      // Store references
      oscillatorRef.current = oscillator;
      gainNodeRef.current = gainNode;
      
      // Start oscillator
      oscillator.start();
      isPlayingRef.current = true;
      
      // Beep pattern (500ms on, 500ms off)
      const id = window.setInterval(() => {
        if (gainNodeRef.current) {
          gainNodeRef.current.gain.value = gainNodeRef.current.gain.value > 0 ? 0 : 0.2;
        }
      }, 500);
      
      // Store interval ID for cleanup
      intervalIdRef.current = id;
    } catch (err) {
      console.error('Error playing ringtone:', err);
    }
  };
  
  const stopRingtone = () => {
    // Clear interval
    if (intervalIdRef.current) {
      window.clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    
    // Stop oscillator
    if (oscillatorRef.current && isPlayingRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
        
        if (gainNodeRef.current) {
          gainNodeRef.current.disconnect();
          gainNodeRef.current = null;
        }
        
        isPlayingRef.current = false;
      } catch (err) {
        console.error('Error stopping ringtone:', err);
      }
    }
  };
  
  // Play ringtone for incoming calls
  useEffect(() => {
    if (incomingCall) {
      playRingtone();
    }
    
    return () => {
      stopRingtone();
    };
  }, [incomingCall]);
  
  // Update call duration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (currentCall && currentCall.status === 'connected') {
      interval = setInterval(() => {
        const duration = Math.floor((Date.now() - currentCall.startTime) / 1000);
        setCallDuration(duration);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentCall]);
  
  // Format call duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // If there's no call or incoming call, don't render anything
  if (!currentCall && !incomingCall) {
    return null;
  }
  
  return (
    <div className={cn(
      "fixed bottom-20 right-4 bg-gray-800 rounded-lg shadow-lg p-4 w-80 z-50",
      className
    )}>
      {incomingCall ? (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white">Incoming Call</h3>
            <p className="text-sm text-gray-400">from {incomingCall.callerName}</p>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button
              variant="danger"
              onClick={() => {
                stopRingtone();
                rejectCall();
              }}
            >
              Reject
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                stopRingtone();
                acceptCall();
              }}
            >
              Accept
            </Button>
          </div>
        </div>
      ) : currentCall ? (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white">
              {currentCall.status === 'ringing' ? 'Calling...' : 
               currentCall.status === 'connected' ? 'On Call' : 
               currentCall.status === 'rejected' ? 'Call Rejected' : 
               'Call Ended'}
            </h3>
            <p className="text-sm text-gray-400">
              {currentCall.targetName || currentCall.callerName}
            </p>
            {currentCall.status === 'connected' && (
              <p className="text-xs text-gray-500 mt-1">{formatDuration(callDuration)}</p>
            )}
          </div>
          
          {currentCall.status === 'connected' && (
            <div className="flex justify-center space-x-4">
              <Button
                variant="secondary"
                onClick={toggleMute}
                className="w-12 h-12 rounded-full p-0 flex items-center justify-center"
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
              <Button
                variant="danger"
                onClick={endCall}
                className="w-12 h-12 rounded-full p-0 flex items-center justify-center"
              >
                <PhoneOff className="w-5 h-5" />
              </Button>
            </div>
          )}
          
          {(currentCall.status === 'ringing' || currentCall.status === 'rejected' || currentCall.status === 'ended') && (
            <div className="flex justify-center">
              <Button
                variant={currentCall.status === 'ringing' ? 'danger' : 'secondary'}
                onClick={endCall}
              >
                {currentCall.status === 'ringing' ? 'Cancel' : 'Dismiss'}
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default CallUI; 