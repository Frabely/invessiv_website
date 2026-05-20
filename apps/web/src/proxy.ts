import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isMarketingProofEnabled } from "@/config/marketing-launch";

const LEGACY_REDIRECTS: Record<string, string> = {
  "/": "/de",
  "/imprint": "/de/imprint",
  "/projects": "/de",
  "/privacy": "/de/privacy",
  "/terms": "/de/terms",
};

export function handleLegacyRedirect(request: NextRequest) {
  const targetPath =
    request.nextUrl.pathname === "/projects" && isMarketingProofEnabled()
      ? "/de/projects"
      : LEGACY_REDIRECTS[request.nextUrl.pathname];

  if (!targetPath) {
    return null;
  }

  const url = request.nextUrl.clone();
  url.pathname = targetPath;

  return NextResponse.redirect(url, 308);
}

export function proxy(request: NextRequest) {
  return handleLegacyRedirect(request) ?? NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
