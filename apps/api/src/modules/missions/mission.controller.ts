export const MissionController = {
  create(input: { title: string; goal: string; agentProfile: string }) {
    return {
      id: crypto.randomUUID(),
      ...input,
      status: 'created',
    };
  },
};
