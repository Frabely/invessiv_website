export const OutreachLmStudio = {
  DefaultBaseUrl: "http://127.0.0.1:1234/v1",
  NativeApiBaseUrl: "http://127.0.0.1:1234/api/v1",
  ChatCompletionsEndpoint: "http://127.0.0.1:1234/v1/chat/completions",
  DefaultModel: "qwen3-14b",
  Hostname: "127.0.0.1",
  Path: "/v1",
  Port: "1234",
  ModelsEndpoint: "http://127.0.0.1:1234/api/v1/models",
} as const;

export const OutreachOpenAi = {
  DefaultModel: "gpt-4o-mini",
} as const;
