# Quellen und Inspirations-Mapping

Hinweis: Die Mockups sind bewusst reduzierte Neuimplementierungen zur Ideenfindung, keine 1:1 Kopien.

## Primäre Referenzen

- Stripe Homepage: https://stripe.com/
- Apple iPhone Landing (Produktseite / Scroll Storytelling): https://www.apple.com/iphone/
- Linear Homepage: https://linear.app/
- Vercel Homepage: https://vercel.com/
- Awwwards Inspirationsbeispiele (Scroll-/Motion-Patterns):
  - https://www.awwwards.com/inspiration/simple-process-landing-page-with-engaging-scrolling-animation-apex-countertops
  - https://www.awwwards.com/inspiration/landing-page-animation-david-heckhoff-portfolio
  - https://www.awwwards.com/websites/animation/

## Unterstützende technische Referenzen

- Wave Gradient (Stripe-inspirierter Gradient-Effekt, OSS): https://github.com/sa3dany/wave-gradient
- Aurora Gradient (Gradient/Noise Referenz): https://auroragradient.com/
- SVG Path Tutorial (Grundlage fuer Path-Journey): https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
- SVG `stroke-dasharray` (Line-Draw Technik): https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/stroke-dasharray
- SVG `stroke-dashoffset` (Progress-Animation): https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/stroke-dashoffset
- Scroll-driven Animation APIs (Browser-Standard): https://developer.chrome.com/docs/css-ui/scroll-driven-animations
- Material Design Bottom Sheets (Mobile Pattern): https://m1.material.io/components/bottom-sheets.html
- High Performance CSS Animation (Browser Guidance): https://web.dev/articles/animations-guide
- Reduced Motion Media Query (A11y): https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- CSS Scroll Snap (native narrative panels): https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll_snap
- View Transitions API: https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
- Canvas API (2D rendering basics): https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API

## Effekt -> Quelle

1. Aurora Gradient Hero -> Stripe, Vercel, wave-gradient
2. Scroll-Depth Reveal -> Apple iPhone Seiten-Narrative, Awwwards Process Scroll
3. Cursor Spotlight Cards -> Linear Interaktionsstil, moderne Agentur-Landings
4. Magnetic CTA -> Awwwards Interaktionsmuster
5. Masked Text Reveal -> Apple/Editorial Launch Pages
6. Floating Glass UI -> Vercel/aktuelles SaaS-Motion-Design
7. SVG Path Journey -> MDN SVG Path/Stroke-Dash + Awwwards Motion-Landing Referenzen
8. Mobile Bottom Sheet Snap -> Material Bottom Sheets + web.dev Animation Performance + MDN Reduced Motion
9. Tilt Cards 3D -> Motion Lab Pattern (pointer tilt cards)
10. Scroll Snap Story Panels -> MDN CSS Scroll Snap + Motion Lab Pattern
11. Canvas Particle Drift -> MDN Canvas API + Motion Lab Pattern
12. View Transition Routing -> MDN View Transitions API + Motion Lab Pattern
13. Shimmer Hover -> Motion Lab Pattern (CSS Light Sweep)
14. 3D Tilt Glass Shine -> animation_mockups/mockups/03-3d-tilt-glass.html
15. Scroll Reveal Stagger -> animation_mockups/mockups/04-scroll-reveal-stagger.html
16. SVG Self-Drawing Path -> animation_mockups/mockups/07-svg-path-draw.html
17. Gradient Border Grain -> animation_mockups/mockups/08-gradient-border-grain.html
18. Clip-Path Hover Reveal -> animation_mockups/mockups/10-clip-path-reveal.html
19. Infinite Logo Marquee -> animation_mockups/mockups/11-infinite-marquee.html
20. Toggle Morph Microinteraction -> animation_mockups/mockups/12-toggle-microinteraction.html

## Einsatzhinweise

- Alle Effekte sind absichtlich kurz und modular gehalten, damit sie als Prompt-/Code-Bausteine fuer groessere Seiten verwendbar sind.
- Fuer produktive Nutzung zuerst auf Mobile testen, `prefers-reduced-motion` respektieren und Kontrast pruefen.
