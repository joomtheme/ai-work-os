export type AgentState = {
  name: string;
  role: string;
  status: 'idle' | 'running' | 'completed';
};

export function LiveAgentWorkspace({ agents }: { agents: AgentState[] }) {
  return (
    <section>
      <h2>AI Team Workspace</h2>
      {agents.map((agent) => (
        <article key={agent.name}>
          <strong>{agent.name}</strong>
          <span>{agent.role}</span>
          <span>{agent.status}</span>
        </article>
      ))}
    </section>
  );
}
