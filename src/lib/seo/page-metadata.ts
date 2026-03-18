import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site-metadata";

function createSharedSocialImage(canonicalPath: string) {
  const [localeSegment] = canonicalPath.split("/").filter(Boolean);
  const socialImagePath = localeSegment
    ? `/${localeSegment}/opengraph-image`
    : "/opengraph-image";

  return {
    alt: `${SITE_NAME} social preview`,
    height: 630,
    url: new URL(socialImagePath, SITE_URL).toString(),
    width: 1200,
  } as const;
}

export function createLocaleAlternates<T extends Record<string, string>>(languages: T) {
  return {
    ...languages,
    "x-default": languages.de,
  };
}

type CreatePageMetadataInput = {
  canonicalPath: string;
  description: string;
  languages: Record<string, string>;
  openGraphDescription?: string;
  openGraphLocale?: string;
  openGraphTitle?: string;
  title: string;
};

export function createPageMetadata({
  canonicalPath,
  description,
  languages,
  openGraphDescription,
  openGraphLocale,
  openGraphTitle,
  title,
}: CreatePageMetadataInput): Metadata {
  const socialTitle = openGraphTitle ?? title;
  const socialDescription = openGraphDescription ?? description;
  const absoluteCanonical = new URL(canonicalPath, SITE_URL).toString();
  const sharedSocialImage = createSharedSocialImage(canonicalPath);
  const absoluteLanguages = Object.fromEntries(
    Object.entries(languages).map(([language, path]) => [
      language,
      new URL(path, SITE_URL).toString(),
    ]),
  );

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: absoluteCanonical,
      languages: absoluteLanguages,
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: absoluteCanonical,
      locale: openGraphLocale,
      title: socialTitle,
      description: socialDescription,
      images: [sharedSocialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: socialDescription,
      images: [sharedSocialImage.url],
    },
  };
}
