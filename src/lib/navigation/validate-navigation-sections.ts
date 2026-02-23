type ValidationInput = {
  navigationHrefs: string[];
  sectionIds: string[];
};

type ValidationResult = {
  hasCompleteMapping: boolean;
  missingInSections: string[];
  missingInNavigation: string[];
};

export function validateNavigationSections({
  navigationHrefs,
  sectionIds,
}: ValidationInput): ValidationResult {
  const normalizedSections = new Set(sectionIds.map((id) => `#${id}`));
  const normalizedNavigation = new Set(navigationHrefs);

  const missingInSections = navigationHrefs.filter(
    (href) => !normalizedSections.has(href),
  );

  const missingInNavigation = sectionIds
    .map((id) => `#${id}`)
    .filter((href) => !normalizedNavigation.has(href));

  return {
    hasCompleteMapping:
      missingInSections.length === 0 && missingInNavigation.length === 0,
    missingInSections,
    missingInNavigation,
  };
}
