const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Debug logging function
const debug = (message, ...args) => {
  console.log(`[Server] ${message}`, ...args);
};

// Store for active users and their activities
const activeUsers = new Map();
const issueViewers = new Map();
// Store for active calls
const activeCalls = new Map();
// Store for socket ID to user ID mapping
const socketToUser = new Map();

// Function to find an available port
const findAvailablePort = (startPort, callback) => {
  const net = require('net');
  const server = net.createServer();
  
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      findAvailablePort(startPort + 1, callback);
    } else {
      callback(err);
    }
  });
  
  server.once('listening', () => {
    const port = server.address().port;
    server.close(() => {
      callback(null, port);
    });
  });
  
  server.listen(startPort);
};

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.IO with CORS configuration
  const io = new Server(server, {
    cors: {
      origin: '*', // Allow all origins in development
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/api/socket',
    serveClient: false,
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false
  });

  // Log all Socket.IO events for debugging
  io.engine.on('connection_error', (err) => {
    debug('Connection error:', err);
  });

  io.on('connection', (socket) => {
    debug('Client connected:', socket.id);
    
    // User presence
    socket.on('user:active', (userData) => {
      debug('User active:', userData);
      
      // Store the socket ID to user ID mapping
      socketToUser.set(socket.id, userData.userId);
      
      activeUsers.set(userData.userId, {
        ...userData,
        socketId: socket.id,
        lastActive: Date.now(),
      });
      io.emit('users:active', Array.from(activeUsers.values()));
    });
    
    // Issue updates
    socket.on('issue:update', (updatedIssue) => {
      debug('Issue updated:', updatedIssue.id);
      socket.broadcast.emit('issue:updated', updatedIssue);
      
      // Emit activity
      const activity = {
        id: `activity-${Date.now()}`,
        type: 'update',
        issueId: updatedIssue.id,
        issueTitle: updatedIssue.title,
        userId: 'user-id', // This would come from auth
        userName: 'User', // This would come from auth
        timestamp: Date.now(),
      };
      io.emit('activity:new', activity);
    });
    
    // Issue reordering
    socket.on('issues:reorder', (reorderedIssues) => {
      debug('Issues reordered');
      socket.broadcast.emit('issues:reordered', reorderedIssues);
      
      // Emit activity
      const activity = {
        id: `activity-${Date.now()}`,
        type: 'update',
        issueId: 'multiple',
        issueTitle: 'issues order',
        userId: 'user-id', // This would come from auth
        userName: 'User', // This would come from auth
        timestamp: Date.now(),
        details: 'Reordered issues',
      };
      io.emit('activity:new', activity);
    });
    
    // Issue viewing
    socket.on('issue:view', ({ issueId, userId, userName }) => {
      debug('Issue view:', { issueId, userId, userName });
      if (!issueViewers.has(issueId)) {
        issueViewers.set(issueId, new Map());
      }
      
      const viewers = issueViewers.get(issueId);
      viewers.set(userId, { userId, userName, socketId: socket.id });
      
      io.emit('issue:viewing', {
        issueId,
        users: Array.from(viewers.values()),
      });
    });
    
    socket.on('issue:leave', ({ issueId, userId }) => {
      debug('Issue leave:', { issueId, userId });
      if (issueViewers.has(issueId)) {
        const viewers = issueViewers.get(issueId);
        viewers.delete(userId);
        
        if (viewers.size === 0) {
          issueViewers.delete(issueId);
        } else {
          io.emit('issue:viewing', {
            issueId,
            users: Array.from(viewers.values()),
          });
        }
      }
    });
    
    // WebRTC Signaling for Audio Calls
    socket.on('call:start', ({ callerId, callerName, targetId }) => {
      debug('Call start:', { callerId, callerName, targetId });
      
      // Find the target user's socket ID
      const targetUser = activeUsers.get(targetId);
      if (!targetUser) {
        debug('Target user not found:', targetId);
        socket.emit('call:error', { message: 'User not found or offline' });
        return;
      }
      
      // Create a new call
      const callId = `call-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      activeCalls.set(callId, {
        id: callId,
        callerId,
        callerName,
        targetId,
        targetName: targetUser.userName,
        startTime: Date.now(),
        status: 'ringing',
      });
      
      debug(`Notifying target user ${targetId} (socket: ${targetUser.socketId}) about incoming call`);
      
      // Notify the target user about the incoming call
      io.to(targetUser.socketId).emit('call:incoming', {
        callId,
        callerId,
        callerName,
      });
      
      // Emit activity
      const activity = {
        id: `activity-${Date.now()}`,
        type: 'update',
        issueId: 'call',
        issueTitle: 'audio call',
        userId: callerId,
        userName: callerName,
        timestamp: Date.now(),
        details: `Started a call with ${targetUser.userName}`,
      };
      io.emit('activity:new', activity);
    });
    
    socket.on('call:accept', ({ callId, targetId }) => {
      debug('Call accepted:', { callId, targetId });
      
      const call = activeCalls.get(callId);
      if (!call) {
        debug('Call not found:', callId);
        socket.emit('call:error', { message: 'Call not found' });
        return;
      }
      
      // Update call status
      call.status = 'connected';
      activeCalls.set(callId, call);
      
      // Get the caller's socket ID
      const caller = activeUsers.get(call.callerId);
      if (!caller) {
        debug('Caller not found:', call.callerId);
        socket.emit('call:error', { message: 'Caller not found or offline' });
        return;
      }
      
      debug(`Notifying caller ${call.callerId} (socket: ${caller.socketId}) that call was accepted`);
      
      // Notify the caller that the call was accepted
      io.to(caller.socketId).emit('call:accepted', { 
        callId, 
        targetId: call.targetId 
      });
      
      // Emit activity
      const activity = {
        id: `activity-${Date.now()}`,
        type: 'update',
        issueId: 'call',
        issueTitle: 'audio call',
        userId: targetId,
        userName: call.targetName,
        timestamp: Date.now(),
        details: `Accepted a call from ${call.callerName}`,
      };
      io.emit('activity:new', activity);
    });
    
    socket.on('call:reject', ({ callId, targetId }) => {
      debug('Call rejected:', { callId, targetId });
      
      const call = activeCalls.get(callId);
      if (!call) {
        debug('Call not found:', callId);
        socket.emit('call:error', { message: 'Call not found' });
        return;
      }
      
      // Update call status
      call.status = 'rejected';
      activeCalls.set(callId, call);
      
      // Notify the caller that the call was rejected
      const caller = activeUsers.get(call.callerId);
      if (caller) {
        debug(`Notifying caller ${call.callerId} that call was rejected`);
        io.to(caller.socketId).emit('call:rejected', { callId, targetId });
      }
      
      // Remove the call after a short delay
      setTimeout(() => {
        activeCalls.delete(callId);
      }, 5000);
    });
    
    socket.on('call:end', ({ callId, userId }) => {
      debug('Call ended:', { callId, userId });
      
      const call = activeCalls.get(callId);
      if (!call) {
        debug('Call not found:', callId);
        socket.emit('call:error', { message: 'Call not found' });
        return;
      }
      
      // Update call status
      call.status = 'ended';
      call.endTime = Date.now();
      activeCalls.set(callId, call);
      
      // Notify both users that the call has ended
      const caller = activeUsers.get(call.callerId);
      const target = activeUsers.get(call.targetId);
      
      if (caller) {
        debug(`Notifying caller ${call.callerId} that call has ended`);
        io.to(caller.socketId).emit('call:ended', { callId, endedBy: userId });
      }
      
      if (target) {
        debug(`Notifying target ${call.targetId} that call has ended`);
        io.to(target.socketId).emit('call:ended', { callId, endedBy: userId });
      }
      
      // Remove the call after a short delay
      setTimeout(() => {
        activeCalls.delete(callId);
      }, 5000);
      
      // Emit activity
      const activity = {
        id: `activity-${Date.now()}`,
        type: 'update',
        issueId: 'call',
        issueTitle: 'audio call',
        userId,
        userName: userId === call.callerId ? call.callerName : call.targetName,
        timestamp: Date.now(),
        details: 'Ended the call',
      };
      io.emit('activity:new', activity);
    });
    
    // WebRTC signaling
    socket.on('signal', ({ callId, signal, targetId }) => {
      debug('Signal received for call:', callId, 'to target:', targetId);
      
      const targetUser = activeUsers.get(targetId);
      if (targetUser) {
        // Get the sender's user ID
        const fromId = socketToUser.get(socket.id) || 'unknown';
        
        debug(`Forwarding signal from ${fromId} to ${targetId} (socket: ${targetUser.socketId})`);
        
        io.to(targetUser.socketId).emit('signal', {
          callId,
          signal,
          fromId,
        });
      } else {
        debug(`Target user ${targetId} not found for signaling`);
        socket.emit('call:error', { message: 'Target user not found or offline' });
      }
    });
    
    socket.on('disconnect', () => {
      debug('Client disconnected:', socket.id);
      
      // Find user ID by socket ID
      let disconnectedUserId = null;
      for (const [userId, userData] of activeUsers.entries()) {
        if (userData.socketId === socket.id) {
          disconnectedUserId = userId;
          activeUsers.delete(userId);
          break;
        }
      }
      
      // Remove from socket to user mapping
      socketToUser.delete(socket.id);
      
      // End any active calls involving this user
      for (const [callId, call] of activeCalls.entries()) {
        if (call.callerId === disconnectedUserId || call.targetId === disconnectedUserId) {
          call.status = 'ended';
          call.endTime = Date.now();
          
          // Notify the other user that the call has ended
          const otherUserId = call.callerId === disconnectedUserId ? call.targetId : call.callerId;
          const otherUser = activeUsers.get(otherUserId);
          
          if (otherUser) {
            debug(`Notifying ${otherUserId} that call ended due to disconnection`);
            io.to(otherUser.socketId).emit('call:ended', { 
              callId, 
              endedBy: disconnectedUserId,
              reason: 'disconnected'
            });
          }
          
          // Remove the call after a short delay
          setTimeout(() => {
            activeCalls.delete(callId);
          }, 5000);
        }
      }
      
      io.emit('users:active', Array.from(activeUsers.values()));
      
      // Remove user from issue viewers
      for (const [issueId, viewers] of issueViewers.entries()) {
        let userRemoved = false;
        
        for (const [userId, userData] of viewers.entries()) {
          if (userData.socketId === socket.id) {
            viewers.delete(userId);
            userRemoved = true;
            break;
          }
        }
        
        if (userRemoved) {
          if (viewers.size === 0) {
            issueViewers.delete(issueId);
          } else {
            io.emit('issue:viewing', {
              issueId,
              users: Array.from(viewers.values()),
            });
          }
        }
      }
    });
  });

  // Try to find an available port starting from 3000
  findAvailablePort(3000, (err, port) => {
    if (err) {
      console.error('Could not find an available port:', err);
      process.exit(1);
    }
    
    server.listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://localhost:${port}`);
    });
  });
}); 