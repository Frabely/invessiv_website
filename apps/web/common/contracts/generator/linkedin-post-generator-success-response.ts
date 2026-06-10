import type { LinkedInPostGeneratorPostDto } from "@/common/contracts";

export type LinkedInPostGeneratorSuccessResponseDto = {
  ok: true;
  post: LinkedInPostGeneratorPostDto;
  caption: string;
  downloadFileName: string;
  usageLimit?: {
    limit: number;
    remaining: number;
    resetAt: string;
  };
};
