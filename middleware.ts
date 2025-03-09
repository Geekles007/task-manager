import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle WebSocket connections for Socket.IO
  const { pathname } = request.nextUrl;
  
  if (pathname.startsWith('/api/socket')) {
    // Allow WebSocket connections to the Socket.IO endpoint
    const upgradeHeader = request.headers.get('upgrade');
    if (upgradeHeader === 'websocket') {
      return NextResponse.next();
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/socket/:path*'],
}; 