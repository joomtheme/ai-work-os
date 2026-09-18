export type MissionStatus =
  | 'created'
  | 'planning'
  | 'executing'
  | 'review'
  | 'completed';

export interface Mission {
  id: string;
  title: string;
  objective: string;
  status: MissionStatus;
}
