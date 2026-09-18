export type MissionInput = {
  title: string;
  goal: string;
};

export async function createMission(input: MissionInput) {
  return {
    id: crypto.randomUUID(),
    status: "planned",
    ...input,
  };
}
