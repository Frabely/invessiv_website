export type LinkedInPostGeneratorFailureResponseDto = {
  ok: false;
  code: string;
  fieldErrors?: Record<string, string[]>;
  usageLimit?: {
    limit: number;
    remaining: number;
    resetAt: string;
  };
};
