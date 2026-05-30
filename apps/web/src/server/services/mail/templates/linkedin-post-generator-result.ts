import "server-only";
import { getDictionary } from "@/i18n/get-dictionary";
import { getServerEnv } from "@/server/config/env";
import {
  escapeHtml,
  getEnvironmentSubjectPrefix,
} from "@/server/services/mail/templates/template-utils";
import type { Locale } from "@/config/i18n";
import type { MailMessage } from "@/server/services/mail/mail-provider";
import type { LinkedInPostGeneratorPostDto } from "@/common/contracts/generator";

type LinkedInPostGeneratorResultMessageInput = {
  caption: string;
  downloadFileName: string;
  locale: Locale;
  post: LinkedInPostGeneratorPostDto;
  png?: Buffer | null;
  to: string;
};

function createPreviewSvg(post: LinkedInPostGeneratorPostDto) {
  const body =
    post.bodyVariant === "bullets" && post.bullets
      ? post.bullets
          .map(
            (bullet, index) =>
              `<text x="120" y="${660 + index * 58}" fill="${post.colorPair.text}" font-size="34" font-weight="650">${escapeHtml(bullet)}</text>`,
          )
          .join("")
      : `<text x="120" y="720" fill="${post.colorPair.text}" font-size="42" font-weight="650">${escapeHtml(post.insight ?? "")}</text>`;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">`,
    `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${post.colorPair.primary}"/><stop offset="1" stop-color="${post.colorPair.secondary}"/></linearGradient></defs>`,
    `<rect width="1080" height="1080" fill="url(#bg)"/>`,
    `<circle cx="190" cy="160" r="260" fill="${post.colorPair.accent}" opacity="0.18"/>`,
    `<text x="120" y="150" fill="${post.colorPair.text}" opacity="0.78" font-size="24" font-weight="760" letter-spacing="5">${escapeHtml(post.expertiseDisplay.toUpperCase())}</text>`,
    `<foreignObject x="120" y="270" width="760" height="330"><div xmlns="http://www.w3.org/1999/xhtml" style="color:${post.colorPair.text};font-family:Arial,sans-serif;font-size:82px;font-weight:820;line-height:.96">${post.headlineHtml.replaceAll("<em>", `<span style="color:${post.colorPair.accent}">`).replaceAll("</em>", "</span>")}</div></foreignObject>`,
    body,
    `<rect x="760" y="940" width="210" height="2" fill="${post.colorPair.accent}" opacity="0.74"/>`,
    `</svg>`,
  ].join("");
}

function createImageAttachment(
  post: LinkedInPostGeneratorPostDto,
  downloadFileName: string,
  png?: Buffer | null,
) {
  if (png && png.length > 0) {
    return {
      content: png.toString("base64"),
      filename: downloadFileName,
    };
  }

  return {
    content: Buffer.from(createPreviewSvg(post), "utf8").toString("base64"),
    filename: downloadFileName.replace(/\.png$/u, ".svg"),
  };
}

export async function createLinkedInPostGeneratorResultMessage({
  caption,
  downloadFileName,
  locale,
  post,
  png,
  to,
}: LinkedInPostGeneratorResultMessageInput): Promise<MailMessage> {
  const copy = (await getDictionary(locale)).mail.linkedinPostGeneratorResult;
  const environmentPrefix = getEnvironmentSubjectPrefix(
    getServerEnv().deploymentEnvironment,
  );

  return {
    attachments: [
      createImageAttachment(post, downloadFileName, png),
      {
        content: Buffer.from(`${caption}\n`, "utf8").toString("base64"),
        filename: downloadFileName.replace(/\.png$/u, ".txt"),
      },
    ],
    html: [
      `<h1 style="font-size:20px;margin:0 0 16px;">${escapeHtml(copy.heading)}</h1>`,
      `<p style="margin:0 0 16px;">${escapeHtml(copy.textIntro)}</p>`,
      `<p style="margin:0 0 16px;">${escapeHtml(copy.attachmentIntro)}</p>`,
      `<h2 style="font-size:16px;margin:0 0 8px;">${escapeHtml(copy.captionLabel)}</h2>`,
      `<p style="margin:0;white-space:pre-wrap;">${escapeHtml(caption)}</p>`,
    ].join(""),
    subject: `${environmentPrefix}${copy.subject}`,
    text: [
      copy.heading,
      "",
      copy.textIntro,
      copy.attachmentIntro,
      "",
      `${copy.captionLabel}:`,
      caption,
    ].join("\n"),
    to,
  };
}
