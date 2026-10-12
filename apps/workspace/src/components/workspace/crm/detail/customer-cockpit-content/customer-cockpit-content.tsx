import { getCrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { SettingsTab } from "@/common/constants/access/settings-tabs";
import { buildSettingsTabHref } from "@/common/patterns/access/settings-tab";
import { CustomerCockpitDialog } from "@/components/workspace/crm/detail/customer-cockpit-dialog/customer-cockpit-dialog";
import { type Locale } from "@/config/i18n";
import {
  getCrmAccessDictionary,
  getCrmCockpitDictionary,
  getCrmCredentialsDictionary,
  getCrmHoursDictionary,
  getCrmFeedbackRoundsDictionary,
  getCrmFilesDictionary,
  getCrmMessagesDictionary,
  getCrmOnboardingDictionary,
  getCrmPortalAccessDictionary,
  getCrmProjectLineItemsDictionary,
  getCrmQuestionnaireDictionary,
  getCrmTasksDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import { getSettingsPermissionsDictionary } from "@/i18n/dictionaries/workspace/settings";
import { portalPathFor, workspaceAreaPathFor } from "@/lib/auth/routes";
import type { loadCustomerCockpit } from "@/lib/workspace/crm/load-customer-cockpit";

export type CustomerCockpitContentProps = {
  viewModel: Awaited<ReturnType<typeof loadCustomerCockpit>>;
  locale: Locale;
  closeHref: string;
};

export function CustomerCockpitContent({
  viewModel,
  locale: activeLocale,
  closeHref: cockpitCloseHref,
}: CustomerCockpitContentProps) {
  const {
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
    canRedactConversation,
    canWriteConversation,
    canWriteProjects,
    viewerMemberId,
  } = viewModel;
  const customerAccessData = access.data;
  const isWorkspaceOwner = access.isWorkspaceOwner;
  const rolesHref = buildSettingsTabHref(
    workspaceAreaPathFor(activeLocale, WorkspaceArea.Settings),
    SettingsTab.Roles,
  );
  return (
    <CustomerCockpitDialog
      serviceRequests={serviceRequestsViewModel ?? undefined}
      serviceRequestsContent={
        serviceRequestsViewModel
          ? getCrmServiceRequestsDictionary(activeLocale)
          : undefined
      }
      serviceRequestLineItemsContent={
        serviceRequestsViewModel
          ? getCrmProjectLineItemsDictionary(activeLocale)
          : undefined
      }
      accessContent={
        customerAccessData ? getCrmAccessDictionary(activeLocale) : undefined
      }
      accessMembers={customerAccessData?.members}
      accessProjects={customerAccessData?.projects}
      accessRoles={customerAccessData?.roles}
      accessScopes={customerAccessData?.scopes}
      customerOwnerMemberId={access.customerOwnerMemberId}
      customerOwnerHasAccess={access.customerOwnerHasAccess}
      closeHref={cockpitCloseHref}
      content={getCrmCockpitDictionary(activeLocale)}
      conversation={cockpitConversation}
      canRedactConversation={canRedactConversation}
      canWriteConversation={canWriteConversation}
      messagesContent={
        canReadConversation ? getCrmMessagesDictionary(activeLocale) : undefined
      }
      viewerMemberId={viewerMemberId}
      customer={cockpitCustomer}
      credentials={credentialsViewModel ?? undefined}
      credentialsContent={
        credentialsViewModel
          ? getCrmCredentialsDictionary(activeLocale)
          : undefined
      }
      hours={hoursViewModel ?? undefined}
      hoursContent={
        hoursViewModel ? getCrmHoursDictionary(activeLocale) : undefined
      }
      files={filesViewModel ?? undefined}
      filesContent={
        // The chat and the feedback attachments need the file labels even without the files area.
        filesViewModel || canReadConversation || feedbackViewModel
          ? getCrmFilesDictionary(activeLocale)
          : undefined
      }
      isWorkspaceOwner={isWorkspaceOwner}
      portalHref={
        isWorkspaceOwner
          ? portalPathFor(activeLocale, cockpitCustomer.id)
          : undefined
      }
      canWriteProjects={canWriteProjects}
      locale={activeLocale}
      projectLineItems={projectLineItemsViewModel ?? undefined}
      projectLineItemsContent={
        projectLineItemsViewModel
          ? getCrmProjectLineItemsDictionary(activeLocale)
          : undefined
      }
      projects={cockpitProjects}
      selectedProjectId={selectedCockpitProject?.id ?? null}
      feedback={feedbackViewModel ?? undefined}
      feedbackContent={
        feedbackViewModel
          ? getCrmFeedbackRoundsDictionary(activeLocale)
          : undefined
      }
      onboarding={onboardingViewModel ?? undefined}
      onboardingContent={
        onboardingViewModel
          ? getCrmOnboardingDictionary(activeLocale)
          : undefined
      }
      questionnaireErrors={
        onboardingViewModel
          ? getCrmQuestionnaireDictionary(activeLocale).errors
          : undefined
      }
      projectOwnerHasAccess={access.projectOwnerHasAccess}
      permissionsContent={
        customerAccessData || portalAccess
          ? getSettingsPermissionsDictionary(activeLocale)
          : undefined
      }
      rolesHref={customerAccessData ? rolesHref : undefined}
      tasks={tasksViewModel ?? undefined}
      tasksContent={
        tasksViewModel ? getCrmTasksDictionary(activeLocale) : undefined
      }
      portalAccess={portalAccess ?? undefined}
      portalAccessContent={
        portalAccess ? getCrmPortalAccessDictionary(activeLocale) : undefined
      }
    />
  );
}
