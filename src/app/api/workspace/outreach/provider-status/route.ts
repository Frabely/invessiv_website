import "server-only";

import { withWorkspaceApiAuth } from "@/lib/auth/api";

export const runtime = "nodejs";

export const GET = withWorkspaceApiAuth(async () => {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  return Response.json({
    ok: true,
    providers: {
      openai: {
        available: Boolean(apiKey),
        model,
      },
    },
  });
});
