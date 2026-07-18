'use client';

import { useAgent } from 'agents/react';
import type { GameRoomState } from '@/types';

interface UseAgentGameOptions {
  roomCode: string;
  onStateUpdate: (state: GameRoomState) => void;
}

/**
 * Hook that wraps the `useAgent` hook from `agents/react` for the GameRoom agent.
 * Provides a typed interface for connecting to a game room and receiving state updates.
 */
export function useAgentGame({ roomCode, onStateUpdate }: UseAgentGameOptions) {
  const agent = useAgent({
    agent: 'GameRoom',
    name: roomCode,
    onStateUpdate,
    onError: (err) => console.error('Agent error:', err),
  });

  return {
    agent,
    isConnected: true,
  };
}
