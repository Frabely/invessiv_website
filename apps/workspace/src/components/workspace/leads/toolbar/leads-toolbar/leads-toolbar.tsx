"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLeadsTableTransition } from "@/hooks/workspace/use-leads-table-transition";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRotateLeft,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { DateRangeFilter } from "@/components/workspace/shared/date-range-filter/date-range-filter";
import { LeadListQueryParam } from "@/common/constants/leads/list/lead-list-query-params";
import type { LeadCategoryOption } from "@/common/contracts/leads/lead-category-option";
import type { LeadProfileType as LeadProfileTypeValue } from "@/common/constants/leads/profile/lead-profile-types";
import {
  cycleProfileFilter,
  readProfileFilterSelection,
  serializeProfileFilterList,
} from "@/lib/workspace/leads/lead-profile-filter";
import type {
  LeadsSharedDictionary,
  LeadsToolbarDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import { buildLeadHref } from "../../table/lead-table-utils";
import { LeadSearchField } from "../lead-search-field/lead-search-field";
import { LeadScoreFilter } from "../lead-score-filter/lead-score-filter";
import { LeadStatusFilter } from "../lead-status-filter/lead-status-filter";
import { LeadCategoryFilter } from "../lead-category-filter/lead-category-filter";
import { LeadSourceFilter } from "../lead-source-filter/lead-source-filter";
import { LeadProfileFilter } from "../lead-profile-filter/lead-profile-filter";
import styles from "./leads-toolbar.module.css";

type LeadsToolbarProps = {
  basePath: string;
  categories: LeadCategoryOption[];
  content: LeadsToolbarDictionary;
  currentQueryString: string;
  sharedContent: LeadsSharedDictionary;
};

const LEADS_TOOLBAR_PANEL_ID = "leads-toolbar-panel";

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

export function LeadsToolbar({
  basePath,
  categories,
  content,
  currentQueryString,
  sharedContent,
}: LeadsToolbarProps) {
  const router = useRouter();
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
    <section className={styles.toolbar}>
      <div
        id={LEADS_TOOLBAR_PANEL_ID}
        hidden={isCollapsed}
        className={styles.panel}
      >
        <div className={styles.primaryFilters}>
          <LeadSearchField
            currentValue={currentSearch}
            label={content.search.label}
            onCommitAction={commitSearch}
            placeholder={content.search.placeholder}
          />

          <LeadScoreFilter
            activeScore={currentScore}
            content={content}
            onChangeAction={(value) =>
              commitFilter({ [LeadListQueryParam.ScoreMin]: value })
            }
          />

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
          <LeadStatusFilter
            activeStatus={currentStatus}
            content={content}
            onChangeAction={(value) =>
              commitFilter({ [LeadListQueryParam.Status]: value })
            }
            sharedContent={sharedContent}
          />

          <LeadCategoryFilter
            activeCategory={currentCategory}
            categories={categories}
            content={content}
            onChangeAction={(value) =>
              commitFilter({ [LeadListQueryParam.Category]: value })
            }
          />

          <div className={styles.sourceProfileColumn}>
            <LeadSourceFilter
              activeSource={currentSource}
              content={content}
              onChangeAction={(value) =>
                commitFilter({ [LeadListQueryParam.Source]: value })
              }
              sharedContent={sharedContent}
            />

            <LeadProfileFilter
              content={content}
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
