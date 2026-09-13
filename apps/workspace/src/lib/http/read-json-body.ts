import type { NextRequest } from "next/server";

/** A malformed body is a client error, so it is reported instead of thrown. */
export async function readJsonBody(
  request: NextRequest,
): Promise<{ ok: true; body: unknown } | { ok: false }> {
  try {
    return { ok: true, body: await request.json() };
  } catch {
    return { ok: false };
  }
}
