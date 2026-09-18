export type MissionRequest = {
  title: string;
  objective: string;
};

export async function createMission(input: MissionRequest) {
  return {
    id: crypto.randomUUID(),
    title: input.title,
    objective: input.objective,
    status: 'planned'
  };
}
