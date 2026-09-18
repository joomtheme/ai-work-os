export interface QueueConfig {
  redisUrl: string;
}

export function createQueueConfig(redisUrl: string): QueueConfig {
  return { redisUrl };
}
