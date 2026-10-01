import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { can } from "@invessiv/common/patterns/auth/can";
import { QuestionnaireCatalogDialogMode } from "@/common/constants/crm/questionnaire/questionnaire-catalog-dialog-modes";
import { QuestionnaireCatalogStatusFilter } from "@/common/constants/crm/questionnaire/questionnaire-catalog-status-filters";
import { QuestionnaireCatalogTab } from "@/common/constants/crm/questionnaire/questionnaire-catalog-tabs";
import {
  buildQuestionnaireCatalogHref,
  readQuestionnaireCatalogDialogMode,
} from "@/common/patterns/crm/questionnaire/questionnaire-catalog-query";
import { parseQuestionnaireCatalogFilters } from "@/common/patterns/crm/questionnaire/questionnaire-catalog-search-params";
import { QuestionnaireBlockCreateDialog } from "@/components/workspace/crm/questionnaire/catalog/questionnaire-block-create-dialog/questionnaire-block-create-dialog";
import { QuestionnaireBlockList } from "@/components/workspace/crm/questionnaire/catalog/questionnaire-block-list/questionnaire-block-list";
import { QuestionnaireCatalogPageHeader } from "@/components/workspace/crm/questionnaire/catalog/questionnaire-catalog-page-header/questionnaire-catalog-page-header";
import { QuestionnaireTemplateCreateDialog } from "@/components/workspace/crm/questionnaire/catalog/questionnaire-template-create-dialog/questionnaire-template-create-dialog";
import { QuestionnaireTemplateList } from "@/components/workspace/crm/questionnaire/catalog/questionnaire-template-list/questionnaire-template-list";
import { WorkspaceScrollablePageShell } from "@/components/workspace/shared/workspace-scrollable-page-shell/workspace-scrollable-page-shell";
import styles from "./page.module.css";
import { isSupportedLocale } from "@/config/i18n";
import { getCrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import { requireWorkspacePermission } from "@/lib/auth/permissions";
import {
  crmQuestionnaireBlockPathFor,
  crmQuestionnaireTemplatePathFor,
  crmQuestionnaireTemplatesPathFor,
} from "@/lib/auth/routes";
import { listQuestionnaireBlocks } from "@/server/workspace/crm/query-handler/list-questionnaire-blocks.query-handler";
import { listQuestionnaireTemplates } from "@/server/workspace/crm/query-handler/list-questionnaire-templates.query-handler";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type QuestionnaireTemplatesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PANEL_ID = "questionnaire-catalog-panel";
const TAB_IDS = {
  [QuestionnaireCatalogTab.Blocks]: "questionnaire-catalog-tab-blocks",
  [QuestionnaireCatalogTab.Templates]: "questionnaire-catalog-tab-templates",
} satisfies Record<QuestionnaireCatalogTab, string>;

export async function generateMetadata({
  params,
}: QuestionnaireTemplatesPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const meta = getCrmQuestionnaireDictionary(locale).meta;
  return {
    title: meta.title,
    description: meta.description,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function QuestionnaireTemplatesPage({
  params,
  searchParams,
}: QuestionnaireTemplatesPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  // The layout is not re-rendered on search param changes, so the page gates its own data.
  const actor = await requireWorkspacePermission(
    locale,
    Permission.QuestionnaireTemplatesRead,
  );
  const resolvedSearchParams = await searchParams;
  const filters = parseQuestionnaireCatalogFilters(resolvedSearchParams);
  const canWrite = can(actor, Permission.QuestionnaireTemplatesWrite);
  const mode = canWrite
    ? readQuestionnaireCatalogDialogMode(resolvedSearchParams)
    : null;
  const content = getCrmQuestionnaireDictionary(locale);
  const basePath = crmQuestionnaireTemplatesPathFor(locale);
  const isBlocks = filters.tab === QuestionnaireCatalogTab.Blocks;
  const resetHref = buildQuestionnaireCatalogHref(basePath, {
    tab: filters.tab,
    status: QuestionnaireCatalogStatusFilter.Active,
    search: "",
  });
  const closeHref = buildQuestionnaireCatalogHref(basePath, filters);
  const listFilters = { status: filters.status, search: filters.search };

  return (
    <WorkspaceScrollablePageShell pageId="crm-questionnaire-templates">
      <QuestionnaireCatalogPageHeader
        basePath={basePath}
        canWrite={canWrite}
        content={content.catalog}
        filters={filters}
        panelId={PANEL_ID}
        tabIds={TAB_IDS}
      />
      <div
        aria-labelledby={TAB_IDS[filters.tab]}
        className={styles.panel}
        id={PANEL_ID}
        role="tabpanel"
      >
        {isBlocks ? (
          <QuestionnaireBlockList
            blockHref={(blockId) =>
              crmQuestionnaireBlockPathFor(locale, blockId)
            }
            content={content}
            createHref={
              canWrite
                ? buildQuestionnaireCatalogHref(
                    basePath,
                    filters,
                    QuestionnaireCatalogDialogMode.CreateBlock,
                  )
                : null
            }
            list={await listQuestionnaireBlocks(listFilters)}
            locale={locale}
            resetHref={resetHref}
          />
        ) : (
          <QuestionnaireTemplateList
            content={content}
            createHref={
              canWrite
                ? buildQuestionnaireCatalogHref(
                    basePath,
                    filters,
                    QuestionnaireCatalogDialogMode.CreateTemplate,
                  )
                : null
            }
            list={await listQuestionnaireTemplates(listFilters)}
            locale={locale}
            resetHref={resetHref}
            templateHref={(templateId) =>
              crmQuestionnaireTemplatePathFor(locale, templateId)
            }
          />
        )}
      </div>
      {mode === QuestionnaireCatalogDialogMode.CreateBlock ? (
        <QuestionnaireBlockCreateDialog
          closeHref={closeHref}
          content={content}
          locale={locale}
        />
      ) : null}
      {mode === QuestionnaireCatalogDialogMode.CreateTemplate ? (
        <QuestionnaireTemplateCreateDialog
          closeHref={closeHref}
          content={content}
          locale={locale}
        />
      ) : null}
    </WorkspaceScrollablePageShell>
  );
}
