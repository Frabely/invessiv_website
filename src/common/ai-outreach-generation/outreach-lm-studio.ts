export const OutreachLmStudio = {
  DefaultBaseUrl: "http://127.0.0.1:1234/v1",
  NativeApiBaseUrl: "http://127.0.0.1:1234/api/v1",
  ChatCompletionsPath: "/chat/completions",
  DefaultModel: "qwen3-14b",
  Hostname: "127.0.0.1",
  Path: "/v1",
  Port: "1234",
  ModelsPath: "/models",
} as const;

export const OutreachOpenAi = {
  DefaultModel: "gpt-4o-mini",
} as const;
