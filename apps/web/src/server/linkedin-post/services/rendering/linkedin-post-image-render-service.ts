import "server-only";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement, type ReactNode } from "react";
import satori from "satori";
import type { LinkedInPostGeneratorPostDto } from "@/common/contracts/generator";
import { POST_SIZE_PX } from "@/common/constants/generator";

const INTER_FONT_FILE_NAMES = [
  "inter-latin-400-normal.woff",
  "inter-latin-600-normal.woff",
  "inter-latin-700-normal.woff",
  "inter-latin-800-normal.woff",
] as const;

let fontBufferCache: Buffer[] | null = null;
let satoriFontCache: Array<{
  data: ArrayBuffer;
  name: string;
  style: "normal";
  weight: 400 | 600 | 700 | 800;
}> | null = null;

function resolveInterFontPath(fileName: string) {
  const candidates = [
    join(
      process.cwd(),
      "node_modules",
      "@fontsource",
      "inter",
      "files",
      fileName,
    ),
    join(
      process.cwd(),
      "..",
      "..",
      "node_modules",
      "@fontsource",
      "inter",
      "files",
      fileName,
    ),
    join("/var/task/node_modules", "@fontsource", "inter", "files", fileName),
  ];

  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error(`inter_font_missing:${fileName}`);
  }

  return found;
}

function loadInterFontBuffers() {
  fontBufferCache ??= INTER_FONT_FILE_NAMES.map((fileName) =>
    readFileSync(resolveInterFontPath(fileName)),
  );
  return fontBufferCache;
}

function bufferToArrayBuffer(buffer: Buffer) {
  const arrayBuffer = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(arrayBuffer).set(buffer);
  return arrayBuffer;
}

function loadSatoriFonts() {
  satoriFontCache ??= loadInterFontBuffers().map((buffer, index) => ({
    data: bufferToArrayBuffer(buffer),
    name: "Inter",
    style: "normal",
    weight: [400, 600, 700, 800][index] as 400 | 600 | 700 | 800,
  }));
  return satoriFontCache;
}

function wrapText(value: string, maxChars: number, maxLines: number) {
  const words = value.trim().split(/\s+/u).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }
    current = word;

    if (lines.length >= maxLines) {
      break;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  return lines;
}

function h(
  type: string,
  props: Record<string, unknown>,
  ...children: ReactNode[]
) {
  return createElement(type, props, ...children);
}

function satoriTextLines(
  lines: string[],
  style: Record<string, string | number>,
) {
  return lines.map((line, index) =>
    h("div", { key: `${line}-${index}`, style }, line),
  );
}

function renderSatoriPostElement(post: LinkedInPostGeneratorPostDto) {
  const headline = wrapText(post.headlinePlain, 18, 4);
  const insight =
    post.bodyVariant === "bullets"
      ? []
      : wrapText(post.insight ?? post.highlight ?? "", 42, 3);
  const bullets = (post.bullets ?? []).slice(0, 3);

  return h(
    "div",
    {
      style: {
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: `${POST_SIZE_PX}px`,
        height: `${POST_SIZE_PX}px`,
        background: `linear-gradient(135deg, ${post.colorPair.primary}, ${post.colorPair.secondary})`,
        color: post.colorPair.text,
        fontFamily: "Inter",
        overflow: "hidden",
      },
    },
    h("div", {
      style: {
        position: "absolute",
        right: "-80px",
        top: "-92px",
        width: "360px",
        height: "360px",
        borderRadius: "180px",
        background: post.colorPair.accent,
        opacity: 0.16,
      },
    }),
    h("div", {
      style: {
        position: "absolute",
        left: "-120px",
        bottom: "-150px",
        width: "420px",
        height: "420px",
        borderRadius: "210px",
        background: post.colorPair.accent,
        opacity: 0.1,
      },
    }),
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          position: "absolute",
          left: "112px",
          right: "112px",
          top: "122px",
          bottom: "118px",
        },
      },
      h(
        "div",
        {
          style: {
            display: "flex",
            color: post.colorPair.accent,
            fontSize: "30px",
            fontWeight: 800,
            letterSpacing: "0px",
            textTransform: "uppercase",
          },
        },
        post.kicker,
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            marginTop: "88px",
          },
        },
        ...satoriTextLines(headline, {
          color: post.colorPair.text,
          fontSize: post.bodyVariant === "bullets" ? "66px" : "76px",
          fontWeight: 800,
          lineHeight: 1.08,
        }),
      ),
      post.bodyVariant === "bullets"
        ? h(
            "div",
            {
              style: {
                display: "flex",
                flexDirection: "column",
                gap: "30px",
                marginTop: "86px",
                padding: "44px 48px",
                borderRadius: "34px",
                background: "rgba(255,255,255,0.10)",
              },
            },
            ...bullets.map((bullet, index) =>
              h(
                "div",
                {
                  key: `${bullet}-${index}`,
                  style: {
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "26px",
                  },
                },
                h(
                  "div",
                  {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "48px",
                      height: "48px",
                      borderRadius: "24px",
                      background: post.colorPair.accent,
                      color: "#101010",
                      fontSize: "24px",
                      fontWeight: 800,
                      flex: "none",
                    },
                  },
                  String(index + 1),
                ),
                h(
                  "div",
                  {
                    style: {
                      display: "flex",
                      flexDirection: "column",
                      color: post.colorPair.text,
                      fontSize: "31px",
                      fontWeight: 650,
                      lineHeight: 1.22,
                    },
                  },
                  ...satoriTextLines(wrapText(bullet, 34, 2), {
                    color: post.colorPair.text,
                    fontSize: "31px",
                    fontWeight: 650,
                    lineHeight: 1.22,
                  }),
                ),
              ),
            ),
          )
        : h(
            "div",
            {
              style: {
                display: "flex",
                flexDirection: "column",
                marginTop: "90px",
                maxWidth: "740px",
              },
            },
            ...satoriTextLines(insight, {
              color: post.colorPair.text,
              fontSize: "34px",
              fontWeight: 500,
              lineHeight: 1.32,
            }),
          ),
    ),
  );
}

async function renderLinkedInPostSvg(post: LinkedInPostGeneratorPostDto) {
  return await satori(renderSatoriPostElement(post), {
    fonts: loadSatoriFonts(),
    height: POST_SIZE_PX,
    width: POST_SIZE_PX,
  });
}

async function renderLinkedInPostPng(
  post: LinkedInPostGeneratorPostDto,
): Promise<Buffer> {
  const { Resvg } = await import("@resvg/resvg-js");
  const svg = await renderLinkedInPostSvg(post);
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: POST_SIZE_PX,
    },
    font: {
      fontBuffers: loadInterFontBuffers(),
      loadSystemFonts: false,
    },
  } as ConstructorParameters<typeof Resvg>[1] & {
    font: { fontBuffers: Buffer[] };
  });
  return Buffer.from(resvg.render().asPng());
}

export const linkedinPostImageRenderService = {
  renderLinkedInPostPng,
  renderLinkedInPostSvg,
} as const;
