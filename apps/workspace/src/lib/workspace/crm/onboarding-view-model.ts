import "server-only";

import type { ProjectDto } from "@invessiv/common/contracts/crm/project.dto";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { QuestionnaireCatalogStatusFilter } from "@/common/constants/crm/questionnaire/questionnaire-catalog-status-filters";
import type { OnboardingViewModel } from "@/common/contracts/crm/onboarding/onboarding-view-model";
import type { Locale } from "@/config/i18n";
import { crmOnboardingFormPathFor } from "@/lib/auth/routes";
import { getProjectOnboarding } from "@/server/workspace/crm/query-handler/get-project-onboarding.query-handler";
import { listQuestionnaireTemplates } from "@/server/workspace/crm/query-handler/list-questionnaire-templates.query-handler";

/**
 * Loads the onboarding of the open project tab. Templates are only read for someone who may
 * start: choosing one needs `projects.write` on the project, not the catalog permission.
 */
export async function buildOnboardingViewModel(options: {
  actor: WorkspaceActor;
  locale: Locale;
  project: ProjectDto | null;
}): Promise<OnboardingViewModel | null> {
  const { actor, locale, project } = options;
  if (!project) return null;
  const state = await getProjectOnboarding(project.id, actor);
  if (!state) return null;
  const templates = state.canStart
    ? (
        await listQuestionnaireTemplates({
          status: QuestionnaireCatalogStatusFilter.Active,
          search: "",
        })
      ).rows
    : [];
  return {
    projectId: project.id,
    state,
    templates,
    formHref: state.form
      ? crmOnboardingFormPathFor(locale, state.form.id)
      : null,
  };
}
