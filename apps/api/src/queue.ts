export type Job = {
  id: string;
  type: string;
  payload: unknown;
};

export class MissionQueue {
  private jobs: Job[] = [];

  add(job: Job) {
    this.jobs.push(job);
  }

  next() {
    return this.jobs.shift();
  }
}
