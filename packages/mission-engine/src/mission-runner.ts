export async function runMission(mission: {
  title: string;
  steps: string[];
}) {
  const events = [];

  events.push({ type: 'MISSION_STARTED', mission: mission.title });

  for (const step of mission.steps) {
    events.push({
      type: 'AGENT_EXECUTING',
      step,
    });
  }

  events.push({ type: 'MISSION_COMPLETED' });

  return events;
}
