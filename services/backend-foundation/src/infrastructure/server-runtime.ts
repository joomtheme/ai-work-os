export interface ServerRuntimeConfig {
  port: number;
}

export function createServerRuntime(config: ServerRuntimeConfig) {
  return {
    status: 'ready',
    port: config.port,
  };
}
