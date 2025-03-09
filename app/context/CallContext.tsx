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
  
  // Handle muting
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);
  
  // Create a WebRTC peer connection
  const createPeerConnection = useCallback(async (isInitiator: boolean, callId: string, remoteUserId: string) => {
    debug(`Creating peer connection as ${isInitiator ? 'initiator' : 'receiver'} for call ${callId} with ${remoteUserId}`);
    
    try {
      // Get user media
      debug('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      debug('Microphone access granted');
      streamRef.current = stream;
      
      // Create peer connection
      debug('Creating SimplePeer instance');
      const peer = new SimplePeer({
        initiator: isInitiator,
        trickle: false,
        stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });
      
      // Store peer in ref for cleanup
      peerRef.current = peer;
      
      // Set up peer event handlers
      peer.on('signal', (data: SimplePeer.SignalData) => {
        debug(`Sending signal to ${remoteUserId}`, data);
        if (socket && socket.connected) {
          socket.emit('signal', {
            callId,
            signal: data,
            targetId: remoteUserId,
          });
        } else {
          debug('Socket not connected, cannot send signal');
        }
      });
      
      peer.on('connect', () => {
        debug('Peer connection established');
        // Update call status if not already connected
        setCurrentCall(prev => {
          if (prev && prev.status !== 'connected') {
            debug('Updating call status to connected');
            return { ...prev, status: 'connected' };
          }
          return prev;
        });
      });
      
      peer.on('stream', (remoteStream: MediaStream) => {
        debug('Received remote stream');
        if (audioRef.current) {
          audioRef.current.srcObject = remoteStream;
        }
      });
      
      peer.on('data', (data: any) => {
        debug('Received data:', data.toString());
      });
      
      peer.on('error', (err: Error) => {
        debug('Peer error:', err);
        endCall();
      });
      
      peer.on('close', () => {
        debug('Peer connection closed');
      });
      
      // Update call with peer
      setCurrentCall(prev => {
        if (prev) {
          return { ...prev, peer };
        }
        return prev;
      });
      
      return peer;
    } catch (err) {
      debug('Error creating peer connection:', err);
      throw err;
    }
  }, [socket]);
  
  // Socket event listeners
  useEffect(() => {
    if (!socket) return;
    
    // Handle incoming call
    socket.on('call:incoming', ({ callId, callerId, callerName }) => {
      debug('Incoming call:', { callId, callerId, callerName });
      
      // Only accept incoming calls if we're not already in a call
      if (!currentCall) {
        setIncomingCall({ callId, callerId, callerName });
      } else {
        // Auto-reject if we're already in a call
        debug('Auto-rejecting call because we are already in a call');
        socket.emit('call:reject', { callId, targetId: callerId });
      }
    });
    
    // Handle call accepted
    socket.on('call:accepted', async ({ callId, targetId }) => {
      debug('Call accepted:', { callId, targetId });
      
      if (currentCall && currentCall.id === callId) {
        // Update call status immediately
        setCurrentCall(prev => {
          if (prev) {
            return { ...prev, status: 'connected' };
          }
          return prev;
        });
        
        try {
          // Create peer connection as initiator
          await createPeerConnection(true, callId, targetId);
        } catch (err) {
          debug('Error in call:accepted handler:', err);
          endCall();
        }
      } else {
        debug('Received call:accepted but no matching call found');
      }
    });
    
    // Handle call rejected
    socket.on('call:rejected', ({ callId }) => {
      debug('Call rejected:', callId);
      
      if (currentCall && currentCall.id === callId) {
        setCurrentCall(prev => {
          if (prev) {
            return { ...prev, status: 'rejected' };
          }
          return prev;
        });
        
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
        // Clean up peer connection
        if (peerRef.current) {
          peerRef.current.destroy();
          peerRef.current = null;
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
        
        // Clean up media stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      }
      
      // Clear any incoming call
      setIncomingCall(null);
    });
    
    // Handle WebRTC signaling
    socket.on('signal', ({ callId, signal, fromId }) => {
      debug('Received signal from peer:', fromId, signal);
      
      if (currentCall && currentCall.id === callId && currentCall.peer) {
        debug('Applying signal to peer');
        currentCall.peer.signal(signal);
      } else if (currentCall && currentCall.id === callId) {
        debug('Received signal but peer not yet created, creating now');
        // This can happen if the signal arrives before the peer is created
        // Create the peer now
        createPeerConnection(false, callId, fromId)
          .then(peer => {
            debug('Peer created, applying signal');
            peer.signal(signal);
          })
          .catch(err => {
            debug('Error creating peer from signal:', err);
          });
      } else {
        debug('Received signal but no matching call found');
      }
    });
    
    // Handle call errors
    socket.on('call:error', ({ message }) => {
      debug('Call error:', message);
      
      // Clean up current call
      if (currentCall) {
        if (peerRef.current) {
          peerRef.current.destroy();
          peerRef.current = null;
        }
        
        setCurrentCall(null);
      }
      
      // Clear any incoming call
      setIncomingCall(null);
    });
    
    return () => {
      socket.off('call:incoming');
      socket.off('call:accepted');
      socket.off('call:rejected');
      socket.off('call:ended');
      socket.off('signal');
      socket.off('call:error');
    };
  }, [socket, currentCall, createPeerConnection]);
  
  // Start a call
  const startCall = useCallback(async (targetId: string, targetName: string) => {
    if (!socket || !isConnected) {
      debug('Cannot start call: Socket not connected');
      return;
    }
    
    if (currentCall) {
      debug('Already in a call');
      return;
    }
    
    debug(`Starting call to ${targetName} (${targetId})`);
    
    // Create a new call
    const callId = `call-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newCall: Call = {
      id: callId,
      callerId: SESSION_USER_ID,
      callerName: SESSION_USER_NAME,
      targetId,
      targetName,
      status: 'ringing',
      startTime: Date.now(),
    };
    
    setCurrentCall(newCall);
    
    // Emit call:start event
    socket.emit('call:start', {
      callerId: SESSION_USER_ID,
      callerName: SESSION_USER_NAME,
      targetId,
    });
  }, [socket, isConnected, currentCall]);
  
  // Accept an incoming call
  const acceptCall = useCallback(async () => {
    if (!socket || !incomingCall) return;
    
    debug(`Accepting call from ${incomingCall.callerName} (${incomingCall.callerId})`);
    
    try {
      // Create a new call object
      const newCall: Call = {
        id: incomingCall.callId,
        callerId: incomingCall.callerId,
        callerName: incomingCall.callerName,
        targetId: SESSION_USER_ID,
        status: 'connected',
        startTime: Date.now(),
      };
      
      setCurrentCall(newCall);
      
      // Emit call:accept event to notify the caller
      socket.emit('call:accept', {
        callId: incomingCall.callId,
        targetId: incomingCall.callerId,
      });
      
      // Clear incoming call
      setIncomingCall(null);
      
      // Create peer connection as non-initiator
      // We'll wait for the signal from the caller before creating the peer
      debug('Waiting for signal from caller to create peer connection');
      
    } catch (err) {
      debug('Error accepting call:', err);
      
      // Reject the call if there's an error
      socket.emit('call:reject', {
        callId: incomingCall.callId,
        targetId: incomingCall.callerId,
      });
      
      setIncomingCall(null);
    }
  }, [socket, incomingCall]);
  
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