export interface QueueJob {
  id: string;
  type: string;
  payload: unknown;
}

export class QueueAdapter {
  async enqueue(job: QueueJob) {
    return { queued: true, job };
  }
}
