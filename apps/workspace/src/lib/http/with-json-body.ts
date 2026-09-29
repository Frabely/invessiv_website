import type { NextRequest } from "next/server";
import { readJsonBody } from "./read-json-body";

/**
 * A body that is not JSON at all never reaches the command; `onInvalid` answers in the route's own
 * error format. The shape is validated by the command or by the caller's schema afterwards.
 */
export async function withJsonBody(
  request: NextRequest,
  run: (body: unknown) => Promise<Response>,
  onInvalid: () => Response,
): Promise<Response> {
  const parsed = await readJsonBody(request);
  return parsed.ok ? run(parsed.body) : onInvalid();
}
