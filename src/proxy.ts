import type { ClerkMiddlewareAuth } from "@clerk/nextjs/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isMarketingProofEnabled } from "@/config/marketing-launch";
import { isSupportedLocale } from "@/config/i18n";
import { signInPathWithRedirect } from "@/lib/auth/routes";

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

function getLocaleFromPathname(pathname: string) {
  const [, locale] = pathname.split("/");

  return locale && isSupportedLocale(locale) ? locale : null;
}

export function isWorkspaceRoute(request: NextRequest) {
  const [, locale, segment] = request.nextUrl.pathname.split("/");

  return isSupportedLocale(locale) && segment === "workspace";
}

export function buildWorkspaceUnauthenticatedUrl(request: NextRequest) {
  const locale = getLocaleFromPathname(request.nextUrl.pathname);

  if (!locale) {
    return null;
  }

  const relativeUrl = signInPathWithRedirect(
    locale,
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return new URL(relativeUrl, request.nextUrl.origin).toString();
}

export async function proxyHandler(
  auth: ClerkMiddlewareAuth,
  request: NextRequest,
) {
  const legacyRedirect = handleLegacyRedirect(request);

  if (legacyRedirect) {
    return legacyRedirect;
  }

  if (isWorkspaceRoute(request)) {
    const unauthenticatedUrl = buildWorkspaceUnauthenticatedUrl(request);

    if (unauthenticatedUrl) {
      await auth.protect({ unauthenticatedUrl });
    }
  }

  return NextResponse.next();
}

export default clerkMiddleware(proxyHandler);

// Next.js reads this convention-based export at build/runtime to decide
// which requests execute the proxy. Keep it statically analyzable.
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
