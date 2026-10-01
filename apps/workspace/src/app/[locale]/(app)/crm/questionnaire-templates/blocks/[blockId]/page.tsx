import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { can } from "@invessiv/common/patterns/auth/can";
import { QuestionnaireCatalogBlockPage } from "@/components/workspace/crm/questionnaire/catalog/questionnaire-catalog-block-page/questionnaire-catalog-block-page";
import { WorkspaceScrollablePageShell } from "@/components/workspace/shared/workspace-scrollable-page-shell/workspace-scrollable-page-shell";
import { isSupportedLocale } from "@/config/i18n";
import { getCrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import { requireWorkspacePermission } from "@/lib/auth/permissions";
import { crmQuestionnaireTemplatesPathFor } from "@/lib/auth/routes";
import { buildQuestionnaireFixedChoiceLabels } from "@/lib/workspace/crm/questionnaire-fixed-choice-labels";
import { countQuestionnaireBlockTemplates } from "@/server/workspace/crm/query-handler/count-questionnaire-block-templates.query-handler";
import { getQuestionnaireBlock } from "@/server/workspace/crm/query-handler/get-questionnaire-block.query-handler";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type QuestionnaireBlockPageProps = {
  params: Promise<{ locale: string; blockId: string }>;
};

export async function generateMetadata({
  params,
}: QuestionnaireBlockPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  // Metadata runs outside the page's permission gate, so it never names the block.
  const meta = getCrmQuestionnaireDictionary(locale).meta;
  return {
    title: meta.title,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function QuestionnaireBlockPage({
  params,
}: QuestionnaireBlockPageProps) {
  const { locale, blockId } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const actor = await requireWorkspacePermission(
    locale,
    Permission.QuestionnaireTemplatesRead,
  );
  const [block, templateCount] = await Promise.all([
    getQuestionnaireBlock(blockId),
    countQuestionnaireBlockTemplates(blockId),
  ]);
  if (!block) notFound();
  const content = getCrmQuestionnaireDictionary(locale);

  return (
    <WorkspaceScrollablePageShell pageId="crm-questionnaire-block">
      <QuestionnaireCatalogBlockPage
        backHref={crmQuestionnaireTemplatesPathFor(locale)}
        block={block}
        canWrite={can(actor, Permission.QuestionnaireTemplatesWrite)}
        content={content}
        fixedChoiceLabels={buildQuestionnaireFixedChoiceLabels()}
        locale={locale}
        templateCount={templateCount}
      />
    </WorkspaceScrollablePageShell>
  );
}
