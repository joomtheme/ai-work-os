export interface QueueJob {
  id: string;
  missionId: string;
  type: string;
}

export async function processQueueJob(job: QueueJob) {
  return {
    jobId: job.id,
    missionId: job.missionId,
    status: 'completed',
    processedAt: new Date().toISOString(),
  };
}
