import type { NextRequest } from "next/server";
import type { JsonBodySchema } from "@/common/contracts/http/json-body-schema";
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

/** Keeps malformed JSON and schema errors distinct in the caller's response format. */
export async function withValidatedJsonBody<T>(
  request: NextRequest,
  schema: JsonBodySchema<T>,
  run: (input: T) => Promise<Response>,
  onInvalidJson: () => Response,
  onInvalidShape: () => Response,
): Promise<Response> {
  return withJsonBody(
    request,
    async (body) => {
      const parsed = schema.safeParse(body);
      return parsed.success ? run(parsed.data) : onInvalidShape();
    },
    onInvalidJson,
  );
}
