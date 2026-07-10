export const HERO_ZOOM_STATE = {
  Pending: "pending",
  Idle: "idle",
  Pinned: "pinned",
  Native: "native",
} as const;

export type HeroZoomState =
  (typeof HERO_ZOOM_STATE)[keyof typeof HERO_ZOOM_STATE];

export const HERO_ZOOM_STAGE_STATE_ATTRIBUTE = "data-zoom-state";

export const HERO_ZOOM_PLACEHOLDER_ATTRIBUTE = "data-hero-zoom-placeholder";

export const HERO_ZOOM_CHROME_ATTRIBUTE = "data-hero-zoom-chrome";

export const HERO_ZOOM_REPIN_PROGRESS = 0.999;

/**
 * Abstand (px) zwischen der Oberkante von `#solution` und der Viewport-Oberkante,
 * sobald der Zoom abgeschlossen ist. Gibt der Problem-Lösung-Sektion am Ende der
 * Animation Luft nach oben, statt sie an die Bildschirmkante zu drücken.
 */
export const HERO_ZOOM_HANDOFF_MARGIN_PX = 120;

export const HERO_ZOOM_ACTIVATION_MAX_SCROLL_RATIO = 0.5;

export const HERO_ZOOM_FRAME_RADIUS_PX = 20;

export type HeroZoomProgressRange = {
  readonly start: number;
  readonly end: number;
};

export const HERO_ZOOM_HERO_FADE_RANGE: HeroZoomProgressRange = {
  start: 0.6,
  end: 0.85,
};

export const HERO_ZOOM_BACKDROP_FADE_RANGE: HeroZoomProgressRange = {
  start: 0.85,
  end: 0.98,
};

/**
 * Fade-Fenster des Browser-Mockup-Rahmens um die Mini-Webseite. Endet bewusst
 * vor p=1, damit der Rahmen vollständig verschwunden ist, sobald die Seite
 * volle Größe erreicht.
 */
export const HERO_ZOOM_CHROME_FADE_RANGE: HeroZoomProgressRange = {
  start: 0.65,
  end: 0.9,
};
