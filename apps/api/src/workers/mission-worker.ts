export interface MissionJob {
  id: string;
  goal: string;
}

export async function processMission(job: MissionJob) {
  return {
    missionId: job.id,
    status: "queued",
    message: "Mission worker initialized",
  };
}
