'use client';

import { AgentClient } from 'agents/client';

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:8787';

const agentClients = new Map<string, AgentClient>();

export function getAgent(
  agentName: string,
  instanceName: string,
): AgentClient {
  const key = `${agentName}:${instanceName}`;
  if (!agentClients.has(key)) {
    agentClients.set(
      key,
      new AgentClient({
        agent: agentName,
        name: instanceName,
        host: AGENT_URL,
      }),
    );
  }
  return agentClients.get(key) as AgentClient;
}

export function removeAgent(agentName: string, instanceName: string): void {
  const key = `${agentName}:${instanceName}`;
  agentClients.delete(key);
}

export function clearAgents(): void {
  agentClients.clear();
}
