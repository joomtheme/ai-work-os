export type MissionRunStatus =
  | "CREATED"
  | "PLANNING"
  | "EXECUTING"
  | "COMPLETED"
  | "FAILED";

export interface MissionRunResult {
  missionId: string;
  status: MissionRunStatus;
  events: string[];
}

export async function runMission(missionId: string): Promise<MissionRunResult> {
  const events: string[] = [];

  events.push("MISSION_CREATED");
  events.push("PLANNER_STARTED");
  events.push("AGENTS_ASSIGNED");
  events.push("EXECUTION_STARTED");
  events.push("RESULT_CREATED");

  return {
    missionId,
    status: "COMPLETED",
    events,
  };
}
