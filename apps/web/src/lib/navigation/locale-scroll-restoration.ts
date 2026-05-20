export const LOCALE_SCROLL_RESTORE_STORAGE_KEY =
  "invessiv-locale-scroll-restore";

export type LocaleScrollRestoreState = {
  url: string;
  x: number;
  y: number;
};

export function getLocationUrl(pathname: string, search = "") {
  return `${pathname}${search}`;
}

export function createLocaleScrollRestoreState(
  url: string,
  x: number,
  y: number,
) {
  return JSON.stringify({ url, x, y } satisfies LocaleScrollRestoreState);
}

export function parseLocaleScrollRestoreState(
  serializedState: string | null,
): LocaleScrollRestoreState | null {
  if (!serializedState) {
    return null;
  }

  try {
    const parsedState = JSON.parse(
      serializedState,
    ) as Partial<LocaleScrollRestoreState>;

    if (
      typeof parsedState.url !== "string" ||
      typeof parsedState.x !== "number" ||
      typeof parsedState.y !== "number"
    ) {
      return null;
    }

    return {
      url: parsedState.url,
      x: parsedState.x,
      y: parsedState.y,
    };
  } catch {
    return null;
  }
}

export function matchesLocaleScrollRestoreState(
  state: LocaleScrollRestoreState,
  locationLike: Pick<Location, "pathname" | "search">,
) {
  return (
    state.url === getLocationUrl(locationLike.pathname, locationLike.search)
  );
}
