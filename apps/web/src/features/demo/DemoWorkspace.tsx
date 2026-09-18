export function DemoWorkspace() {
  return {
    workspace: 'AI Work OS Demo',
    agents: [
      { name: 'Strategist Agent', status: 'ready' },
      { name: 'Developer Agent', status: 'ready' },
      { name: 'Reviewer Agent', status: 'ready' },
    ],
    mission: {
      title: 'Build my first AI mission',
      status: 'ready',
    },
  };
}
