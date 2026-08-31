import { readFileSync } from "node:fs";
import path from "node:path";
import type { Plugin } from "vitest/config";

const STATIC_IMAGE_PATTERN = /\.(png|jpe?g|webp|avif)$/;
const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function readPngSize(buffer: Buffer) {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function readJpegSize(buffer: Buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    const isStartOfFrame =
      marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isStartOfFrame) {
      return {
        width: buffer.readUInt16BE(offset + 7),
        height: buffer.readUInt16BE(offset + 5),
      };
    }
    offset += 2 + buffer.readUInt16BE(offset + 2);
  }
  throw new Error("Unable to read JPEG dimensions");
}

export function nextStaticImagePlugin(appRoot: string): Plugin {
  return {
    name: "next-static-image",
    enforce: "pre",
    load(id) {
      const [filePath] = id.split("?");
      if (!STATIC_IMAGE_PATTERN.test(filePath)) {
        return null;
      }

      const buffer = readFileSync(filePath);
      const { width, height } = filePath.endsWith(".png")
        ? readPngSize(buffer)
        : readJpegSize(buffer);
      const src = `/${path.relative(appRoot, filePath).split(path.sep).join("/")}`;

      return `export default ${JSON.stringify({
        src,
        width,
        height,
        blurDataURL: BLUR_DATA_URL,
        blurWidth: 8,
        blurHeight: 8,
      })};`;
    },
  };
}
