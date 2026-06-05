import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { deliverLinkedInPostCommandHandlerService } from "@/server/linkedin-post/handlers/deliver-linkedin-post.command-handler";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const result =
    await deliverLinkedInPostCommandHandlerService.deliverLinkedInPostCommandHandler(
      {
        contentLength: request.headers.get("content-length"),
        contentType: request.headers.get("content-type"),
        headers: request.headers,
        readPayload: () => request.json(),
        requestId: crypto.randomUUID(),
      },
    );

  return NextResponse.json(result.body, {
    headers: {
      "Cache-Control": "no-store",
    },
    status: result.status,
  });
}
