export type AgentStatus = {
  name: string;
  role: string;
  status: 'idle' | 'running' | 'completed';
};

export function AgentStatusCard({ agent }: { agent: AgentStatus }) {
  return (
    <section>
      <h3>{agent.name}</h3>
      <p>{agent.role}</p>
      <span>{agent.status}</span>
    </section>
  );
}
