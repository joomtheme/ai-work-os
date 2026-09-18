export interface DatabaseClientConfig {
  url: string;
}

export class AIWorkOSDatabaseClient {
  constructor(private config: DatabaseClientConfig) {}

  connect() {
    return {
      connected: true,
      url: this.config.url,
    };
  }
}
