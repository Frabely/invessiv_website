import { buildServiceRequestsViewModel } from "./service-requests-view-model";
import "server-only";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { can } from "@invessiv/common/patterns/auth/can";
import { canOn } from "@/common/patterns/auth/can-on";
import { canAnywhere } from "@/common/patterns/auth/access-scope";
import { type Locale } from "@/config/i18n";
import { crmLineItemTemplatesPathFor } from "@/lib/auth/routes";
import { listCockpitProjectsByCustomer } from "@/server/workspace/crm/query-handler/list-projects-by-customer.query-handler";
import { buildProjectLineItemsViewModel } from "@/lib/workspace/crm/project-line-items-view-model";
import { buildTasksViewModel } from "@/lib/workspace/crm/tasks-view-model";
import { buildCredentialsViewModel } from "@/lib/workspace/crm/credentials-view-model";
import { buildHoursViewModel } from "@/lib/workspace/crm/hours-view-model";
import { listCredentialProjectsByCustomer } from "@/server/workspace/crm/query-handler/list-credential-projects-by-customer.query-handler";
import { buildFilesViewModel } from "@/lib/workspace/crm/files-view-model";
import { buildFeedbackRoundsViewModel } from "@/lib/workspace/crm/feedback-rounds-view-model";
import { buildOnboardingViewModel } from "@/lib/workspace/crm/onboarding-view-model";
import { getCustomerPortalAccess } from "@/server/workspace/crm/query-handler/get-customer-portal-access.query-handler";
import { getCustomerConversation } from "@/server/workspace/crm/query-handler/get-customer-conversation.query-handler";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { logCrmFailure } from "@/lib/workspace/crm/log-crm-failure";
import type { CustomerCockpitDto } from "@invessiv/common/contracts/crm/customer-cockpit.dto";
import { buildCustomerAccessViewModel } from "./customer-access-view-model";

// The chat is a side panel: a failure shows its reload state instead of breaking the cockpit.
async function loadCockpitConversation(
  customerId: string,
  actor: WorkspaceActor,
) {
  try {
    const result = await getCustomerConversation(customerId, actor, null);
    return result.ok ? result.conversation : null;
  } catch (error) {
    logCrmFailure(CrmOperation.GetConversation, error);
    return null;
  }
}

export async function loadCustomerCockpit(options: {
  actor: WorkspaceActor;
  customer: CustomerCockpitDto;
  locale: Locale;
  requestedProjectId: string | null;
  requestedRoundId: string | null;
  requestedServiceRequestId?: string | null;
}) {
  const {
    actor,
    customer: cockpitCustomer,
    locale: activeLocale,
    requestedProjectId,
    requestedRoundId,
  } = options;
  const canReadLineItemTemplates = can(actor, Permission.LineItemTemplatesRead);
  const canReadConversation = canOn(actor, Permission.ChatRead, {
    customerId: cockpitCustomer.id,
  });

  const cockpitConversation = canReadConversation
    ? await loadCockpitConversation(cockpitCustomer.id, actor)
    : undefined;
  const cockpitProjects = await listCockpitProjectsByCustomer(
    cockpitCustomer.id,
    actor,
  );
  const portalAccess = canOn(actor, Permission.PortalAccessManage, {
    customerId: cockpitCustomer.id,
  })
    ? await getCustomerPortalAccess(cockpitCustomer.id, actor)
    : null;
  const projectLineItemsViewModel = await buildProjectLineItemsViewModel({
    actor,
    catalogHref: canReadLineItemTemplates
      ? crmLineItemTemplatesPathFor(activeLocale)
      : null,
    customerId: cockpitCustomer.id,
    projects: cockpitProjects,
  });
  const tasksViewModel = await buildTasksViewModel({
    actor,
    customerId: cockpitCustomer.id,
    projects: cockpitProjects,
  });
  const filesViewModel = await buildFilesViewModel({
    actor,
    customerId: cockpitCustomer.id,
    projects: cockpitProjects,
  });
  const credentialsViewModel = buildCredentialsViewModel({
    actor,
    customerId: cockpitCustomer.id,
    projects: await listCredentialProjectsByCustomer(cockpitCustomer.id, actor),
  });
  const serviceRequestsViewModel = await buildServiceRequestsViewModel(
    actor,
    cockpitCustomer.id,
    activeLocale,
    options.requestedServiceRequestId,
  );
  const hoursViewModel = await buildHoursViewModel({
    actor,
    customerId: cockpitCustomer.id,
  });
  // Only the open tab loads its rounds; an unknown or foreign project id falls back to the first.
  const selectedCockpitProject =
    cockpitProjects?.find((project) => project.id === requestedProjectId) ??
    cockpitProjects?.[0] ??
    null;
  const feedbackViewModel = selectedCockpitProject
    ? await buildFeedbackRoundsViewModel({
        actor,
        project: selectedCockpitProject.project,
        requestedRoundId,
      })
    : null;
  const onboardingViewModel = selectedCockpitProject
    ? await buildOnboardingViewModel({
        actor,
        locale: activeLocale,
        project: selectedCockpitProject.project,
      })
    : null;

  const access = await buildCustomerAccessViewModel({
    actor,
    customerId: cockpitCustomer.id,
    cockpitProjects,
  });
  return {
    customer: cockpitCustomer,
    canReadConversation,
    cockpitConversation,
    cockpitProjects,
    portalAccess,
    projectLineItemsViewModel,
    tasksViewModel,
    filesViewModel,
    credentialsViewModel,
    hoursViewModel,
    serviceRequestsViewModel,
    selectedCockpitProject,
    feedbackViewModel,
    onboardingViewModel,
    access,
    canRedactConversation: can(actor, Permission.ChatRedact),
    canWriteConversation: canOn(actor, Permission.ChatWrite, {
      customerId: cockpitCustomer.id,
    }),
    canWriteProjects: canAnywhere(actor, Permission.ProjectsWrite),
    viewerMemberId: actor.workspaceMemberId,
  };
}
