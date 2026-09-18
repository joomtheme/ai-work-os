export type ServerStatus = 'ready' | 'stopped';

export const serverState = {
  status: 'ready' as ServerStatus,
  service: 'ai-work-os-api'
};

export function healthCheck() {
  return {
    ok: true,
    service: serverState.service,
    status: serverState.status
  };
}
