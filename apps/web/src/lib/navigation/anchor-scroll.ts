export function getHashHref(href: string | null) {
  if (!href || !href.startsWith("#") || href.length < 2) {
    return null;
  }

  return href;
}

export function getAnchorScrollTop(
  anchorTop: number,
  currentScrollY: number,
  offset: number,
) {
  return Math.max(0, Math.round(anchorTop + currentScrollY - offset));
}
