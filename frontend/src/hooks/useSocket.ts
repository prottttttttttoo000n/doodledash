'use client';

import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket } from '@/lib/socket';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
}

export function useSocket(): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const s = connectSocket();
    setSocket(s);

    function onConnect(): void {
      setIsConnected(true);
    }
    function onDisconnect(): void {
      setIsConnected(false);
    }
    function onConnectError(): void {
      setIsConnected(false);
    }

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onConnectError);

    if (s.connected) setIsConnected(true);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onConnectError);
      disconnectSocket();
    };
  }, []);

  return { socket, isConnected };
}
