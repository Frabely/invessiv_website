import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const LEGACY_REDIRECTS: Record<string, string> = {
  "/": "/de",
  "/imprint": "/de/imprint",
  "/privacy": "/de/privacy",
  "/terms": "/de/terms",
};

export function proxy(request: NextRequest) {
  const targetPath = LEGACY_REDIRECTS[request.nextUrl.pathname];

  if (!targetPath) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = targetPath;

  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: ["/", "/imprint", "/privacy", "/terms"],
};
