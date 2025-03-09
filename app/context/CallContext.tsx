'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { useSocket } from './SocketContext';
import SimplePeer from 'simple-peer';

// Generate a consistent user ID for this browser session
const SESSION_USER_ID = typeof window !== 'undefined' 
  ? window.localStorage.getItem('userId') || `user-${Math.floor(Math.random() * 10000)}`
  : `user-${Math.floor(Math.random() * 10000)}`;

// Generate a consistent user name for this browser session
const SESSION_USER_NAME = typeof window !== 'undefined'
  ? window.localStorage.getItem('userName') || `User ${Math.floor(Math.random() * 10000)}`
  : `User ${Math.floor(Math.random() * 10000)}`;

// Store the user ID and name in localStorage for persistence
if (typeof window !== 'undefined') {
  window.localStorage.setItem('userId', SESSION_USER_ID);
  window.localStorage.setItem('userName', SESSION_USER_NAME);
}

// Debug logging function
const debug = (message: string, ...args: any[]) => {
  console.log(`[WebRTC] ${message}`, ...args);
};

interface Call {
  id: string;
  peer?: SimplePeer.Instance;
  callerId: string;
  callerName: string;
  targetId: string;
  targetName?: string;
  status: 'ringing' | 'connected' | 'ended' | 'rejected';
  startTime: number;
  endTime?: number;
}

interface CallContextType {
  currentCall: Call | null;
  incomingCall: { callId: string; callerId: string; callerName: string } | null;
  startCall: (targetId: string, targetName: string) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  isMuted: boolean;
  toggleMute: () => void;
  currentUserId: string;
  currentUserName: string;
}

const CallContext = createContext<CallContextType>({
  currentCall: null,
  incomingCall: null,
  startCall: () => {},
  acceptCall: () => {},
  rejectCall: () => {},
  endCall: () => {},
  isMuted: false,
  toggleMute: () => {},
  currentUserId: SESSION_USER_ID,
  currentUserName: SESSION_USER_NAME,
});

interface CallProviderProps {
  children: ReactNode;
}

