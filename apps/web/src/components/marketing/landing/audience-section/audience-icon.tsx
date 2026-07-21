import type { AudienceIconKey } from "@/i18n/dictionaries/landing/audience";

const SVG_PROPS = {
  fill: "none",
  height: 20,
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeWidth: 1.6,
  viewBox: "0 0 24 24",
  width: 20,
  xmlns: "http://www.w3.org/2000/svg",
} as const;

type AudienceIconProps = {
  iconKey: AudienceIconKey;
};

export function AudienceIcon({ iconKey }: AudienceIconProps) {
  switch (iconKey) {
    case "hammer":
      return (
        <svg {...SVG_PROPS}>
          <path d="M14 4l6 6-3 3-6-6z" />
          <path d="M11 7L4 14l3 3 7-7" />
          <path d="M7 17l-3 3" />
        </svg>
      );
    case "coach":
      return (
        <svg {...SVG_PROPS}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5" />
        </svg>
      );
    case "consultant":
      return (
        <svg {...SVG_PROPS}>
          <rect height="13" rx="2" width="18" x="3" y="6.5" />
          <path d="M9 6.5V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" />
          <path d="M3 12h18" />
        </svg>
      );
    case "camera":
      return (
        <svg {...SVG_PROPS}>
          <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
      );
    case "pin":
      return (
        <svg {...SVG_PROPS}>
          <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      );
    case "building":
      return (
        <svg {...SVG_PROPS}>
          <rect height="18" rx="1.5" width="16" x="4" y="3" />
          <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" />
        </svg>
      );
    case "spark":
      return (
        <svg {...SVG_PROPS}>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
        </svg>
      );
    case "scales":
      return (
        <svg {...SVG_PROPS}>
          <path d="M12 4.5v15" />
          <path d="M5.5 8h13" />
          <path d="M8.5 19.5h7" />
          <path d="M3 13h5L5.5 8z" />
          <path d="M16 13h5L18.5 8z" />
        </svg>
      );
    case "clipboard":
      return (
        <svg {...SVG_PROPS}>
          <rect height="15.5" rx="2" width="13" x="5.5" y="5" />
          <path d="M9.5 5V4a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 4v1" />
          <path d="M9.25 13.25l2 2 3.5-3.75" />
        </svg>
      );
    case "calculator":
      return (
        <svg {...SVG_PROPS}>
          <rect height="18" rx="2" width="14" x="5" y="3" />
          <rect height="3" rx="1" width="8" x="8" y="5.5" />
          <path d="M8 12.5h2M14 12.5h2M8 16.5h2M14 16.5h2" />
        </svg>
      );
  }
}
