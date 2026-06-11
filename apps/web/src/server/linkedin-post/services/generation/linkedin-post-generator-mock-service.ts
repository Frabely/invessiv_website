import "server-only";
import { GENERATOR_COLOR_PAIRS } from "@/common/constants/generator/generator-color-pairs";
import { LinkedInPostBodyVariant } from "@/common/contracts/generator/linkedin-post-body-variant";
import type { LinkedInPostGeneratorPostDto } from "@/common/contracts/generator/linkedin-post-generator-post";
import type { LinkedInPostGeneratorSuccessResponseDto } from "@/common/contracts/generator/linkedin-post-generator-success-response";
import type { LinkedInPostGeneratorFormValues } from "@/common/contracts/generator/linkedin-post-generator-form-values";
import type { Locale } from "@/config/i18n";
import { getLinkedInPostExampleContent } from "@/i18n/dictionaries/linkedin-post/example";
import { escapeHtml } from "@/server/services/mail/templates/template-utils";

type MockLinkedInPostGeneratorSuccessResult =
  LinkedInPostGeneratorSuccessResponseDto & {
    imageDataUrl: string | null;
    previewHtml: string;
  };

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (Math.imul(hash, 31) + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

/** Deterministic per-input key so the same form values always pick the same
 *  example and color pair. */
function createSelectionKey(
  values: LinkedInPostGeneratorFormValues,
  locale: Locale,
) {
  return [
    values.topic.trim(),
    values.expertise.trim(),
    values.tone,
    values.colorPairId,
    locale,
  ].join("|");
}

function selectExample(
  values: LinkedInPostGeneratorFormValues,
  locale: Locale,
) {
  const content = getLinkedInPostExampleContent(locale);
  const selectedIndex =
    hashString(createSelectionKey(values, locale)) % content.samples.length;
  return content.samples[selectedIndex]!;
}

function selectColorPair(
  values: LinkedInPostGeneratorFormValues,
  locale: Locale,
) {
  const selectedIndex =
    hashString(createSelectionKey(values, locale)) %
    GENERATOR_COLOR_PAIRS.length;
  const selected = GENERATOR_COLOR_PAIRS[selectedIndex]!;

  return {
    accent: selected.accent,
    id: selected.id,
    index: selectedIndex,
    primary: selected.primary,
    secondary: selected.secondary,
    text: selected.text,
  };
}

function buildPreviewHtml(
  post: LinkedInPostGeneratorPostDto,
  imageSrc: string,
  locale: Locale,
) {
  const captionParagraph = post.insight ?? post.headlinePlain;
  return `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
      }

      body {
        display: grid;
        place-items: stretch;
        background: linear-gradient(160deg, ${post.colorPair.primary} 0%, ${post.colorPair.secondary} 100%);
        color: ${post.colorPair.text};
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .post {
        box-sizing: border-box;
        display: grid;
        gap: 1.25rem;
        width: 100%;
        height: 100%;
        padding: 4.5rem;
      }

      .header {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .avatar {
        display: grid;
        place-items: center;
        flex: none;
        width: 4rem;
        height: 4rem;
        border-radius: 999px;
        background: ${post.colorPair.accent};
        color: #121212;
        font-size: 1.25rem;
        font-weight: 800;
        letter-spacing: 0.08em;
      }

      .meta {
        display: grid;
        gap: 0.25rem;
      }

      .eyebrow {
        margin: 0;
        color: color-mix(in srgb, ${post.colorPair.text} 70%, transparent);
        font-size: 0.8rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }

      .headline {
        margin: 0;
        font-size: 2.7rem;
        font-weight: 780;
        line-height: 1.05;
        letter-spacing: -0.04em;
      }

      .body {
        margin: 0;
        max-width: 34ch;
        font-size: 1.25rem;
        line-height: 1.5;
        color: color-mix(in srgb, ${post.colorPair.text} 88%, transparent);
      }

      .image {
        margin-top: auto;
        display: grid;
        gap: 0.75rem;
      }

      .imageFrame {
        overflow: hidden;
        border-radius: 2rem;
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 1.25rem 3rem rgba(0, 0, 0, 0.24);
      }

      img {
        display: block;
        width: 100%;
        height: auto;
      }

      .footnote {
        margin: 0;
        color: color-mix(in srgb, ${post.colorPair.text} 72%, transparent);
        font-size: 0.85rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
    </style>
  </head>
  <body>
    <article class="post">
      <header class="header">
        <div class="avatar" aria-hidden="true">${escapeHtml(
          post.authorName.slice(0, 2).toUpperCase(),
        )}</div>
        <div class="meta">
          <p class="eyebrow">${escapeHtml(locale)}</p>
          <h1 class="headline">${escapeHtml(post.headlinePlain)}</h1>
        </div>
      </header>

      <p class="body">${escapeHtml(captionParagraph)}</p>

      <figure class="image">
        <div class="imageFrame">
          <img alt="${escapeHtml(post.headlinePlain)}" src="${imageSrc}" />
        </div>
        <figcaption class="footnote">${escapeHtml(post.expertiseDisplay)}</figcaption>
      </figure>
    </article>
  </body>
</html>`;
}

async function buildMockLinkedInPostGeneratorSuccessResult(
  values: LinkedInPostGeneratorFormValues,
  locale: Locale,
): Promise<MockLinkedInPostGeneratorSuccessResult> {
  const example = selectExample(values, locale);
  const colorPair = selectColorPair(values, locale);
  const headlinePlain = example.image.headline;
  const post: LinkedInPostGeneratorPostDto = {
    bodyVariant: LinkedInPostBodyVariant.Insight,
    bullets: null,
    authorName: values.displayName.trim(),
    colorPair,
    expertiseDisplay: example.author.role,
    headlineHtml: escapeHtml(headlinePlain),
    headlinePlain,
    highlight: null,
    insight: example.caption.split("\n\n")[0] ?? example.caption,
    kicker: example.topicLabel,
    template: {
      bodyVariant: LinkedInPostBodyVariant.Insight,
      id: "editorial-center",
      index: 0,
    },
  };

  return {
    caption: example.caption,
    downloadFileName: `${example.id}.png`,
    imageDataUrl: example.image.src ?? null,
    ok: true,
    post,
    previewHtml: buildPreviewHtml(post, example.image.src ?? "", locale),
  };
}

export const linkedinPostGeneratorMockService = {
  buildMockLinkedInPostGeneratorSuccessResult,
} as const;
