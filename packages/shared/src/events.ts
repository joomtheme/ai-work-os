export type MissionEvent =
  | "MISSION_CREATED"
  | "MISSION_STARTED"
  | "AGENT_ASSIGNED"
  | "AGENT_COMPLETED"
  | "MISSION_COMPLETED";

export interface EventPayload {
  type: MissionEvent;
  missionId: string;
  timestamp: string;
}
