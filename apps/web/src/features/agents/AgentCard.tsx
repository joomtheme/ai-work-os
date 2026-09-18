type AgentCardProps = {
  name: string;
  role: string;
};

export function AgentCard({ name, role }: AgentCardProps) {
  return (
    <article>
      <h2>{name}</h2>
      <p>{role}</p>
    </article>
  );
}
