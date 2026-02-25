type ServiceCardIconProps = {
  iconAlt?: string;
  iconSrc?: string;
};

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 1.8,
};

function LandingIcon() {
  return (
    <svg aria-hidden="true" className="services-title-icon-image" viewBox="0 0 24 24">
      <rect {...stroke} height="14" rx="3" width="20" x="2" y="5" />
      <path {...stroke} d="M6.5 10h5m-5 4h11" />
      <circle cx="18" cy="10" fill="currentColor" r="1.1" />
    </svg>
  );
}

function WebsiteIcon() {
  return (
    <svg aria-hidden="true" className="services-title-icon-image" viewBox="0 0 24 24">
      <path {...stroke} d="M3 7.5h18M8 7.5l1.8 12M16 7.5l-1.8 12" />
      <path {...stroke} d="M5 7.5 7 19h10l2-11.5" />
      <path {...stroke} d="M10 13h4M9.5 16h5" />
    </svg>
  );
}

function ToolsIcon() {
  return (
    <svg aria-hidden="true" className="services-title-icon-image" viewBox="0 0 24 24">
      <path {...stroke} d="M8 6.5a2.5 2.5 0 1 1 2.1 4l6.6 6.6a1.6 1.6 0 1 1-2.3 2.3l-6.6-6.6A2.5 2.5 0 1 1 8 6.5Z" />
      <path {...stroke} d="m14.8 5.6 3.6-1 .9 3.5-3.5 1z" />
    </svg>
  );
}

function UpgradeIcon() {
  return (
    <svg aria-hidden="true" className="services-title-icon-image" viewBox="0 0 24 24">
      <path {...stroke} d="M6 12a6 6 0 1 0 1.8-4.3" />
      <path {...stroke} d="M6 6v3.8h3.8" />
      <path {...stroke} d="m11.2 9.8 2.4 2.4 3.2-3.2" />
    </svg>
  );
}

function AiIcon() {
  return (
    <svg aria-hidden="true" className="services-title-icon-image" viewBox="0 0 24 24">
      <rect {...stroke} height="16" rx="4" width="16" x="4" y="4" />
      <path {...stroke} d="M9 14.5 12 8l3 6.5M10.2 12h3.6" />
      <path {...stroke} d="M12 2v2M12 20v2M2 12h2M20 12h2" />
    </svg>
  );
}

const renderIcon = (iconSrc?: string) => {
  if (!iconSrc) {
    return <LandingIcon />;
  }
  if (iconSrc.includes("02_") || iconSrc.includes("websites")) {
    return <WebsiteIcon />;
  }
  if (iconSrc.includes("03_") || iconSrc.includes("tools")) {
    return <ToolsIcon />;
  }
  if (iconSrc.includes("04_") || iconSrc.includes("upgrade")) {
    return <UpgradeIcon />;
  }
  if (iconSrc.includes("05_") || iconSrc.includes("ai")) {
    return <AiIcon />;
  }
  return <LandingIcon />;
};

export function ServiceCardIcon({ iconAlt, iconSrc }: ServiceCardIconProps) {
  const ariaLabel = iconAlt ?? "Service icon";

  return (
    <span aria-label={ariaLabel} className="services-title-icon" role="img">
      {renderIcon(iconSrc)}
    </span>
  );
}
