import type { LinkedInPostGeneratorPostDto } from "./linkedin-post-generator-post";

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
