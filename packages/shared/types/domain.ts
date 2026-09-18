export type MissionStatus =
  | 'pending'
  | 'planning'
  | 'executing'
  | 'review'
  | 'completed'
  | 'failed';

export interface Mission {
  id: string;
  title: string;
  description?: string;
  status: MissionStatus;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
}

export interface MissionResult {
  success: boolean;
  summary: string;
  evidence?: unknown;
}
