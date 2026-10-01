"use client";

import { useRouter } from "next/navigation";

import { Dialog, DialogSize } from "@invessiv/ui";
import { formatCustomerNumber } from "@invessiv/common/patterns/crm/format-customer-number";
import { CustomerCockpitView } from "@/components/workspace/crm/detail/customer-cockpit-view/customer-cockpit-view";
import type { CustomerCockpitDto } from "@invessiv/common/contracts/crm/customer-cockpit.dto";
import type { PortalAccessDto } from "@invessiv/common/contracts/crm/portal-access.dto";
import type { InternalConversationDto } from "@invessiv/common/contracts/crm/internal-conversation.dto";
import type { AccessScopeEntryDto } from "@invessiv/common/contracts/auth/access-scope-entry.dto";
import type { AccessProjectOptionDto } from "@invessiv/common/contracts/auth/access-project-option.dto";
import type { RoleAssignmentOptionDto } from "@invessiv/common/contracts/auth/role-assignment-option.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import type {
  CrmAccessDictionary,
  CrmCockpitDictionary,
  CrmFilesDictionary,
  CrmMessagesDictionary,
  CrmPortalAccessDictionary,
  CrmProjectLineItemsDictionary,
  CrmTasksDictionary,
  CrmFeedbackRoundsDictionary,
  CrmOnboardingDictionary,
  CrmQuestionnaireDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import type { SettingsPermissionsDictionary } from "@/i18n/dictionaries/workspace/settings";
import type { ProjectLineItemsViewModel } from "@/common/contracts/crm/project-line-items-view-model";
import type { FeedbackRoundsViewModel } from "@/common/contracts/crm/feedback-rounds-view-model";
import type { OnboardingViewModel } from "@/common/contracts/crm/onboarding/onboarding-view-model";
import type { TasksViewModel } from "@/common/contracts/crm/tasks-view-model";
import type { FilesViewModel } from "@/common/contracts/crm/files/files-view-model";
import type { CockpitProjectDto } from "@/common/contracts/crm/cockpit-project.dto";
import type { Locale } from "@/config/i18n";

type CustomerCockpitDialogProps = {
  accessContent?: CrmAccessDictionary;
  accessMembers?: readonly WorkspaceMemberDto[];
  accessProjects?: readonly AccessProjectOptionDto[];
  accessRoles?: readonly RoleAssignmentOptionDto[];
  accessScopes?: readonly AccessScopeEntryDto[];
  closeHref: string;
  content: CrmCockpitDictionary;
  conversation?: InternalConversationDto | null;
  canRedactConversation?: boolean;
  canWriteConversation?: boolean;
  messagesContent?: CrmMessagesDictionary;
  viewerMemberId: string;
  customer: CustomerCockpitDto;
  files?: FilesViewModel;
  filesContent?: CrmFilesDictionary;
  isWorkspaceOwner?: boolean;
  portalHref?: string;
  customerOwnerHasAccess?: boolean;
  customerOwnerMemberId?: string;
  locale: Locale;
  canWriteProjects?: boolean;
  projects?: CockpitProjectDto[] | null;
  permissionsContent?: SettingsPermissionsDictionary;
  projectOwnerHasAccess?: Readonly<Record<string, boolean>>;
  projectLineItems?: ProjectLineItemsViewModel;
  projectLineItemsContent?: CrmProjectLineItemsDictionary;
  rolesHref?: string;
  tasks?: TasksViewModel;
  tasksContent?: CrmTasksDictionary;
  /** Project tab from the URL. */
  selectedProjectId?: string | null;
  /** Rounds of the open project tab; absent without `projects.read` there. */
  feedback?: FeedbackRoundsViewModel;
  feedbackContent?: CrmFeedbackRoundsDictionary;
  onboarding?: OnboardingViewModel;
  onboardingContent?: CrmOnboardingDictionary;
  questionnaireErrors?: CrmQuestionnaireDictionary["errors"];
  portalAccess?: PortalAccessDto;
  portalAccessContent?: CrmPortalAccessDictionary;
};

export function CustomerCockpitDialog({
  accessContent,
  accessMembers,
  accessProjects,
  accessRoles,
  accessScopes,
  closeHref,
  content,
  conversation,
  canRedactConversation,
  canWriteConversation,
  messagesContent,
  viewerMemberId,
  customer,
  files,
  filesContent,
  isWorkspaceOwner,
  portalHref,
  customerOwnerHasAccess,
  customerOwnerMemberId,
  locale,
  canWriteProjects,
  projects,
  permissionsContent,
  projectOwnerHasAccess,
  projectLineItems,
  projectLineItemsContent,
  rolesHref,
  tasks,
  tasksContent,
  selectedProjectId,
  feedback,
  feedbackContent,
  onboarding,
  onboardingContent,
  questionnaireErrors,
  portalAccess,
  portalAccessContent,
}: CustomerCockpitDialogProps) {
  const router = useRouter();

  function close() {
    router.replace(closeHref, { scroll: false });
  }

  return (
    <Dialog
      closeLabel={content.close}
      eyebrow={formatCustomerNumber(customer.customerNumber)}
      onCloseAction={close}
      size={DialogSize.Full}
      title={customer.displayName}
    >
      <CustomerCockpitView
        accessContent={accessContent}
        accessMembers={accessMembers}
        accessProjects={accessProjects}
        accessRoles={accessRoles}
        accessScopes={accessScopes}
        canWriteProjects={canWriteProjects}
        content={content}
        conversation={conversation}
        canRedactConversation={canRedactConversation}
        canWriteConversation={canWriteConversation}
        messagesContent={messagesContent}
        viewerMemberId={viewerMemberId}
        customer={customer}
        files={files}
        filesContent={filesContent}
        isWorkspaceOwner={isWorkspaceOwner}
        portalHref={portalHref}
        customerOwnerHasAccess={customerOwnerHasAccess}
        customerOwnerMemberId={customerOwnerMemberId}
        locale={locale}
        projects={projects}
        permissionsContent={permissionsContent}
        projectOwnerHasAccess={projectOwnerHasAccess}
        projectLineItems={projectLineItems}
        projectLineItemsContent={projectLineItemsContent}
        rolesHref={rolesHref}
        showHeading={false}
        tasks={tasks}
        tasksContent={tasksContent}
        selectedProjectId={selectedProjectId}
        feedback={feedback}
        feedbackContent={feedbackContent}
        onboarding={onboarding}
        onboardingContent={onboardingContent}
        questionnaireErrors={questionnaireErrors}
        portalAccess={portalAccess}
        portalAccessContent={portalAccessContent}
      />
    </Dialog>
  );
}
