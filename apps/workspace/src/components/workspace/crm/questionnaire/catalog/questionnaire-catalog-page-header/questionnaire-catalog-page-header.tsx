"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type SubmitEvent, useId, useState } from "react";
import { faMagnifyingGlass, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  ButtonControl,
  CustomSelect,
  PrimaryCtaLink,
  TabList,
} from "@invessiv/ui";
import { QuestionnaireCatalogDialogMode } from "@/common/constants/crm/questionnaire/questionnaire-catalog-dialog-modes";
import {
  QUESTIONNAIRE_CATALOG_STATUS_FILTER_VALUES,
  QuestionnaireCatalogStatusFilter,
} from "@/common/constants/crm/questionnaire/questionnaire-catalog-status-filters";
import {
  QUESTIONNAIRE_CATALOG_TAB_VALUES,
  QuestionnaireCatalogTab,
} from "@/common/constants/crm/questionnaire/questionnaire-catalog-tabs";
import type { QuestionnaireCatalogFilters } from "@/common/contracts/crm/questionnaire/questionnaire-catalog-filters";
import { buildQuestionnaireCatalogHref } from "@/common/patterns/crm/questionnaire/questionnaire-catalog-query";
import type { CrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./questionnaire-catalog-page-header.module.css";

export type QuestionnaireCatalogPageHeaderProps = {
  basePath: string;
  canWrite: boolean;
  content: CrmQuestionnaireDictionary["catalog"];
  filters: QuestionnaireCatalogFilters;
  /** Id of the list the tabs control. */
  panelId: string;
  /** Tab ids by tab, so the list can name the active tab as its label. */
  tabIds: Record<QuestionnaireCatalogTab, string>;
};

const CREATE_MODE = {
  [QuestionnaireCatalogTab.Blocks]: QuestionnaireCatalogDialogMode.CreateBlock,
  [QuestionnaireCatalogTab.Templates]:
    QuestionnaireCatalogDialogMode.CreateTemplate,
} satisfies Record<QuestionnaireCatalogTab, QuestionnaireCatalogDialogMode>;

/** Tab, status and search live in the URL, so a reload or a shared link opens the same view. */
export function QuestionnaireCatalogPageHeader({
  basePath,
  canWrite,
  content,
  filters,
  panelId,
  tabIds,
}: QuestionnaireCatalogPageHeaderProps) {
  const router = useRouter();
  const statusId = useId();
  const searchId = useId();
  const [search, setSearch] = useState(filters.search);
  const [urlSearch, setUrlSearch] = useState(filters.search);
  // The empty state resets the filters through a link; the box must follow the URL then.
  if (urlSearch !== filters.search) {
    setUrlSearch(filters.search);
    setSearch(filters.search);
  }
  const isBlocks = filters.tab === QuestionnaireCatalogTab.Blocks;

  function go(next: QuestionnaireCatalogFilters) {
    router.push(buildQuestionnaireCatalogHref(basePath, next), {
      scroll: false,
    });
  }

  function submitSearch(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    go({ ...filters, search: search.trim() });
  }

  return (
    <header className={styles.header}>
      <div className={styles.top}>
        <div className={styles.intro}>
          <h1 className={styles.title}>{content.title}</h1>
          <p className={styles.description}>{content.description}</p>
        </div>
        {canWrite ? (
          <PrimaryCtaLink
            className={styles.createLink}
            href={buildQuestionnaireCatalogHref(
              basePath,
              filters,
              CREATE_MODE[filters.tab],
            )}
            linkComponent={Link}
            linkComponentProps={{ scroll: false }}
          >
            <FontAwesomeIcon
              aria-hidden="true"
              className={styles.icon}
              icon={faPlus}
            />
            {isBlocks ? content.createBlock : content.createTemplate}
          </PrimaryCtaLink>
        ) : null}
      </div>
      <div className={styles.toolbar}>
        <TabList
          activeValue={filters.tab}
          ariaLabel={content.tabs.ariaLabel}
          items={QUESTIONNAIRE_CATALOG_TAB_VALUES.map((tab) => ({
            value: tab,
            id: tabIds[tab],
            panelId,
            label: content.tabs[tab],
          }))}
          onSelectAction={(tab) => {
            setSearch("");
            go({
              tab,
              status: QuestionnaireCatalogStatusFilter.Active,
              search: "",
            });
          }}
        />
        <div
          aria-label={content.filters.ariaLabel}
          className={styles.filters}
          role="group"
        >
          <div className={styles.status}>
            <CustomSelect
              ariaLabel={content.filters.status}
              id={statusId}
              onChange={(status) => go({ ...filters, status })}
              options={QUESTIONNAIRE_CATALOG_STATUS_FILTER_VALUES.map(
                (status) => ({
                  label: content.filters.statusOptions[status],
                  value: status,
                }),
              )}
              value={filters.status}
            />
          </div>
          <form className={styles.search} onSubmit={submitSearch} role="search">
            <label className="sr-only" htmlFor={searchId}>
              {content.filters.search}
            </label>
            <input
              className={styles.searchInput}
              id={searchId}
              maxLength={100}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                isBlocks
                  ? content.filters.searchPlaceholderBlocks
                  : content.filters.searchPlaceholderTemplates
              }
              type="search"
              value={search}
            />
            <ButtonControl
              aria-label={content.filters.submit}
              className={styles.searchButton}
              title={content.filters.submit}
              type="submit"
              variant="ghost"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faMagnifyingGlass} />
            </ButtonControl>
          </form>
        </div>
      </div>
    </header>
  );
}
