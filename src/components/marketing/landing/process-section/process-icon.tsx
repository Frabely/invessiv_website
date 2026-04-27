import type { ProcessIconKey } from "@/i18n/dictionaries/landing/process";

const SVG_PROPS = {
  fill: "none",
  height: 28,
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeWidth: 1.6,
  viewBox: "0 0 24 24",
  width: 28,
  xmlns: "http://www.w3.org/2000/svg",
} as const;

type ProcessIconProps = {
  iconKey: ProcessIconKey;
};

export function ProcessIcon({ iconKey }: ProcessIconProps) {
  switch (iconKey) {
    case "target":
      return (
        <svg {...SVG_PROPS}>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="4.5" />
          <circle cx="12" cy="12" r="1.2" />
        </svg>
      );
    case "structure":
      return (
        <svg {...SVG_PROPS}>
          <rect height="7" rx="1.4" width="7" x="3.5" y="3.5" />
          <rect height="7" rx="1.4" width="7" x="13.5" y="3.5" />
          <rect height="7" rx="1.4" width="7" x="3.5" y="13.5" />
          <rect height="7" rx="1.4" width="7" x="13.5" y="13.5" />
        </svg>
      );
    case "build":
      return (
        <svg {...SVG_PROPS}>
          <path d="M8 8l-4 4 4 4" />
          <path d="M16 8l4 4-4 4" />
          <path d="M14 5l-4 14" />
        </svg>
      );
    case "launch":
      return (
        <svg {...SVG_PROPS}>
          <path d="M5 19c1.5-4 4-7 8-9l4-1.5-1.5 4c-2 4-5 6.5-9 8z" />
          <path d="M5 19l3-3" />
          <circle cx="14.5" cy="9.5" r="1.4" />
        </svg>
      );
  }
}
