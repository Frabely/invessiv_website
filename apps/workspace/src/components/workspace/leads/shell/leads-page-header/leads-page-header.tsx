"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRotateLeft,
  faChevronDown,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { DateRangeFilter } from "@/components/workspace/shared/date-range-filter/date-range-filter";
import { LeadListQueryParam } from "@/common/constants/leads/list/lead-list-query-params";
import type { LeadCategoryOption } from "@/common/contracts/leads/lead-category-option";
import type { LeadProfileType as LeadProfileTypeValue } from "@/common/constants/leads/profile/lead-profile-types";
import { useLeadsTableTransition } from "@/hooks/workspace/use-leads-table-transition";
import {
  cycleProfileFilter,
  readProfileFilterSelection,
  serializeProfileFilterList,
} from "@/lib/workspace/leads/lead-profile-filter";
import type {
  LeadsImportDictionary,
  LeadsSharedDictionary,
  LeadsShellDictionary,
  LeadsToolbarDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import { useNavigationContext } from "@/hooks/workspace/use-navigation-context";
import {
  ButtonControl,
  PrimaryCtaButton,
} from "@/components/shared/button/button";
import { ImportLeadsDialog } from "@/components/workspace/leads/import/import-leads-dialog/import-leads-dialog";
import { buildLeadHref } from "@/components/workspace/leads/table/lead-table-utils";
import { LeadCategoryFilter } from "@/components/workspace/leads/toolbar/lead-category-filter/lead-category-filter";
import { LeadProfileFilter } from "@/components/workspace/leads/toolbar/lead-profile-filter/lead-profile-filter";
import { LeadScoreFilter } from "@/components/workspace/leads/toolbar/lead-score-filter/lead-score-filter";
import { LeadSearchField } from "@/components/workspace/leads/toolbar/lead-search-field/lead-search-field";
import { LeadSourceFilter } from "@/components/workspace/leads/toolbar/lead-source-filter/lead-source-filter";
import { LeadStatusFilter } from "@/components/workspace/leads/toolbar/lead-status-filter/lead-status-filter";
import styles from "./leads-page-header.module.css";

type LeadsPageHeaderProps = {
  addLeadHref: string;
  basePath: string;
  categories: LeadCategoryOption[];
  currentQueryString: string;
  filtersContent: LeadsToolbarDictionary;
  importContent?: LeadsImportDictionary;
  sharedContent: LeadsSharedDictionary;
  shellContent: LeadsShellDictionary;
};

const LEADS_FILTER_PANEL_ID = "leads-filter-panel";
const MOBILE_FILTER_PANEL_MEDIA_QUERY = "(max-width: 720px)";

function getQueryValue(
  searchParams: URLSearchParams,
  key: string,
): string | undefined {
  return searchParams.get(key) ?? undefined;
}

function buildFilterHref(
  basePath: string,
  currentQueryString: string,
  overrides: Record<string, string | undefined>,
): string {
  return buildLeadHref(basePath, currentQueryString, {
    ...overrides,
    [LeadListQueryParam.Page]: undefined,
  });
}

function subscribeToMobileFilterPanelDefault(onStoreChange: () => void) {
  if (!window.matchMedia) {
    return () => {};
  }

  const mediaQueryList = window.matchMedia(MOBILE_FILTER_PANEL_MEDIA_QUERY);
  mediaQueryList.addEventListener("change", onStoreChange);

  return () => {
    mediaQueryList.removeEventListener("change", onStoreChange);
  };
}

function getMobileFilterPanelDefaultSnapshot(): boolean {
  if (!window.matchMedia) {
    return false;
  }

  return window.matchMedia(MOBILE_FILTER_PANEL_MEDIA_QUERY).matches;
}

function getServerFilterPanelDefaultSnapshot(): boolean {
  return false;
}

export function LeadsPageHeader({
  addLeadHref,
  basePath,
  categories,
  currentQueryString,
  filtersContent,
  importContent,
  sharedContent,
  shellContent,
}: LeadsPageHeaderProps) {
  const router = useRouter();
  const startNavigationTransition = useNavigationContext();
  const { startTransition } = useLeadsTableTransition();
  const searchParams = new URLSearchParams(currentQueryString);
  const currentStatus = getQueryValue(searchParams, LeadListQueryParam.Status);
  const currentSource = getQueryValue(searchParams, LeadListQueryParam.Source);
  const currentCategory = getQueryValue(
    searchParams,
    LeadListQueryParam.Category,
  );
  const currentSearch =
    getQueryValue(searchParams, LeadListQueryParam.Search) ?? "";
  const currentDateFrom =
    getQueryValue(searchParams, LeadListQueryParam.DateFrom) ?? "";
  const currentDateTo =
    getQueryValue(searchParams, LeadListQueryParam.DateTo) ?? "";
  const currentScore =
    getQueryValue(searchParams, LeadListQueryParam.ScoreMin) ?? "";
  const profileSelection = readProfileFilterSelection(
    getQueryValue(searchParams, LeadListQueryParam.ProfileInclude),
    getQueryValue(searchParams, LeadListQueryParam.ProfileExclude),
  );
  const hasProfileFilters =
    profileSelection.include.length > 0 || profileSelection.exclude.length > 0;
  const isMobileDefaultCollapsed = useSyncExternalStore(
    subscribeToMobileFilterPanelDefault,
    getMobileFilterPanelDefaultSnapshot,
    getServerFilterPanelDefaultSnapshot,
  );
  const [manualCollapsed, setManualCollapsed] = useState<boolean | null>(null);
  const isCollapsed = manualCollapsed ?? isMobileDefaultCollapsed;
  const hasActiveFilters =
    Boolean(currentStatus) ||
    Boolean(currentSource) ||
    Boolean(currentCategory) ||
    Boolean(currentSearch.trim()) ||
    Boolean(currentDateFrom) ||
    Boolean(currentDateTo) ||
    Boolean(currentScore) ||
    hasProfileFilters;

  function commitFilter(overrides: Record<string, string | undefined>) {
    const href = buildFilterHref(basePath, currentQueryString, overrides);
    startTransition(() => router.push(href, { scroll: false }));
  }

  function commitSearch(value: string | undefined) {
    const href = buildFilterHref(basePath, currentQueryString, {
      [LeadListQueryParam.Search]: value,
    });
    startTransition(() => router.replace(href, { scroll: false }));
  }

  function resetFilters() {
    commitFilter({
      [LeadListQueryParam.Category]: undefined,
      [LeadListQueryParam.DateFrom]: undefined,
      [LeadListQueryParam.DateTo]: undefined,
      [LeadListQueryParam.ProfileInclude]: undefined,
      [LeadListQueryParam.ProfileExclude]: undefined,
      [LeadListQueryParam.ScoreMin]: undefined,
      [LeadListQueryParam.Search]: undefined,
      [LeadListQueryParam.Source]: undefined,
      [LeadListQueryParam.Status]: undefined,
    });
  }

  function cycleProfile(profileType: LeadProfileTypeValue) {
    const next = cycleProfileFilter(profileSelection, profileType);
    commitFilter({
      [LeadListQueryParam.ProfileInclude]: serializeProfileFilterList(
        next.include,
      ),
      [LeadListQueryParam.ProfileExclude]: serializeProfileFilterList(
        next.exclude,
      ),
    });
  }

  return (
    <section className={styles.headerShell}>
      <header className={styles.bar}>
        <h1 className="sr-only">{shellContent.title}</h1>
        <div className={styles.utility}>
          <ButtonControl
            aria-label={filtersContent.actions.reset}
            className={styles.secondaryButton}
            disabled={!hasActiveFilters}
            onClick={resetFilters}
            type="button"
            variant="ghost"
          >
            <span className={styles.buttonIcon} aria-hidden="true">
              <FontAwesomeIcon icon={faArrowRotateLeft} />
            </span>
            <span className={styles.label}>{filtersContent.actions.reset}</span>
          </ButtonControl>
          <ButtonControl
            aria-controls={LEADS_FILTER_PANEL_ID}
            aria-expanded={!isCollapsed}
            aria-label={
              isCollapsed
                ? filtersContent.actions.expandFilters
                : filtersContent.actions.collapseFilters
            }
            className={styles.secondaryButton}
            onClick={() => {
              setManualCollapsed((current) => {
                return !(current ?? isMobileDefaultCollapsed);
              });
            }}
            type="button"
            variant="ghost"
          >
            <span aria-hidden="true" className={styles.buttonIcon}>
              <FontAwesomeIcon
                className={styles.collapseIcon}
                icon={faChevronDown}
              />
            </span>
            <span className={styles.label}>
              {isCollapsed
                ? filtersContent.actions.expandFilters
                : filtersContent.actions.collapseFilters}
            </span>
          </ButtonControl>
        </div>

        <div className={styles.actions}>
          {importContent && <ImportLeadsDialog content={importContent} />}
          <PrimaryCtaButton
            aria-label={shellContent.addLeadButton}
            className={styles.addButton}
            onClick={() =>
              startNavigationTransition(() =>
                router.push(addLeadHref, { scroll: false }),
              )
            }
          >
            <span aria-hidden="true" className={styles.buttonIcon}>
              <FontAwesomeIcon icon={faPlus} />
            </span>
            <span className={styles.label}>{shellContent.addLeadButton}</span>
          </PrimaryCtaButton>
        </div>
      </header>

      <div
        id={LEADS_FILTER_PANEL_ID}
        hidden={isCollapsed}
        className={styles.panel}
      >
        <div className={styles.primaryFilters}>
          <LeadSearchField
            currentValue={currentSearch}
            label={filtersContent.search.label}
            onCommitAction={commitSearch}
            placeholder={filtersContent.search.placeholder}
          />

          <LeadScoreFilter
            activeScore={currentScore}
            content={filtersContent}
            onChangeAction={(value) =>
              commitFilter({ [LeadListQueryParam.ScoreMin]: value })
            }
          />

          <DateRangeFilter
            className={styles.dateRangeSlot}
            fromValue={currentDateFrom}
            labels={{
              group: filtersContent.filters.dateRange,
              from: filtersContent.filters.dateFrom,
              to: filtersContent.filters.dateTo,
            }}
            onFromChangeAction={(value) =>
              commitFilter({ [LeadListQueryParam.DateFrom]: value })
            }
            onToChangeAction={(value) =>
              commitFilter({ [LeadListQueryParam.DateTo]: value })
            }
            toValue={currentDateTo}
          />
        </div>

        <div className={styles.facetGroups}>
          <LeadStatusFilter
            activeStatus={currentStatus}
            content={filtersContent}
            onChangeAction={(value) =>
              commitFilter({ [LeadListQueryParam.Status]: value })
            }
            sharedContent={sharedContent}
          />

          <LeadCategoryFilter
            activeCategory={currentCategory}
            categories={categories}
            content={filtersContent}
            onChangeAction={(value) =>
              commitFilter({ [LeadListQueryParam.Category]: value })
            }
          />

          <div className={styles.sourceProfileColumn}>
            <LeadSourceFilter
              activeSource={currentSource}
              content={filtersContent}
              onChangeAction={(value) =>
                commitFilter({ [LeadListQueryParam.Source]: value })
              }
              sharedContent={sharedContent}
            />

            <LeadProfileFilter
              content={filtersContent}
              onClearAction={() =>
                commitFilter({
                  [LeadListQueryParam.ProfileInclude]: undefined,
                  [LeadListQueryParam.ProfileExclude]: undefined,
                })
              }
              onCycleAction={cycleProfile}
              selection={profileSelection}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
