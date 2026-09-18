export type MissionEvent = {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed';
};

export function MissionTimeline({ events }: { events: MissionEvent[] }) {
  return (
    <div>
      {events.map((event) => (
        <div key={event.id}>
          <strong>{event.title}</strong>
          <span> {event.status}</span>
        </div>
      ))}
    </div>
  );
}
