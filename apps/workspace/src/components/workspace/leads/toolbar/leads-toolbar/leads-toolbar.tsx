"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLeadsTableTransition } from "@/hooks/workspace/use-leads-table-transition";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRotateLeft,
  faChevronDown,
  faGlobe,
  faLayerGroup,
  faMagnifyingGlass,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import {
  faInstagram,
  faLinkedinIn,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  LeadBadge,
  LeadCategoryBadge,
  LeadSourceBadge,
  LeadStatusBadge,
} from "@/components/workspace/leads/shared";
import { DateRangeFilter } from "@/components/workspace/shared/date-range-filter/date-range-filter";
import { CONTACT_LEAD_STATUS_VALUES } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { LeadListQueryParam } from "@/common/constants/leads/list/lead-list-query-params";
import {
  LEAD_PROFILE_TYPE_VALUES,
  LeadProfileType,
  type LeadProfileType as LeadProfileTypeValue,
} from "@/common/constants/leads/profile/lead-profile-types";
import { ProfileFilterState } from "@/common/constants/leads/profile/profile-filter-state";
import {
  LEAD_SOURCES_VALUES,
  type LeadSource,
} from "@invessiv/common/constants/leads/sources/lead-sources";
import {
  cycleProfileFilter,
  getProfileFilterState,
  readProfileFilterSelection,
  serializeProfileFilterList,
} from "@/lib/workspace/leads/lead-profile-filter";
import type {
  LeadsSharedDictionary,
  LeadsToolbarDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import { buildLeadHref } from "../../table/lead-table-utils";
import styles from "./leads-toolbar.module.css";

const PROFILE_TYPE_ICONS: Record<LeadProfileTypeValue, IconDefinition> = {
  [LeadProfileType.Website]: faGlobe,
  [LeadProfileType.Phone]: faPhone,
  [LeadProfileType.Linkedin]: faLinkedinIn,
  [LeadProfileType.Instagram]: faInstagram,
  [LeadProfileType.Youtube]: faYoutube,
};

type LeadCategoryOption = {
  id: string;
  labelKey?: string;
  label: string;
};

type LeadsToolbarProps = {
  basePath: string;
  categories: LeadCategoryOption[];
  content: LeadsToolbarDictionary;
  currentQueryString: string;
  sharedContent: LeadsSharedDictionary;
};

const SEARCH_DEBOUNCE_MS = 250;
const LEADS_TOOLBAR_PANEL_ID = "leads-toolbar-panel";

function getSearchParams(queryString: string) {
  return new URLSearchParams(queryString);
}

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

function getScoreOptions(content: LeadsToolbarDictionary) {
  return [
    { label: content.scoreOptions.any, value: undefined },
    { label: content.scoreOptions.atLeast90, value: "90" },
    { label: content.scoreOptions.atLeast80, value: "80" },
    { label: content.scoreOptions.atLeast70, value: "70" },
    { label: content.scoreOptions.atLeast50, value: "50" },
  ];
}

function getSourceLabel(
  sharedContent: LeadsSharedDictionary,
  source: LeadSource,
) {
  if (source in sharedContent.source) {
    return sharedContent.source[source as keyof typeof sharedContent.source];
  }

  return source;
}

export function LeadsToolbar({
  basePath,
  categories,
  content,
  currentQueryString,
  sharedContent,
}: LeadsToolbarProps) {
  const router = useRouter();
  const { startTransition } = useLeadsTableTransition();
  const searchParams = getSearchParams(currentQueryString);
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const hasActiveFilters =
    Boolean(currentStatus) ||
    Boolean(currentSource) ||
    Boolean(currentCategory) ||
    Boolean(currentSearch.trim()) ||
    Boolean(currentDateFrom) ||
    Boolean(currentDateTo) ||
    Boolean(currentScore) ||
    hasProfileFilters;
  const isAllStatusActive =
    !currentStatus ||
    !CONTACT_LEAD_STATUS_VALUES.includes(currentStatus as never);
  const allStatusLabel = content.tabs.all;
  const [searchValue, setSearchValue] = useState(currentSearch);

  useEffect(() => {
    setSearchValue(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    if (searchValue === currentSearch) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const href = buildFilterHref(basePath, currentQueryString, {
        [LeadListQueryParam.Search]: searchValue.trim()
          ? searchValue.trim()
          : undefined,
      });

      startTransition(() => router.replace(href, { scroll: false }));
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    basePath,
    currentQueryString,
    currentSearch,
    router,
    searchValue,
    startTransition,
  ]);

  function commitFilter(overrides: Record<string, string | undefined>) {
    const href = buildFilterHref(basePath, currentQueryString, overrides);
    startTransition(() => router.push(href, { scroll: false }));
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
    <section className={styles.toolbar}>
      <div
        id={LEADS_TOOLBAR_PANEL_ID}
        hidden={isCollapsed}
        className={styles.panel}
      >
        <div className={styles.primaryFilters}>
          <label className={styles.searchField}>
            <span className={styles.fieldLabel}>{content.search.label}</span>
            <span className={styles.searchInputWrap}>
              <span aria-hidden="true" className={styles.searchIcon}>
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </span>
              <input
                aria-label={content.search.label}
                className={styles.searchInput}
                onChange={(event) => {
                  setSearchValue(event.target.value);
                }}
                placeholder={content.search.placeholder}
                type="search"
                value={searchValue}
              />
            </span>
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>{content.filters.score}</span>
            <select
              className={styles.select}
              onChange={(event) => {
                const value = event.target.value || undefined;
                commitFilter({ [LeadListQueryParam.ScoreMin]: value });
              }}
              value={currentScore || "all"}
            >
              {getScoreOptions(content).map((option) => (
                <option key={option.label} value={option.value ?? "all"}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <DateRangeFilter
            className={styles.dateRangeSlot}
            fromValue={currentDateFrom}
            labels={{
              group: content.filters.dateRange,
              from: content.filters.dateFrom,
              to: content.filters.dateTo,
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
          <div className={styles.facetGroup}>
            <span className={styles.fieldLabel}>{content.filters.status}</span>
            <div
              aria-label={content.filters.status}
              className={styles.chipRow}
              role="toolbar"
            >
              <button
                aria-pressed={isAllStatusActive}
                className={styles.badgeButton}
                data-active={isAllStatusActive ? "true" : "false"}
                onClick={() => {
                  commitFilter({ [LeadListQueryParam.Status]: undefined });
                }}
                type="button"
              >
                <LeadStatusBadge
                  className={styles.badge}
                  label={allStatusLabel}
                  status="all"
                />
              </button>

              {CONTACT_LEAD_STATUS_VALUES.map((status) => {
                const isActive = currentStatus === status;
                const label = sharedContent.status[status];

                return (
                  <button
                    aria-pressed={isActive}
                    className={styles.badgeButton}
                    data-active={isActive ? "true" : "false"}
                    key={`status-${status}`}
                    onClick={() => {
                      commitFilter({ [LeadListQueryParam.Status]: status });
                    }}
                    type="button"
                  >
                    <LeadStatusBadge
                      className={styles.badge}
                      label={label}
                      status={status}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.facetGroup}>
            <span className={styles.fieldLabel}>
              {content.filters.category}
            </span>
            <div
              aria-label={content.filters.category}
              className={styles.chipRow}
              role="toolbar"
            >
              <button
                aria-pressed={!currentCategory}
                className={styles.badgeButton}
                data-active={!currentCategory ? "true" : "false"}
                onClick={() => {
                  commitFilter({
                    [LeadListQueryParam.Category]: undefined,
                  });
                }}
                type="button"
              >
                <LeadCategoryBadge
                  className={styles.badge}
                  label={content.filters.allCategories}
                />
              </button>

              {categories.map((category) => {
                const isActive = currentCategory === category.id;

                return (
                  <button
                    aria-pressed={isActive}
                    className={styles.badgeButton}
                    data-active={isActive ? "true" : "false"}
                    key={`category-${category.id}`}
                    onClick={() => {
                      commitFilter({
                        [LeadListQueryParam.Category]: category.id,
                      });
                    }}
                    type="button"
                  >
                    <LeadCategoryBadge
                      categoryKey={category.labelKey}
                      className={styles.badge}
                      label={category.label}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.facetGroup}>
            <span className={styles.fieldLabel}>{content.filters.source}</span>
            <div
              aria-label={content.filters.source}
              className={styles.chipRow}
              role="toolbar"
            >
              <button
                aria-pressed={!currentSource}
                className={styles.badgeButton}
                data-active={!currentSource ? "true" : "false"}
                onClick={() => {
                  commitFilter({ [LeadListQueryParam.Source]: undefined });
                }}
                type="button"
              >
                <LeadBadge
                  className={styles.badge}
                  icon={faLayerGroup}
                  kind="source"
                  label={content.filters.allSources}
                  tone="neutral"
                />
              </button>

              {LEAD_SOURCES_VALUES.map((source) => {
                const isActive = currentSource === source;

                return (
                  <button
                    aria-pressed={isActive}
                    className={styles.badgeButton}
                    data-active={isActive ? "true" : "false"}
                    key={`source-${source}`}
                    onClick={() => {
                      commitFilter({ [LeadListQueryParam.Source]: source });
                    }}
                    type="button"
                  >
                    <LeadSourceBadge
                      className={styles.badge}
                      label={getSourceLabel(sharedContent, source)}
                      source={source}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.facetGroup}>
            <span className={styles.fieldLabel}>{content.profiles.label}</span>
            <div
              aria-label={content.profiles.label}
              className={styles.chipRow}
              role="toolbar"
            >
              {LEAD_PROFILE_TYPE_VALUES.map((profileType) => {
                const state = getProfileFilterState(
                  profileSelection,
                  profileType,
                );
                const typeLabel = content.profiles.types[profileType];
                const stateLabel =
                  state === ProfileFilterState.Include
                    ? content.profiles.included
                    : state === ProfileFilterState.Exclude
                      ? content.profiles.excluded
                      : undefined;

                return (
                  <button
                    aria-label={
                      stateLabel ? `${typeLabel}: ${stateLabel}` : typeLabel
                    }
                    aria-pressed={state !== ProfileFilterState.Inactive}
                    className={styles.profileChip}
                    data-profile-type={profileType}
                    data-state={state}
                    key={`profile-${profileType}`}
                    onClick={() => {
                      cycleProfile(profileType);
                    }}
                    title={content.profiles.hint}
                    type="button"
                  >
                    <FontAwesomeIcon
                      aria-hidden="true"
                      className={styles.profileChipIcon}
                      icon={PROFILE_TYPE_ICONS[profileType]}
                    />
                    <span className={styles.profileChipLabel}>{typeLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <footer className={styles.utilityRow}>
        <button
          className={styles.resetButton}
          disabled={!hasActiveFilters}
          onClick={resetFilters}
          type="button"
        >
          <span className={styles.resetIconWrap} aria-hidden="true">
            <span className={styles.resetIcon}>
              <FontAwesomeIcon icon={faArrowRotateLeft} />
            </span>
          </span>
          <span className={styles.resetLabel}>{content.actions.reset}</span>
        </button>
        <button
          aria-controls={LEADS_TOOLBAR_PANEL_ID}
          aria-expanded={!isCollapsed}
          className={styles.collapseButton}
          onClick={() => {
            setIsCollapsed((current) => !current);
          }}
          type="button"
        >
          <span aria-hidden="true" className={styles.collapseIconWrap}>
            <FontAwesomeIcon
              className={styles.collapseIcon}
              icon={faChevronDown}
            />
          </span>
          <span className={styles.collapseLabel}>
            {isCollapsed
              ? content.actions.expandFilters
              : content.actions.collapseFilters}
          </span>
        </button>
      </footer>
    </section>
  );
}
