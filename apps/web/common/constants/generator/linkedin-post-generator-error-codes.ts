export const LinkedInPostGeneratorErrorCode = {
  InvalidJson: "invalid_json",
  PayloadTooLarge: "payload_too_large",
  ValidationError: "validation_error",
  SpamDetected: "spam_detected",
  UnsafeInput: "unsafe_input",
  OpenAiApiKeyMissing: "openai_api_key_missing",
  OpenAiRequestFailed: "openai_request_failed",
  OpenAiSchemaError: "openai_schema_error",
  OpenAiEmptyOutput: "openai_empty_output",
  OpenAiInvalidJson: "openai_invalid_json",
  OpenAiInvalidContent: "openai_invalid_content",
  GeneratorSchemaInvalid: "generator_schema_invalid",
  DeliveryUnavailable: "delivery_unavailable",
  InternalError: "internal_error",
} as const;

export type LinkedInPostGeneratorErrorCode =
  (typeof LinkedInPostGeneratorErrorCode)[keyof typeof LinkedInPostGeneratorErrorCode];
