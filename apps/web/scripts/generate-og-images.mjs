import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDirectory, "..");
const outputDirectory = path.join(webRoot, "public", "og");
const siteUrl = process.env.OG_PREVIEW_URL ?? "http://localhost:3000";

const imagePaths = {
  home: path.join(webRoot, "assets", "home", "hero_cutted.jpg"),
  references: path.join(webRoot, "assets", "reference-allmacher.png"),
  logo: path.join(webRoot, "public", "brand", "icon.png"),
};

const metaPaths = {
  home: {
    de: path.join(
      webRoot,
      "src",
      "i18n",
      "dictionaries",
      "marketing",
      "home-meta.de.json",
    ),
    en: path.join(
      webRoot,
      "src",
      "i18n",
      "dictionaries",
      "marketing",
      "home-meta.en.json",
    ),
  },
  references: {
    de: path.join(
      webRoot,
      "src",
      "i18n",
      "dictionaries",
      "marketing",
      "references-meta.de.json",
    ),
    en: path.join(
      webRoot,
      "src",
      "i18n",
      "dictionaries",
      "marketing",
      "references-meta.en.json",
    ),
  },
};

function asDataUrl(buffer, mimeType) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatTitle(title, accentText) {
  const accentIndex = title.lastIndexOf(accentText);

  if (accentIndex < 0) {
    return escapeHtml(title);
  }

  const prefix = title.slice(0, accentIndex);
  return `${escapeHtml(prefix)}<span>${escapeHtml(accentText)}</span>`;
}

function brandMarkup(logoDataUrl) {
  return `
    <div class="brand">
      <img alt="" src="${logoDataUrl}" />
      <strong>Invessiv</strong>
    </div>
    <div class="domain">invessiv.com</div>
  `;
}

function homeMarkup(content, assets) {
  return `
    <main class="canvas canvas-home">
      <img class="home-photo" alt="" src="${assets.home}" />
      <div class="home-shade"></div>
      <div class="grid"></div>
      <div class="orange-glow"></div>
      ${brandMarkup(assets.logo)}
      <section class="copy home-copy">
        <div class="kicker"><i></i>${escapeHtml(content.imageKicker)}</div>
        <h1>${formatTitle(content.imageTitle, content.imageAccentText)}</h1>
        <p>${escapeHtml(content.imageSupportingText)}</p>
        <div class="contact"><i></i><b>Moritz Hecht</b><span>· ${escapeHtml(content.imageContactLabel)}</span></div>
      </section>
    </main>
  `;
}

function referencesMarkup(content, assets) {
  return `
    <main class="canvas canvas-references">
      <div class="grid"></div>
      <div class="orange-glow"></div>
      <div class="blue-glow"></div>
      ${brandMarkup(assets.logo)}
      <section class="copy references-copy">
        <div class="kicker"><i></i>${escapeHtml(content.imageKicker)}</div>
        <h1>${formatTitle(content.imageTitle, content.imageAccentText)}</h1>
        <p>${escapeHtml(content.imageSupportingText)}</p>
      </section>
      <section class="browser" aria-hidden="true">
        <div class="browser-bar">
          <i></i><i></i><i></i>
          <span>allmacher-coaching.de</span>
        </div>
        <div class="browser-image">
          <img alt="" src="${assets.references}" />
        </div>
      </section>
    </main>
  `;
}

