import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";

const PRIVATE_NO_STORE = "private, no-store";

/** Customer data must never land in a shared or browser cache, error answers included. */
export function markPrivateNoStore(response: Response): Response {
  response.headers.set(HttpHeaderName.CacheControl, PRIVATE_NO_STORE);
  return response;
}

/**
 * Runs a route body that may throw and keeps every answer private — authorization denials and
 * failures as well. `onError` logs without request data and picks the domain's error answer.
 */
export async function privateResponse(
  run: () => Promise<Response>,
  onError: (error: unknown) => Response,
): Promise<Response> {
  let response: Response;
  try {
    response = await run();
  } catch (error: unknown) {
    response = onError(error);
  }
  return markPrivateNoStore(response);
}
