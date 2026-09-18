export interface AgentJob {
  id: string;
  agent: string;
  missionId: string;
  payload: unknown;
}

export async function executeAgentJob(job: AgentJob) {
  return {
    jobId: job.id,
    missionId: job.missionId,
    agent: job.agent,
    status: 'completed',
    result: {
      message: `${job.agent} finished task`,
    },
  };
}
