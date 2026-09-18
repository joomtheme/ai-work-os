export function MissionCreate() {
  return {
    component: 'MissionCreate',
    fields: ['title', 'goal', 'agentProfile'],
    actions: ['createMission', 'assignAgent'],
    experience: 'guided-mission-launch',
  };
}
