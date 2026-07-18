import { routeAgentRequest } from 'agents';
import { GameRoom } from './gameRoom';
import type { Env } from './types';

// Export the DO class so the Cloudflare runtime can instantiate it
export { GameRoom };

/**
 * Generate a 6-character uppercase alphanumeric room code
 * using cryptographically-secure randomness.
 */
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => chars[b % chars.length]).join('');
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // ── CORS preflight ────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // ── API: room code generation ────────────────────────────
    // Returns a unique room code. The client then connects to
    // /agents/GameRoom/{code} via WebSocket and calls createRoom().
    if (request.method === 'POST' && url.pathname === '/api/generate-code') {
      const code = generateRoomCode();
      return new Response(JSON.stringify({ roomCode: code }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // ── Health check ─────────────────────────────────────────
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // ── Route to Agent (WebSocket upgrade for game room) ────
    const agentResponse = await routeAgentRequest(request, env);
    if (agentResponse) {
      // Add CORS headers for non-WebSocket agent routes
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };
      const resp = new Response(agentResponse.body, {
        status: agentResponse.status,
        statusText: agentResponse.statusText,
        headers: agentResponse.headers,
      });
      for (const [key, value] of Object.entries(corsHeaders)) {
        resp.headers.set(key, value);
      }
      return resp;
    }

    // ── 404 ──────────────────────────────────────────────────
    return new Response('Not found', { status: 404 });
  },
};
