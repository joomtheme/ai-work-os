export type ExecutionEvent = {
  type: string;
  message: string;
  createdAt: string;
};

export function ExecutionTimeline({ events }: { events: ExecutionEvent[] }) {
  return (
    <div>
      {events.map((event) => (
        <div key={`${event.type}-${event.createdAt}`}>
          <strong>{event.type}</strong>
          <p>{event.message}</p>
        </div>
      ))}
    </div>
  );
}
