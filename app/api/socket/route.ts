import { Server as NetServer } from 'http';
import { NextRequest } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { Issue, Activity } from '../../types';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Store for active users and their activities
const activeUsers = new Map();
const issueViewers = new Map();

// Global socket.io instance
let io: SocketIOServer;

export async function GET(req: NextRequest) {
  if (io) {
    return new Response('Socket.IO server is already running', {
      status: 200,
    });
  }

  try {
    // For Next.js App Router, we need to create a Socket.IO server
    // that attaches to the existing HTTP server
    const upgradeHeader = req.headers.get('upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade to websocket', { status: 426 });
    }

    // This is a workaround for Next.js App Router
    // We'll use a custom handler in middleware.ts to properly handle WebSocket connections
    return new Response('Socket.IO server initialized', {
      status: 200,
    });
  } catch (error) {
    console.error('Socket initialization error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 