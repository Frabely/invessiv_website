import type { LinkedInPostGeneratorFailureResponseDto } from "./linkedin-post-generator-failure-response";
import type { LinkedInPostGeneratorSuccessResponseDto } from "./linkedin-post-generator-success-response";

export type LinkedInPostGeneratorResponseDto =
  | LinkedInPostGeneratorSuccessResponseDto
  | LinkedInPostGeneratorFailureResponseDto;
