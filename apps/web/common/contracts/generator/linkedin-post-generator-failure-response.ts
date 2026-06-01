export type LinkedInPostGeneratorFailureResponseDto = {
  ok: false;
  code: string;
  debug?: {
    reason?: string;
    stage: string;
  };
  fieldErrors?: Record<string, string[]>;
  usageLimit?: {
    limit: number;
    remaining: number;
    resetAt: string;
  };
};
