export interface Job {
  id: string;
  missionId: string;
}

export async function processMissionJob(job: Job) {
  return {
    status: 'processed',
    missionId: job.missionId,
  };
}
