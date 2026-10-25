import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";

const webRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const publicRoot = path.join(webRoot, "public");
const { logo } = JSON.parse(
  await readFile(
    path.join(
      webRoot,
      "../../packages/common/src/constants/brand/brand-assets.json",
    ),
    "utf8",
  ),
);
const logoSource = await readFile(path.join(publicRoot, logo.src), "utf8");
const background = await readFile(
  path.join(webRoot, "assets/brand/favicon-background.png"),
);

function renderIcon(size) {
  // Keep the entire SVG viewBox, including the offset dot, inside a circular crop.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
    <image href="data:image/png;base64,${background.toString("base64")}" width="1024" height="1024" preserveAspectRatio="xMidYMid slice"/>
    <image href="data:image/svg+xml;base64,${Buffer.from(logoSource).toString("base64")}" x="143" y="194" width="738" height="636" preserveAspectRatio="xMidYMid meet"/>
  </svg>`;
  return new Resvg(svg).render().asPng();
}

function createIco(entries) {
  const header = Buffer.alloc(6 + entries.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  let offset = header.length;
  entries.forEach(({ size, png }, index) => {
    const entry = 6 + index * 16;
    header[entry] = size === 256 ? 0 : size;
    header[entry + 1] = header[entry];
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...entries.map(({ png }) => png)]);
}

for (const size of [32, 48, 192, 512]) {
  await writeFile(
    path.join(publicRoot, `favicon-${size}x${size}.png`),
    renderIcon(size),
  );
}
for (const [file, size] of [
  ["favicon.png", 512],
  ["apple-touch-icon.png", 180],
  ["brand/icon.png", 1024],
  ["brand/icon_noText.png", 1024],
]) {
  await writeFile(path.join(publicRoot, file), renderIcon(size));
}
await writeFile(
  path.join(publicRoot, "favicon.ico"),
  createIco([16, 32, 48, 256].map((size) => ({ size, png: renderIcon(size) }))),
);
console.info(
  "Generated favicon, Apple/PWA icons and square brand logos from",
  logo.src,
);
