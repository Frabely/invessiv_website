export type LinkedInPostDeliverSuccessResponseDto = {
  ok: true;
};

export type LinkedInPostDeliverFailureResponseDto = {
  ok: false;
  code: string;
  debug?: {
    reason?: string;
    stage: string;
  };
  fieldErrors?: Record<string, string[]>;
};

export type LinkedInPostDeliverResponseDto =
  | LinkedInPostDeliverSuccessResponseDto
  | LinkedInPostDeliverFailureResponseDto;
