export type ApprovalRequest = {
  action: string;
  reason: string;
};

export class ApprovalGate {
  async request(input: ApprovalRequest) {
    return {
      status: 'pending',
      ...input,
    };
  }
}
