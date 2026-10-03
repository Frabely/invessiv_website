import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { isOnboardingStructureEditable } from "@invessiv/common/patterns/crm/onboarding/onboarding-form-state";
import type { QuestionnaireTemplateSummaryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-template-summary.dto";
import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { QuestionnaireCatalogStatusFilter } from "@/common/constants/crm/questionnaire/questionnaire-catalog-status-filters";
import { canOn } from "@/common/patterns/auth/can-on";
import { buildCustomerCockpitHref } from "@/common/patterns/crm/customer-dialog-query";
import { OnboardingFormPageView } from "@/components/workspace/crm/onboarding/form/onboarding-form-page-view/onboarding-form-page-view";
import { WorkspaceScrollablePageShell } from "@/components/workspace/shared/workspace-scrollable-page-shell/workspace-scrollable-page-shell";
import { isSupportedLocale } from "@/config/i18n";
import {
  getCrmFilesDictionary,
  getCrmOnboardingDictionary,
  getCrmQuestionnaireDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import { requireWorkspaceArea } from "@/lib/auth/permissions";
import { workspaceAreaPathFor } from "@/lib/auth/routes";
import { buildQuestionnaireFixedChoiceLabels } from "@/lib/workspace/crm/questionnaire-fixed-choice-labels";
import { getOnboardingFormContext } from "@/server/workspace/crm/query-handler/get-onboarding-form-context.query-handler";
import { getOnboardingForm } from "@/server/workspace/crm/query-handler/get-onboarding-form.query-handler";
import { listQuestionnaireBlocks } from "@/server/workspace/crm/query-handler/list-questionnaire-blocks.query-handler";
import { listQuestionnaireTemplates } from "@/server/workspace/crm/query-handler/list-questionnaire-templates.query-handler";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type OnboardingFormPageProps = {
  params: Promise<{ locale: string; formId: string }>;
};

export async function generateMetadata({
  params,
}: OnboardingFormPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  // Metadata runs outside the page's access check, so it never names the project.
  return {
    title: getCrmOnboardingDictionary(locale).meta.title,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function OnboardingFormPage({
  params,
}: OnboardingFormPageProps) {
  const { locale, formId } = await params;
  if (!isSupportedLocale(locale)) notFound();

  // The area admits bound roles; the queries narrow it to this form's project.
  const actor = await requireWorkspaceArea(locale, WorkspaceArea.Crm);
  const [form, context] = await Promise.all([
    getOnboardingForm(formId, actor),
    getOnboardingFormContext(formId, actor),
  ]);
  if (!form || !context) notFound();

  const canWrite = canOn(actor, Permission.ProjectsWrite, {
    customerId: form.customerId,
    projectId: form.projectId,
  });
  // Adding a catalog block needs `projects.write` here, not the catalog permission.
  const canEditStructure =
    canWrite && isOnboardingStructureEditable(form.status);
  const canApplyTemplate =
    canEditStructure &&
    form.status === OnboardingFormStatus.Draft &&
    form.blocks.length === 0;
  const [catalogBlocks, templates] = await Promise.all([
    canEditStructure
      ? listQuestionnaireBlocks({
          status: QuestionnaireCatalogStatusFilter.Active,
          search: "",
        }).then((result) => result.rows)
      : Promise.resolve([]),
    canApplyTemplate
      ? listQuestionnaireTemplates({
          status: QuestionnaireCatalogStatusFilter.Active,
          search: "",
        }).then((result) => result.rows)
      : Promise.resolve([] as QuestionnaireTemplateSummaryDto[]),
  ]);

  return (
    <WorkspaceScrollablePageShell pageId="crm-onboarding-form">
      <OnboardingFormPageView
        backHref={buildCustomerCockpitHref(
          workspaceAreaPathFor(locale, WorkspaceArea.Crm),
          context.customerId,
          "",
          { projectId: context.projectId },
        )}
        canWrite={canWrite}
        catalogBlocks={catalogBlocks}
        content={getCrmOnboardingDictionary(locale)}
        context={context}
        filesContent={getCrmFilesDictionary(locale)}
        fixedChoiceLabels={buildQuestionnaireFixedChoiceLabels()}
        form={form}
        locale={locale}
        questionnaireContent={getCrmQuestionnaireDictionary(locale)}
        templates={templates}
      />
    </WorkspaceScrollablePageShell>
  );
}
