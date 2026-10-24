import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "vitest";
import { Resvg } from "@resvg/resvg-js";

const webRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const publicRoot = path.join(webRoot, "public");

function pngDimensions(buffer) {
  assert.equal(buffer.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

test("all raster icons have the dimensions advertised to browsers and Google", async () => {
  for (const [file, size] of [
    ["favicon.png", 512],
    ["apple-touch-icon.png", 180],
    ["brand/icon.png", 1024],
    ["brand/icon_noText.png", 1024],
    ...[32, 48, 192, 512].map((size) => [`favicon-${size}x${size}.png`, size]),
  ]) {
    assert.deepEqual(
      pngDimensions(await readFile(path.join(publicRoot, file))),
      [size, size],
      file,
    );
  }
});

test("ICO directory sizes and offsets match its embedded PNG images", async () => {
  const ico = await readFile(path.join(publicRoot, "favicon.ico"));
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 4);
  let expectedOffset = 70;
  for (const [index, size] of [16, 32, 48, 256].entries()) {
    const entry = 6 + index * 16;
    assert.equal(ico[entry] || 256, size);
    assert.equal(ico[entry + 1] || 256, size);
    const length = ico.readUInt32LE(entry + 8);
    const offset = ico.readUInt32LE(entry + 12);
    assert.equal(offset, expectedOffset);
    assert.deepEqual(pngDimensions(ico.subarray(offset, offset + length)), [
      size,
      size,
    ]);
    expectedOffset += length;
  }
  assert.equal(expectedOffset, ico.length);
});

test("the complete foreground logo fits within a circular search icon crop", async () => {
  const [icon, background] = await Promise.all([
    readFile(path.join(publicRoot, "brand/icon.png")),
    readFile(path.join(webRoot, "assets/brand/favicon-background.png")),
  ]);
  const pixels = (png, fit) =>
    new Resvg(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><image href="data:image/png;base64,${png.toString("base64")}" width="1024" height="1024" preserveAspectRatio="${fit}"/></svg>`,
    ).render().pixels;
  const actual = pixels(icon, "none");
  const backdrop = pixels(background, "xMidYMid slice");
  let foregroundPixels = 0;
  for (let y = 0; y < 1024; y++) {
    for (let x = 0; x < 1024; x++) {
      const index = (y * 1024 + x) * 4;
      const difference = Math.max(
        ...[0, 1, 2].map((channel) =>
          Math.abs(actual[index + channel] - backdrop[index + channel]),
        ),
      );
      if (difference > 15) {
        foregroundPixels++;
        assert.ok(
          Math.hypot(x - 512, y - 512) < 490,
          `Logo clipped at ${x}, ${y}`,
        );
      }
    }
  }
  assert.ok(foregroundPixels > 100_000, "Expected a visible foreground logo");
});

test("all locale previews are available at their declared aspect ratios", async () => {
  for (const locale of ["de", "en"]) {
    for (const name of [
      "home",
      "references",
      "landing",
      "linkedin-post",
      "home-square",
    ]) {
      const png = await readFile(
        path.join(publicRoot, `og/${name}-${locale}.png`),
      );
      assert.deepEqual(pngDimensions(png), [
        1200,
        name === "home-square" ? 1200 : 630,
      ]);
    }
  }
});
