import "server-only";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { OutreachOpenAi } from "@invessiv/common/constants/leads/outreach/lead-outreach-openai";
import { withPermission } from "@/lib/auth/api";

export const runtime = "nodejs";
export const OPENAI_MODEL = OutreachOpenAi.DefaultModel;

export const GET = withPermission(Permission.OutreachGenerate, async () => {
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