export const CallProvider = ({ children }: CallProviderProps) => {
  const { socket, isConnected } = useSocket();
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ callId: string; callerId: string; callerName: string } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<SimplePeer.Instance | null>(null);
  
  // Create audio element for remote audio
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio();
      audio.autoplay = true;
      audioRef.current = audio;
      
      return () => {
        if (audioRef.current) {
          audioRef.current.srcObject = null;
          audioRef.current = null;
        }
        
        // Clean up any active streams
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
    }
  }, []);
  
  // Handle socket events for call signaling
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    // Handle incoming call
    socket.on('call:incoming', ({ callId, callerId, callerName }) => {
      debug('Incoming call:', { callId, callerId, callerName });
      setIncomingCall({ callId, callerId, callerName });
    });
    
    // Handle call accepted
    socket.on('call:accepted', ({ callId, targetId }) => {
      debug('Call accepted:', { callId, targetId });
      
      if (currentCall && currentCall.id === callId) {
        // Update call status
        setCurrentCall(prev => prev ? { ...prev, status: 'connected' } : null);
        
        // Initialize WebRTC connection as the caller
        initializeWebRTC(callId, targetId, true);
      }
    });
    
    // Handle call rejected
    socket.on('call:rejected', ({ callId }) => {
      debug('Call rejected:', callId);
      
      if (currentCall && currentCall.id === callId) {
        setCurrentCall(prev => prev ? { ...prev, status: 'rejected' } : null);
        
        // Clean up after a short delay
        setTimeout(() => {
          setCurrentCall(null);
        }, 3000);
      }
    });
    
    // Handle call ended
    socket.on('call:ended', ({ callId, endedBy, reason }) => {
      debug('Call ended:', { callId, endedBy, reason });
      
      if (currentCall && currentCall.id === callId) {
        setCurrentCall(prev => prev ? { ...prev, status: 'ended' } : null);
        
        // Clean up WebRTC
        cleanupWebRTC();
        
        // Clean up after a short delay
        setTimeout(() => {
          setCurrentCall(null);
        }, 3000);
      }
      
      // Also clear any incoming call if it matches
      if (incomingCall && incomingCall.callId === callId) {
        setIncomingCall(null);
      }
    });
    
    // Handle WebRTC signaling
    socket.on('signal', ({ callId, signal, fromId }) => {
      debug('Signal received:', { callId, fromId });
      
      if (currentCall && currentCall.id === callId) {
        try {
          if (peerRef.current) {
            debug('Applying signal to peer');
            peerRef.current.signal(signal);
          } else {
            debug('Peer not initialized yet, cannot apply signal');
          }
        } catch (err) {
          console.error('Error applying signal:', err);
        }
      }
    });
    
    // Handle call errors
    socket.on('call:error', ({ message }) => {
      console.error('Call error:', message);
      // You could show a toast or notification here
    });
    
    return () => {
      socket.off('call:incoming');
      socket.off('call:accepted');
      socket.off('call:rejected');
      socket.off('call:ended');
      socket.off('signal');
      socket.off('call:error');
    };
  }, [socket, isConnected, currentCall, incomingCall]);
  
  // Initialize WebRTC connection
  const initializeWebRTC = async (callId: string, peerId: string, initiator: boolean) => {
    debug('Initializing WebRTC:', { callId, peerId, initiator });
    
    try {
      // Request user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Apply mute state if needed
      if (isMuted) {
        stream.getAudioTracks().forEach(track => {
          track.enabled = false;
        });
      }
      
      // Create peer connection
      const peer = new SimplePeer({
        initiator,
        stream,
        trickle: true,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });
      
      peerRef.current = peer;
      
      // Handle peer events
      peer.on('signal', (data) => {
        debug('Generated signal data, sending to peer:', peerId);
        socket?.emit('signal', {
          callId,
          signal: data,
          targetId: peerId
        });
      });
      
      peer.on('stream', (remoteStream) => {
        debug('Received remote stream');
        if (audioRef.current) {
          audioRef.current.srcObject = remoteStream;
        }
      });
      
      peer.on('error', (err) => {
        console.error('Peer connection error:', err);
        cleanupWebRTC();
        setCurrentCall(prev => prev ? { ...prev, status: 'ended' } : null);
      });
      
      peer.on('close', () => {
        debug('Peer connection closed');
        cleanupWebRTC();
      });
      
      return peer;
    } catch (err) {
      console.error('Error initializing WebRTC:', err);
      return null;
    }
  };
  
  // Clean up WebRTC resources
  const cleanupWebRTC = () => {
    debug('Cleaning up WebRTC resources');
    
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
  };
  
  // Start a call
  const startCall = useCallback((targetId: string, targetName: string) => {
    if (!socket || !isConnected) {
      console.error('Cannot start call: Socket not connected');
      return;
    }
    
    debug('Starting call to:', { targetId, targetName });
    
    socket.emit('call:start', {
      callerId: SESSION_USER_ID,
      callerName: SESSION_USER_NAME,
      targetId
    });
    
    // Create a temporary call object until we get confirmation
    setCurrentCall({
      id: 'pending', // Will be replaced with actual ID from server
      callerId: SESSION_USER_ID,
      callerName: SESSION_USER_NAME,
      targetId,
      targetName,
      status: 'ringing',
      startTime: Date.now()
    });
  }, [socket, isConnected]);
  
  // Accept an incoming call
  const acceptCall = useCallback(async () => {
    if (!socket || !isConnected || !incomingCall) {
      console.error('Cannot accept call: Socket not connected or no incoming call');
      return;
    }
    
    debug('Accepting call:', incomingCall);
    
    const { callId, callerId, callerName } = incomingCall;
    
    // Notify server that call is accepted
    socket.emit('call:accept', {
      callId,
      targetId: SESSION_USER_ID
    });
    
    // Create call object
    setCurrentCall({
      id: callId,
      callerId,
      callerName,
      targetId: SESSION_USER_ID,
      status: 'connected',
      startTime: Date.now()
    });
    
    // Clear incoming call
    setIncomingCall(null);
    
    // Initialize WebRTC as the receiver (not initiator)
    initializeWebRTC(callId, callerId, false);
  }, [socket, isConnected, incomingCall]);
  
  // Reject an incoming call
  const rejectCall = useCallback(() => {
    if (!socket || !incomingCall) return;
    
    debug(`Rejecting call from ${incomingCall.callerName} (${incomingCall.callerId})`);
    
    // Emit call:reject event
    socket.emit('call:reject', {
      callId: incomingCall.callId,
      targetId: incomingCall.callerId,
    });
    
    // Clear incoming call
    setIncomingCall(null);
  }, [socket, incomingCall]);
  
  // End the current call
  const endCall = useCallback(() => {
    if (!socket || !currentCall) return;
    
    debug(`Ending call ${currentCall.id}`);
    
    // Emit call:end event
    socket.emit('call:end', {
      callId: currentCall.id,
      userId: SESSION_USER_ID,
    });
    
    // Clean up peer connection
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    
    // Clean up media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Update call status
    setCurrentCall(prev => {
      if (prev) {
        return { ...prev, status: 'ended', endTime: Date.now() };
      }
      return prev;
    });
    
    // Clean up after a short delay
    setTimeout(() => {
      setCurrentCall(null);
    }, 3000);
  }, [socket, currentCall]);
  
  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);
  
  return (
    <CallContext.Provider value={{
      currentCall,
      incomingCall,
      startCall,
      acceptCall,
      rejectCall,
      endCall,
      isMuted,
      toggleMute,
      currentUserId: SESSION_USER_ID,
      currentUserName: SESSION_USER_NAME,
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext); 