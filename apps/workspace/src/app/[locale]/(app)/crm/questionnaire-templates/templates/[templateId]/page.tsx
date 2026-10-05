import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { can } from "@invessiv/common/patterns/auth/can";
import { QuestionnaireCatalogStatusFilter } from "@/common/constants/crm/questionnaire/questionnaire-catalog-status-filters";
import { QuestionnaireCatalogTab } from "@/common/constants/crm/questionnaire/questionnaire-catalog-tabs";
import { buildQuestionnaireCatalogHref } from "@/common/patterns/crm/questionnaire/questionnaire-catalog-query";
import { QuestionnaireTemplateEditor } from "@/components/workspace/crm/questionnaire/templates/questionnaire-template-editor/questionnaire-template-editor";
import { WorkspaceScrollablePageShell } from "@/components/workspace/shared/workspace-scrollable-page-shell/workspace-scrollable-page-shell";
import { isSupportedLocale } from "@/config/i18n";
import { getCrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import { requireWorkspacePermission } from "@/lib/auth/permissions";
import { crmQuestionnaireTemplatesPathFor } from "@/lib/auth/routes";
import { getQuestionnaireTemplate } from "@/server/workspace/crm/query-handler/get-questionnaire-template.query-handler";
import { listQuestionnaireBlocks } from "@/server/workspace/crm/query-handler/list-questionnaire-blocks.query-handler";
import { buildQuestionnaireFixedChoiceLabels } from "@/lib/workspace/crm/questionnaire-fixed-choice-labels";
import { getQuestionnaireTemplateBlocks } from "@/server/workspace/crm/query-handler/get-questionnaire-template-blocks.query-handler";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type QuestionnaireTemplatePageProps = {
  params: Promise<{ locale: string; templateId: string }>;
};

export async function generateMetadata({
  params,
}: QuestionnaireTemplatePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  // Metadata runs outside the page's permission gate, so it never names the template.
  const meta = getCrmQuestionnaireDictionary(locale).meta;
  return {
    title: meta.title,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function QuestionnaireTemplatePage({
  params,
}: QuestionnaireTemplatePageProps) {
  const { locale, templateId } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const actor = await requireWorkspacePermission(
    locale,
    Permission.QuestionnaireTemplatesRead,
  );
  const template = await getQuestionnaireTemplate(templateId);
  if (!template) notFound();
  // Every status: a template may still hold a block that was archived after it was chosen.
  const [blocks, templateBlocks] = await Promise.all([
    listQuestionnaireBlocks({
      status: QuestionnaireCatalogStatusFilter.All,
      search: "",
    }),
    getQuestionnaireTemplateBlocks(
      template.blocks.map((entry) => entry.blockId),
    ),
  ]);

  return (
    <WorkspaceScrollablePageShell pageId="crm-questionnaire-template">
      <QuestionnaireTemplateEditor
        backHref={buildQuestionnaireCatalogHref(
          crmQuestionnaireTemplatesPathFor(locale),
          {
            tab: QuestionnaireCatalogTab.Templates,
            status: QuestionnaireCatalogStatusFilter.Active,
            search: "",
          },
        )}
        blocks={blocks.rows}
        initialBlocks={templateBlocks}
        fixedChoiceLabels={buildQuestionnaireFixedChoiceLabels()}
        canWrite={can(actor, Permission.QuestionnaireTemplatesWrite)}
        content={getCrmQuestionnaireDictionary(locale)}
        locale={locale}
        template={template}
      />
    </WorkspaceScrollablePageShell>
  );
}