const sharedCss = `
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
  body { color: #f8f5f0; background: #171412; font-family: var(--font-plus-jakarta-sans, "Plus Jakarta Sans"), "Segoe UI", sans-serif; }
  .canvas { position: relative; width: 1200px; height: 630px; overflow: hidden; background: #171412; }
  .grid { position: absolute; inset: 0; opacity: .12; background-image: linear-gradient(rgba(255,255,255,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.16) 1px, transparent 1px); background-size: 64px 64px; mask-image: linear-gradient(90deg, #000, transparent 78%); }
  .orange-glow { position: absolute; width: 520px; height: 520px; left: -210px; top: -180px; border-radius: 50%; background: rgba(239, 132, 36, .28); filter: blur(105px); }
  .blue-glow { position: absolute; width: 560px; height: 500px; right: -180px; bottom: -220px; border-radius: 50%; background: rgba(61, 132, 255, .24); filter: blur(115px); }
  .brand { position: absolute; z-index: 5; left: 66px; top: 50px; display: flex; align-items: center; gap: 14px; }
  .brand img { width: 43px; height: 43px; object-fit: contain; }
  .brand strong { font-size: 30px; line-height: 1; letter-spacing: -.035em; }
  .domain { position: absolute; z-index: 5; right: 66px; top: 62px; color: rgba(255,255,255,.7); font-size: 17px; font-weight: 700; letter-spacing: .04em; }
  .copy { position: absolute; z-index: 4; }
  .kicker { display: flex; align-items: center; gap: 13px; color: #ef9c4a; font-size: 17px; font-weight: 800; letter-spacing: .11em; text-transform: uppercase; }
  .kicker i { display: block; width: 34px; height: 2px; border-radius: 2px; background: #ef9c4a; box-shadow: 0 0 18px rgba(239,156,74,.65); }
  h1 { margin: 27px 0 0; font-family: var(--font-bricolage-grotesque, "Bricolage Grotesque"), var(--font-plus-jakarta-sans, "Plus Jakarta Sans"), "Segoe UI", sans-serif; font-size: 61px; font-weight: 760; line-height: .99; letter-spacing: -.052em; text-wrap: balance; }
  h1 span { display: block; color: #77a8ff; text-shadow: 0 8px 34px rgba(75,128,255,.22); }
  .copy > p { margin: 27px 0 0; color: rgba(255,255,255,.78); font-size: 22px; font-weight: 550; line-height: 1.45; }
  .canvas-home .grid { opacity: .09; }
  .home-photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 51%; filter: saturate(.82) contrast(1.02); }
  .home-shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(19,17,16,.98) 0%, rgba(19,17,16,.93) 38%, rgba(19,17,16,.56) 62%, rgba(19,17,16,.14) 82%, rgba(19,17,16,.2) 100%), linear-gradient(180deg, rgba(10,10,10,.34), transparent 35%, rgba(10,10,10,.24)); }
  .home-copy { left: 66px; top: 148px; width: 690px; }
  .home-copy h1 { font-size: 64px; max-width: 680px; }
  .home-copy .contact { display: flex; align-items: center; gap: 9px; margin-top: 20px; color: rgba(255,255,255,.72); font-size: 15px; }
  .home-copy .contact i { width: 7px; height: 7px; border-radius: 50%; background: #ef9c4a; box-shadow: 0 0 16px rgba(239,156,74,.55); }
  .home-copy .contact b { color: #fff; font-size: 16px; }
  .canvas-home .domain { left: 66px; right: auto; top: auto; bottom: 30px; font-size: 15px; }
  .canvas-references { background: radial-gradient(circle at 66% 35%, rgba(255,255,255,.035), transparent 32%), #171412; }
  .references-copy { left: 66px; top: 152px; width: 520px; }
  .references-copy h1 { max-width: 500px; font-size: 50px; line-height: 1.02; }
  .references-copy > p { max-width: 455px; font-size: 20px; }
  .browser { position: absolute; z-index: 3; right: 54px; top: 132px; width: 565px; height: 426px; overflow: hidden; border: 1px solid rgba(119,168,255,.58); border-radius: 23px; background: #242221; box-shadow: 0 36px 80px rgba(0,0,0,.48), 0 0 46px rgba(72,126,237,.11); transform: rotate(1.3deg); }
  .browser::after { content: ""; position: absolute; inset: 0; pointer-events: none; box-shadow: inset 0 1px rgba(255,255,255,.08); }
  .browser-bar { display: grid; grid-template-columns: auto auto auto minmax(0,1fr); align-items: center; gap: 8px; height: 50px; padding: 0 15px; border-bottom: 1px solid rgba(255,255,255,.08); background: linear-gradient(#312e2c, #252321); }
  .browser-bar i { width: 9px; height: 9px; border-radius: 50%; background: #e49b55; }
  .browser-bar i:nth-child(2) { opacity: .72; }
  .browser-bar i:nth-child(3) { opacity: .45; }
  .browser-bar span { overflow: hidden; margin-left: 9px; padding: 7px 13px; border-radius: 999px; background: rgba(255,255,255,.06); color: rgba(255,255,255,.64); font-size: 13px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
  .browser-image { position: relative; width: 100%; height: calc(100% - 50px); overflow: hidden; background: #ece8df; }
  .browser-image img { width: 100%; height: 100%; object-fit: cover; object-position: top center; }
`;

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function renderImage(page, { content, fileName, markup }) {
  await page.goto(`${siteUrl}/de`, { waitUntil: "networkidle" });
  await page.evaluate(
    ({ css, html }) => {
      document.body.innerHTML = html;
      const style = document.createElement("style");
      style.dataset.ogGenerator = "true";
      style.textContent = css;
      document.head.append(style);
    },
    { css: sharedCss, html: markup(content) },
  );
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: path.join(outputDirectory, fileName),
    type: "png",
  });
}

await mkdir(outputDirectory, { recursive: true });

const [homeImage, referenceImage, logoImage] = await Promise.all([
  readFile(imagePaths.home),
  readFile(imagePaths.references),
  readFile(imagePaths.logo),
]);

const assets = {
  home: asDataUrl(homeImage, "image/jpeg"),
  references: asDataUrl(referenceImage, "image/png"),
  logo: asDataUrl(logoImage, "image/png"),
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  deviceScaleFactor: 1,
  viewport: { height: 630, width: 1200 },
});

try {
  for (const locale of ["de", "en"]) {
    const homeContent = await readJson(metaPaths.home[locale]);
    await renderImage(page, {
      content: homeContent,
      fileName: `home-${locale}.png`,
      markup: (content) => homeMarkup(content, assets),
    });

    const referencesContent = await readJson(metaPaths.references[locale]);
    await renderImage(page, {
      content: referencesContent,
      fileName: `references-${locale}.png`,
      markup: (content) => referencesMarkup(content, assets),
    });
  }
} finally {
  await browser.close();
}
