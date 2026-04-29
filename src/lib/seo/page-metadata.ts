import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site-metadata";

function createSharedSocialImage() {
  return {
    alt: "Invessiv Landingpage-Angebot für Selbstständige und kleine Unternehmen",
    height: 630,
    url: new URL("/og/landing.png", SITE_URL).toString(),
    width: 1200,
  } as const;
}

export function createLocaleAlternates<T extends Record<string, string>>(
  languages: T,
) {
  return {
    ...languages,
    "x-default": languages.de,
  };
}

type CreatePageMetadataInput = {
  absoluteTitle?: boolean;
  canonicalPath: string;
  description: string;
  languages: Record<string, string>;
  openGraphDescription?: string;
  openGraphLocale?: string;
  openGraphTitle?: string;
  socialImage?: {
    alt: string;
    height: number;
    url: string;
    width: number;
  };
  title: string;
};

export function createPageMetadata({
  absoluteTitle = false,
  canonicalPath,
  description,
  languages,
  openGraphDescription,
  openGraphLocale,
  openGraphTitle,
  socialImage,
  title,
}: CreatePageMetadataInput): Metadata {
  const socialTitle = openGraphTitle ?? title;
  const socialDescription = openGraphDescription ?? description;
  const absoluteCanonical = new URL(canonicalPath, SITE_URL).toString();
  const sharedSocialImage = socialImage ?? createSharedSocialImage();
  const absoluteLanguages = Object.fromEntries(
    Object.entries(languages).map(([language, path]) => [
      language,
      new URL(path, SITE_URL).toString(),
    ]),
  );

  return {
    metadataBase: new URL(SITE_URL),
    title: absoluteTitle ? { absolute: title } : title,
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
      images: [
        {
          alt: sharedSocialImage.alt,
          url: sharedSocialImage.url,
        },
      ],
    },
  };
}
