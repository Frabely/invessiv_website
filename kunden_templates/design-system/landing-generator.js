#!/usr/bin/env node
/*
  Seeded landing generator.
  Usage:
  node kunden_templates/design-system/landing-generator.js --seed "kunde-2026-02-21" --out "kunden_templates/mockups/landing_generated_seed.html"
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const CONFIG_PATH = path.join(__dirname, 'design-config.json');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    args[key] = next && !next.startsWith('--') ? next : true;
    if (args[key] !== true) i += 1;
  }
  return args;
}

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function next() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(a) {
  return function rand() {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weightedPick(list, rand, filterFn = () => true) {
  const valid = list.filter(filterFn);
  if (!valid.length) throw new Error('No valid candidate available for weighted pick.');
  const total = valid.reduce((sum, item) => sum + (item.weight || 1), 0);
  let threshold = rand() * total;
  for (const item of valid) {
    threshold -= item.weight || 1;
    if (threshold <= 0) return item;
  }
  return valid[valid.length - 1];
}

function chooseEffects(config, rand, heroLayoutId) {
  const maxTotal = config.guardrails.maxEffectsTotal;
  const maxStrong = config.guardrails.maxStrongEffects;
  const selected = [];

  const shuffled = [...config.effects].sort(() => rand() - 0.5);

  for (const effect of shuffled) {
    if (selected.length >= maxTotal) break;
    if (effect.allowedHeroLayouts && !effect.allowedHeroLayouts.includes(heroLayoutId)) continue;

    const hasIncompatibility = selected.some((s) =>
      (effect.incompatibleWith || []).includes(s.id) || (s.incompatibleWith || []).includes(effect.id)
    );
    if (hasIncompatibility) continue;

    if (effect.strength === 'strong') {
      const strongCount = selected.filter((e) => e.strength === 'strong').length;
      if (strongCount >= maxStrong) continue;
    }

    const normalized = Math.min(0.85, Math.max(0.1, effect.weight / 100));
    if (rand() <= normalized) selected.push(effect);
  }

  if (!selected.length) {
    const fallback = config.effects.find((e) => e.id === 'stagger-reveal') || config.effects[0];
    if (fallback && (!fallback.allowedHeroLayouts || fallback.allowedHeroLayouts.includes(heroLayoutId))) {
      selected.push(fallback);
    }
  }

  return selected;
}

function chooseOrnaments(config, rand, theme) {
  const maxOrnaments = config.guardrails.maxOrnaments;
  const eligible = config.ornaments.filter((item) =>
    !theme.allowedOrnaments || theme.allowedOrnaments.includes(item.id)
  );

  const chosen = [];
  if (!eligible.length) return chosen;

  chosen.push(weightedPick(eligible, rand));
  if (maxOrnaments > 1 && rand() > 0.55) {
    const second = weightedPick(eligible, rand, (item) => item.id !== chosen[0].id);
    if (second) chosen.push(second);
  }
  return chosen;
}

function generatePlan(config, seed) {
  const seedFn = xmur3(seed);
  const rand = mulberry32(seedFn());

  const theme = weightedPick(config.themes, rand);

  const hero = weightedPick(config.layouts.hero, rand, (item) =>
    !theme.allowedLayouts || theme.allowedLayouts.includes(item.id)
  );
  const trust = weightedPick(config.layouts.trust, rand);
  const pricing = weightedPick(config.layouts.pricing, rand);
  const faq = weightedPick(config.layouts.faq, rand);

  const nav = weightedPick(config.components.nav, rand);
  const card = weightedPick(config.components.card, rand, (item) => {
    if (theme.id === 'dark-glass') return item.id !== 'soft';
    return true;
  });

  const effects = chooseEffects(config, rand, hero.id);
  const ornaments = chooseOrnaments(config, rand, theme);

  return {
    seed,
    theme,
    layout: { hero, trust, pricing, faq },
    components: { nav, card },
    effects,
    ornaments
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildHtml(plan) {
  const t = plan.theme.tokens;
  const effectIds = new Set(plan.effects.map((e) => e.id));
  const ornamentIds = new Set(plan.ornaments.map((o) => o.id));

  const heroClass = `hero hero-${plan.layout.hero.id}`;
  const navClass = `nav nav-${plan.components.nav.id}`;
  const cardClass = `card card-${plan.components.card.id}`;

  const enableParallax = effectIds.has('parallax-hero');
  const enableStickyCtaBar = effectIds.has('sticky-cta-bar');
  const enableStaggerReveal = effectIds.has('stagger-reveal');
  const enableScrollProgress = effectIds.has('scroll-progress');
  const enableTiltCards = effectIds.has('tilt-cards');

  const trustTitle = {
    metrics: 'Trust durch klare Kennzahlen',
    testimonials: 'Trust durch Stimmen und Resultate',
    timeline: 'Trust durch nachvollziehbaren Delivery-Track'
  }[plan.layout.trust.id];

  const pricingTitle = {
    'three-cards': 'Transparente Pakete fuer jedes Reifestadium',
    comparison: 'Leistungsvergleich auf einen Blick',
    steps: 'Klarer Einstieg in drei Stufen'
  }[plan.layout.pricing.id];

  const faqWrapTag = plan.layout.faq.id === 'accordion' ? 'details' : 'article';

  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>invessiv | Seeded Landing ${escapeHtml(plan.seed)}</title>
  <meta name="description" content="Seed-basierte Landing-Variante mit stimmiger Design-DNA, CTA-Fokus und klarer Conversion-Struktur." />
  <meta property="og:title" content="invessiv Seeded Landing" />
  <meta property="og:description" content="Dynamisch generiertes Mockup mit kompatiblen Layout- und Effektmodulen." />
  <meta property="og:type" content="website" />
  <style>
    :root {
      --bg: ${t.bg};
      --surface: ${t.surface};
      --surface2: ${t.surface2};
      --text: ${t.text};
      --muted: ${t.muted};
      --line: ${t.line};
      --primary: ${t.primary};
      --primary-strong: ${t.primaryStrong};
      --accent: ${t.accent};
      --radius: ${t.radius};
      --max: 1120px;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: ${t.font};
      color: var(--text);
      background: var(--bg);
      line-height: 1.55;
      overflow-x: hidden;
    }
    body.ornament-soft-grid::before,
    body.ornament-mesh::before,
    body.ornament-blobs::before,
    body.ornament-noise::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: -1;
    }
    body.ornament-soft-grid::before {
      background-image: linear-gradient(to right, rgba(127,127,127,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(127,127,127,0.07) 1px, transparent 1px);
      background-size: 36px 36px;
    }
    body.ornament-mesh::before {
      background: radial-gradient(circle at 10% -5%, rgba(255,255,255,0.24), transparent 42%), radial-gradient(circle at 100% 0%, rgba(255,255,255,0.13), transparent 46%);
    }
    body.ornament-blobs::before {
      background: radial-gradient(900px 360px at 0% 0%, color-mix(in srgb, var(--primary) 18%, transparent), transparent 66%), radial-gradient(720px 320px at 100% 5%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 68%);
    }
    body.ornament-noise::before {
      background-image: repeating-radial-gradient(circle at 0 0, transparent 0, rgba(255,255,255,0.03) 1px, transparent 2px, transparent 8px);
    }

    .container { width: min(100% - 2rem, var(--max)); margin: 0 auto; }
    .site-header { position: sticky; top: 0; z-index: 70; backdrop-filter: blur(8px); border-bottom: 1px solid var(--line); background: color-mix(in srgb, var(--bg) 88%, transparent); }
    .header-row { min-height: 72px; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .brand { display: inline-flex; align-items: center; gap: .65rem; text-decoration: none; color: inherit; font-weight: 800; letter-spacing: .01em; }
    .logo-mark { width: 34px; height: 34px; border-radius: 11px; background: linear-gradient(145deg, var(--primary), var(--accent)); box-shadow: 0 10px 20px color-mix(in srgb, var(--primary) 28%, transparent); }

    .${navClass} { display: flex; gap: .6rem; list-style: none; margin: 0; padding: 0; flex-wrap: wrap; }
    .nav a { text-decoration: none; color: var(--muted); font-weight: 700; padding: .42rem .62rem; border-radius: 10px; }
    .nav-pill a { background: color-mix(in srgb, var(--surface2) 70%, transparent); border: 1px solid var(--line); }

    .btn { border: 0; border-radius: 999px; min-height: 46px; padding: .74rem 1.12rem; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; font-weight: 800; cursor: pointer; transition: transform .2s ease, box-shadow .2s ease; }
    .btn:hover { transform: translateY(-1px); }
    .btn-primary { background: linear-gradient(135deg, var(--primary), var(--primary-strong)); color: #fff; box-shadow: 0 10px 24px color-mix(in srgb, var(--primary-strong) 42%, transparent); }
    .btn-secondary { background: var(--surface); color: var(--primary-strong); border: 1px solid var(--line); }

    .hero { padding: 3.2rem 0 2.2rem; position: relative; }
    .hero-inner { display: grid; gap: 1rem; }
    .hero-split .hero-inner { grid-template-columns: 1.1fr .9fr; }
    .hero-centered .hero-inner { grid-template-columns: 1fr; text-align: center; }
    .hero-editorial .hero-inner { grid-template-columns: 1fr; }
    .hero-immersive .hero-inner { grid-template-columns: 1fr; }
    .hero-copy h1 { margin: .72rem 0 .8rem; line-height: 1.08; font-size: clamp(1.9rem, 4.8vw, 3.25rem); max-width: 17ch; }
    .hero-centered .hero-copy h1,
    .hero-editorial .hero-copy h1,
    .hero-immersive .hero-copy h1 { max-width: 20ch; margin-inline: auto; }
    .hero-copy p { margin: 0; color: var(--muted); max-width: 60ch; }
    .hero-centered .hero-copy p,
    .hero-editorial .hero-copy p,
    .hero-immersive .hero-copy p { margin-inline: auto; }
    .eyebrow { display: inline-flex; border-radius: 999px; font-size: .82rem; text-transform: uppercase; letter-spacing: .08em; font-weight: 800; background: color-mix(in srgb, var(--primary) 12%, transparent); color: var(--primary); padding: .28rem .62rem; }
    .hero-actions { display: flex; gap: .65rem; flex-wrap: wrap; margin-top: 1rem; }
    .hero-centered .hero-actions,
    .hero-editorial .hero-actions,
    .hero-immersive .hero-actions { justify-content: center; }

    .hero-panel {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      padding: 1rem;
      box-shadow: 0 12px 30px color-mix(in srgb, var(--text) 10%, transparent);
      align-self: stretch;
    }

    .${cardClass} { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); padding: 1rem; }
    .card-soft { box-shadow: 0 10px 26px color-mix(in srgb, var(--text) 10%, transparent); }
    .card-outline { box-shadow: none; border-width: 2px; }
    .card-glass { background: color-mix(in srgb, var(--surface) 78%, transparent); backdrop-filter: blur(7px); }

    .section { padding: 2.3rem 0; }
    .section h2 { margin: 0 0 .45rem; font-size: clamp(1.4rem, 3vw, 2.1rem); line-height: 1.18; }
    .section-intro { margin: 0; color: var(--muted); max-width: 66ch; }
    .grid { display: grid; gap: .9rem; margin-top: 1rem; grid-template-columns: repeat(3, minmax(0,1fr)); }

    .pricing-grid { display: grid; gap: .9rem; margin-top: 1rem; grid-template-columns: repeat(3, minmax(0,1fr)); }
    .pricing-card.featured { border-color: var(--primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 20%, transparent); }
    .price { font-size: 2rem; font-weight: 900; line-height: 1.05; margin: .3rem 0 .7rem; }

    .faq-grid { display: grid; gap: .9rem; margin-top: 1rem; grid-template-columns: repeat(2, minmax(0,1fr)); }
    details.card summary { cursor: pointer; font-weight: 700; }

    .contact-grid { display: grid; gap: .9rem; margin-top: 1rem; grid-template-columns: repeat(2, minmax(0,1fr)); }

    .mock-note { background: color-mix(in srgb, var(--accent) 22%, #fff); border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent); color: color-mix(in srgb, var(--text) 68%, #000); padding: .58rem .68rem; border-radius: 10px; font-size: .92rem; }

    .sticky-cta-bar {
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      bottom: .65rem;
      width: min(100% - 1rem, 550px);
      display: flex;
      gap: .5rem;
      padding: .55rem;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: color-mix(in srgb, var(--surface) 90%, transparent);
      backdrop-filter: blur(9px);
      z-index: 88;
    }
    .sticky-cta-bar .btn { flex: 1; min-height: 42px; font-size: .93rem; }

    .scroll-progress {
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      width: 0;
      z-index: 99;
      background: linear-gradient(90deg, var(--primary), var(--accent));
      transform-origin: 0 50%;
    }

    .reveal { opacity: 0; transform: translateY(16px); }
    .reveal.is-visible { opacity: 1; transform: translateY(0); transition: opacity .5s ease, transform .5s ease; }

    a:focus-visible, button:focus-visible, input:focus-visible, textarea:focus-visible, summary:focus-visible {
      outline: 3px solid var(--accent);
      outline-offset: 2px;
    }

    footer { margin-top: 1rem; border-top: 1px solid var(--line); padding: 1.4rem 0 2rem; }
    .footer-row { display: flex; align-items: center; justify-content: space-between; gap: .8rem; flex-wrap: wrap; color: var(--muted); }
    .footer-links { display: flex; gap: .65rem; flex-wrap: wrap; }

    @media (max-width: 980px) {
      .hero-split .hero-inner,
      .grid,
      .pricing-grid,
      .faq-grid,
      .contact-grid { grid-template-columns: 1fr; }
      .nav { display: none; }
    }

    @media (prefers-reduced-motion: reduce) {
      * { transition: none !important; animation: none !important; }
      .reveal { opacity: 1; transform: none; }
    }
  </style>
</head>
<body class="${[...ornamentIds].map((id) => `ornament-${id}`).join(' ')}">
  ${enableScrollProgress ? '<div class="scroll-progress" aria-hidden="true"></div>' : ''}

  <header class="site-header">
    <div class="container header-row">
      <a href="#top" class="brand" id="top" aria-label="invessiv Startseite">
        <span class="logo-mark" aria-hidden="true"></span>
        <span>invessiv</span>
      </a>
      <nav aria-label="Hauptnavigation">
        <ul class="${navClass}">
          <li><a href="#angebot">Angebot</a></li>
          <li><a href="#trust">Trust</a></li>
          <li><a href="#preise">Preise</a></li>
          <li><a href="#faq">FAQ</a></li>
          <li><a href="#kontakt">Kontakt</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main>
    <section class="${heroClass}">
      <div class="container hero-inner">
        <div class="hero-copy ${enableParallax ? 'parallax-layer' : ''}" data-depth="0.18">
          <span class="eyebrow">Seed: ${escapeHtml(plan.seed)} • Theme: ${escapeHtml(plan.theme.label)}</span>
          <h1>Landing-Designs, die konsistent konvertieren und sich bei jedem Run sichtbar unterscheiden.</h1>
          <p>Diese Variante wurde regelbasiert generiert: Theme, Layout, Motion und Ornament folgen einer Kompatibilitaetsmatrix statt blindem Zufall.</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="#kontakt">Kostenloses Erstgespraech buchen</a>
            <a class="btn btn-secondary" href="#kontakt">Projekt anfragen</a>
          </div>
        </div>
        <aside class="hero-panel ${enableParallax ? 'parallax-layer' : ''}" data-depth="0.11">
          <strong>Aktive Design-DNA</strong>
          <ul>
            <li>Hero: ${escapeHtml(plan.layout.hero.id)}</li>
            <li>Trust: ${escapeHtml(plan.layout.trust.id)}</li>
            <li>Pricing: ${escapeHtml(plan.layout.pricing.id)}</li>
            <li>FAQ: ${escapeHtml(plan.layout.faq.id)}</li>
            <li>Effects: ${escapeHtml(plan.effects.map((e) => e.id).join(', ') || 'none')}</li>
          </ul>
        </aside>
      </div>
    </section>

    <section id="angebot" class="section reveal">
      <div class="container">
        <h2>Angebot mit Preview-Logik</h2>
        <p class="section-intro">Section-Varianten bleiben austauschbar, aber die Informationsarchitektur bleibt stabil: Nutzen, Angebot, Trust, Kaufoption, FAQ, Kontakt.</p>
        <div class="grid">
          <article class="${cardClass}">
            <h3>Template Preview A</h3>
            <p>Module: Hero + Problem/Solution + CTA.</p>
            <p><a href="#">example1.md</a></p>
          </article>
          <article class="${cardClass}">
            <h3>Template Preview B</h3>
            <p>Module: Pricing + FAQ + Kontakt.</p>
            <p><a href="#">example2.md</a></p>
          </article>
          <article class="${cardClass}">
            <h3>Checkout Connector</h3>
            <p>Payment ist im Mock sichtbar, aber eindeutig als Mock gekennzeichnet.</p>
            <p class="mock-note">Kein echter Zahlungsstatus in HTML-only Varianten.</p>
          </article>
        </div>
      </div>
    </section>

    <section id="trust" class="section reveal">
      <div class="container">
        <h2>${escapeHtml(trustTitle)}</h2>
        <p class="section-intro">Trust-Module werden pro Run getauscht, ohne die CTA-Priorisierung aufzubrechen.</p>
        <div class="grid">
          <article class="${cardClass}"><h3>+31% mehr qualifizierte Calls</h3><p>Mock-Wert, klar markiert.</p></article>
          <article class="${cardClass}"><h3>1.8x CTA-Rate</h3><p>Vergleich vor/nach Relaunch.</p></article>
          <article class="${cardClass}"><h3>14 Tage bis Go-Live</h3><p>Typischer Delivery-Slot.</p></article>
        </div>
      </div>
    </section>

    <section id="preise" class="section reveal">
      <div class="container">
        <h2>${escapeHtml(pricingTitle)}</h2>
        <p class="section-intro">Pricing-Darstellung ist variabel, Preislogik bleibt immer transparent und CTA-klar.</p>
        <div class="pricing-grid">
          <article class="${cardClass} pricing-card"><h3>Starter</h3><p class="price">199 EUR</p><a href="#" class="btn btn-secondary">Jetzt kaufen (Mock)</a></article>
          <article class="${cardClass} pricing-card featured"><h3>Growth</h3><p class="price">499 EUR</p><a href="#kontakt" class="btn btn-primary">Kostenloses Erstgespraech buchen</a></article>
          <article class="${cardClass} pricing-card"><h3>Scale</h3><p class="price">1.190 EUR</p><a href="#kontakt" class="btn btn-secondary">Projekt anfragen</a></article>
        </div>
      </div>
    </section>

    <section id="faq" class="section reveal">
      <div class="container">
        <h2>FAQ</h2>
        <p class="section-intro">Einwaende werden strukturiert beantwortet und direkt in den Kontaktweg gefuehrt.</p>
        <div class="faq-grid">
          <${faqWrapTag} class="${cardClass}">
            ${plan.layout.faq.id === 'accordion' ? '<summary>Warum wirkt das trotz Variation konsistent?</summary>' : '<h3>Warum wirkt das trotz Variation konsistent?</h3>'}
            <p>Weil der Generator nur kompatible Kombinationen auswaehlt und harte Guardrails nutzt.</p>
          </${faqWrapTag}>
          <${faqWrapTag} class="${cardClass}">
            ${plan.layout.faq.id === 'accordion' ? '<summary>Kann Parallax abgeschaltet werden?</summary>' : '<h3>Kann Parallax abgeschaltet werden?</h3>'}
            <p>Ja. Entweder per Seed oder per Regelprofil (z. B. conservative-only).</p>
          </${faqWrapTag}>
        </div>
      </div>
    </section>

    <section id="kontakt" class="section reveal">
      <div class="container">
        <h2>Kontakt</h2>
        <p class="section-intro">Direkter Kontaktweg bleibt Pflichtbestandteil in jeder Variante.</p>
        <div class="contact-grid">
          <article class="${cardClass}">
            <h3>Termin buchen</h3>
            <p><a href="https://calendly.com/your-link" target="_blank" rel="noreferrer" class="btn btn-primary">Kostenloses Erstgespraech buchen</a></p>
            <p><a href="mailto:kontakt@invessiv.example">kontakt@invessiv.example</a></p>
          </article>
          <article class="${cardClass}">
            <h3>Projekt anfragen</h3>
            <p class="mock-note">Form-Submit bleibt in HTML-Mockups als Mock markiert.</p>
            <p><a href="#" class="btn btn-secondary">Projekt anfragen</a></p>
          </article>
        </div>
      </div>
    </section>
  </main>

  <footer>
    <div class="container footer-row">
      <span>Generated by design-system | seed: ${escapeHtml(plan.seed)}</span>
      <span class="footer-links">
        <a href="#">Impressum</a>
        <a href="#">Datenschutz</a>
        <a href="#">AGB</a>
        <a href="#">Widerruf</a>
      </span>
    </div>
  </footer>

  ${enableStickyCtaBar ? `<div class="sticky-cta-bar" aria-label="Schnellkontakt">
    <a class="btn btn-primary" href="#kontakt">Kostenloses Erstgespraech buchen</a>
    <a class="btn btn-secondary" href="#kontakt">Projekt anfragen</a>
  </div>` : ''}

  <script>
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    ${enableStaggerReveal ? `if (!prefersReducedMotion) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible');
        });
      }, { threshold: 0.18 });
      document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
    } else {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    }` : 'document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));'}

    ${enableScrollProgress ? `const progress = document.querySelector('.scroll-progress');
    const updateProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? (window.scrollY / max) : 0;
      progress.style.width = (ratio * 100).toFixed(2) + '%';
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });` : ''}

    ${enableParallax ? `if (!prefersReducedMotion) {
      const layers = document.querySelectorAll('.parallax-layer');
      const onMove = () => {
        const y = window.scrollY;
        layers.forEach((layer) => {
          const depth = Number(layer.dataset.depth || 0.1);
          layer.style.transform = 'translateY(' + (y * depth * -0.2).toFixed(2) + 'px)';
        });
      };
      onMove();
      window.addEventListener('scroll', onMove, { passive: true });
    }` : ''}

    ${enableTiltCards ? `if (!prefersReducedMotion) {
      const cards = document.querySelectorAll('.pricing-card');
      cards.forEach((card) => {
        card.addEventListener('mousemove', (event) => {
          const rect = card.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width - 0.5;
          const py = (event.clientY - rect.top) / rect.height - 0.5;
          card.style.transform = 'rotateX(' + (-py * 3).toFixed(2) + 'deg) rotateY(' + (px * 4).toFixed(2) + 'deg)';
        });
        card.addEventListener('mouseleave', () => {
          card.style.transform = 'rotateX(0deg) rotateY(0deg)';
        });
      });
    }` : ''}
  </script>
</body>
</html>`;
}

function run() {
  const args = parseArgs(process.argv);
  const seed = String(args.seed || `seed-${new Date().toISOString().slice(0, 10)}`);
  const outArg = String(args.out || `kunden_templates/mockups/landing_generated_${seed.replace(/[^a-zA-Z0-9_-]/g, '-')}.html`);
  const outPath = path.isAbsolute(outArg) ? outArg : path.join(ROOT, outArg);

  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const plan = generatePlan(config, seed);
  const html = buildHtml(plan);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf8');

  const summary = {
    output: outPath,
    seed: plan.seed,
    theme: plan.theme.id,
    hero: plan.layout.hero.id,
    trust: plan.layout.trust.id,
    pricing: plan.layout.pricing.id,
    faq: plan.layout.faq.id,
    nav: plan.components.nav.id,
    card: plan.components.card.id,
    effects: plan.effects.map((e) => e.id),
    ornaments: plan.ornaments.map((o) => o.id)
  };

  process.stdout.write(JSON.stringify(summary, null, 2));
}

run();
