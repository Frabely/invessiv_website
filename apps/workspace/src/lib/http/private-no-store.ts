import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";

const PRIVATE_NO_STORE = "private, no-store";

/** Customer data must never land in a shared or browser cache, error answers included. */
export function markPrivateNoStore(response: Response): Response {
  response.headers.set(HttpHeaderName.CacheControl, PRIVATE_NO_STORE);
  return response;
}
