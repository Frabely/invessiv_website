"use client";

import { useRouter } from "next/navigation";

import { Dialog, DialogSize } from "@invessiv/ui";
import { formatCustomerNumber } from "@invessiv/common/patterns/crm/format-customer-number";
import { CustomerCockpitView } from "@/components/workspace/crm/detail/customer-cockpit-view/customer-cockpit-view";
import type { CustomerCockpitDto } from "@invessiv/common/contracts/crm/customer-cockpit.dto";
import type { PortalAccessDto } from "@invessiv/common/contracts/crm/portal-access.dto";
import type { AccessScopeEntryDto } from "@invessiv/common/contracts/auth/access-scope-entry.dto";
import type { AccessProjectOptionDto } from "@invessiv/common/contracts/auth/access-project-option.dto";
import type { RoleAssignmentOptionDto } from "@invessiv/common/contracts/auth/role-assignment-option.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import type {
  CrmAccessDictionary,
  CrmCockpitDictionary,
  CrmPortalAccessDictionary,
  CrmProjectLineItemsDictionary,
  CrmTasksDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import type { SettingsPermissionsDictionary } from "@/i18n/dictionaries/workspace/settings";
import type { ProjectLineItemsViewModel } from "@/common/contracts/crm/project-line-items-view-model";
import type { TasksViewModel } from "@/common/contracts/crm/tasks-view-model";
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
  customer: CustomerCockpitDto;
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
  customer,
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
        customer={customer}
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
        portalAccess={portalAccess}
        portalAccessContent={portalAccessContent}
      />
    </Dialog>
  );
}
