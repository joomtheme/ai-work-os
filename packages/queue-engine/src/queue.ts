export type MissionJob = {
  id: string;
  missionId: string;
  type: 'mission.execute';
};

export class MissionQueue {
  private jobs: MissionJob[] = [];

  add(job: MissionJob) {
    this.jobs.push(job);
    return job;
  }

  next() {
    return this.jobs.shift();
  }
}
