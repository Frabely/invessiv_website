import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SITE_ROUTES } from "@/config/routes";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import { DEFAULT_LOCALE } from "@/lib/site-metadata";

const LOCALE_LESS_REDIRECTS: Record<string, string> = Object.fromEntries(
  Object.values(SITE_ROUTES).map((route) => [
    route,
    createLocalePathname(route, DEFAULT_LOCALE),
  ]),
);

export function handleLocaleLessRedirect(request: NextRequest) {
  const targetPath = LOCALE_LESS_REDIRECTS[request.nextUrl.pathname];

  if (!targetPath) {
    return null;
  }

  const url = request.nextUrl.clone();
  url.pathname = targetPath;

  return NextResponse.redirect(url, 308);
}

export function proxy(request: NextRequest) {
  return handleLocaleLessRedirect(request) ?? NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
