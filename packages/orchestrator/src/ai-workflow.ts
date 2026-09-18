export type MissionWorkflowState =
  | 'created'
  | 'planning'
  | 'executing'
  | 'review'
  | 'completed';

export interface MissionWorkflow {
  missionId: string;
  state: MissionWorkflowState;
  agents: string[];
}

export async function runMissionWorkflow(
  mission: MissionWorkflow
) {
  const events = [];

  events.push({ type: 'MISSION_STARTED', missionId: mission.missionId });
  events.push({ type: 'PLANNER_STARTED' });

  mission.state = 'planning';

  events.push({
    type: 'AGENTS_ASSIGNED',
    agents: mission.agents,
  });

  mission.state = 'executing';

  events.push({ type: 'EXECUTION_STARTED' });

  return {
    mission,
    events,
  };
}
