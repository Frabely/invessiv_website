import "server-only";

import { OutreachOpenAi } from "@/common/constants/leads/outreach/lead-outreach-openai";
import { withWorkspaceApiAuth } from "@/lib/auth/api";

export const runtime = "nodejs";
export const OPENAI_MODEL = OutreachOpenAi.DefaultModel;

export const GET = withWorkspaceApiAuth(async () => {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? OPENAI_MODEL;

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
