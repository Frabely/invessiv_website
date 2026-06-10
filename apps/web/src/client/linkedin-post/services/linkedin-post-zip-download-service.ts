import { LINKEDIN_POST_IMAGE_DATA_URL_PREFIX } from "@/common/constants";
import type { LinkedInPostZipDownloadInput } from "@/common/contracts";
import { strToU8, zipSync } from "fflate";

function baseNameFor(downloadFileName: string) {
  const trimmed = downloadFileName.trim();
  const withoutExtension = trimmed.replace(/\.[^.]+$/u, "");
  return withoutExtension || "linkedin-post";
}

function pngBytesFromDataUrl(imageDataUrl: string) {
  if (!imageDataUrl.startsWith(LINKEDIN_POST_IMAGE_DATA_URL_PREFIX)) {
    throw new Error("linkedin_post_zip_invalid_image_data_url");
  }

  const base64 = imageDataUrl.slice(LINKEDIN_POST_IMAGE_DATA_URL_PREFIX.length);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function createLinkedInPostZipArchive({
  caption,
  downloadFileName,
  imageDataUrl,
}: LinkedInPostZipDownloadInput) {
  const baseName = baseNameFor(downloadFileName);
  return zipSync({
    [`${baseName}.png`]: pngBytesFromDataUrl(imageDataUrl),
    [`${baseName}.txt`]: strToU8(`${caption}\n`),
  });
}

export function downloadLinkedInPostZip(input: LinkedInPostZipDownloadInput) {
  const baseName = baseNameFor(input.downloadFileName);
  const archive = createLinkedInPostZipArchive(input);
  const blob = new Blob([archive], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${baseName}.zip`;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export const linkedinPostZipDownloadService = {
  createLinkedInPostZipArchive,
  downloadLinkedInPostZip,
} as const;
