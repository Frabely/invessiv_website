export interface LinkedInDomProfile {
  displayName: string | null;
  headline: string | null;
  about: string | null;
  currentPosition: string | null;
  activity: string[];
}

/**
 * Wird per chrome.scripting.executeScript in den Profil-Tab injiziert und dafür
 * zu einem String serialisiert. Deshalb muss die Funktion vollständig
 * eigenständig sein — keine Referenzen auf Modul-Scope.
 */
export function readLinkedInProfileFromDom(): LinkedInDomProfile {
  const text = (element: Element | null | undefined): string | null => {
    const value = element?.textContent?.replace(/\s+/g, " ").trim();
    return value && value.length > 0 ? value : null;
  };

  const firstMatch = (selectors: string[]): string | null => {
    for (const selector of selectors) {
      const value = text(document.querySelector(selector));
      if (value) {
        return value;
      }
    }
    return null;
  };

  const displayName = firstMatch([
    "main h1",
    "h1.text-heading-xlarge",
    "section h1",
  ]);

  const headline = firstMatch([
    "main .text-body-medium.break-words",
    "main div.text-body-medium",
  ]);

  const readSection = (anchorId: string): string | null => {
    const anchor = document.getElementById(anchorId);
    const section = anchor?.closest("section");
    if (!section) {
      return null;
    }

    const spans = Array.from(
      section.querySelectorAll<HTMLElement>('span[aria-hidden="true"]'),
    )
      .map((span) => span.textContent?.replace(/\s+/g, " ").trim() ?? "")
      .filter((value) => value.length > 0);

    const joined = spans.join(" ").trim();
    return joined.length > 0 ? joined : text(section);
  };

  const about = readSection("about");
  const experience = readSection("experience");

  const activity = Array.from(
    document.querySelectorAll<HTMLElement>(
      '.pv-recent-activity-item__meta, .feed-shared-update-v2__description, [data-urn*="activity"] .break-words',
    ),
  )
    .map((element) => element.textContent?.replace(/\s+/g, " ").trim() ?? "")
    .filter((value) => value.length > 20)
    .slice(0, 5);

  return {
    displayName,
    headline,
    about,
    currentPosition: experience,
    activity,
  };
}
