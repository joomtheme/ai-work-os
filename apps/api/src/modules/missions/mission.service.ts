export type MissionStatus = "pending" | "running" | "completed";

export type Mission = {
  id: string;
  title: string;
  status: MissionStatus;
};

export function createMission(title: string): Mission {
  return {
    id: crypto.randomUUID(),
    title,
    status: "pending",
  };
}
