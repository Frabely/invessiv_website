"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

import { ButtonControl, Dialog, DialogSize } from "@invessiv/ui";
import { CustomerCockpitView } from "@/components/workspace/crm/detail/customer-cockpit-view/customer-cockpit-view";
import type { CustomerCockpitDto } from "@invessiv/common/contracts/crm/customer-cockpit.dto";
import type { ProjectDto } from "@invessiv/common/contracts/crm/project.dto";
import type { AccessScopeEntryDto } from "@invessiv/common/contracts/auth/access-scope-entry.dto";
import type { AccessProjectOptionDto } from "@invessiv/common/contracts/auth/access-project-option.dto";
import type { RoleAssignmentOptionDto } from "@invessiv/common/contracts/auth/role-assignment-option.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import type {
  CrmAccessDictionary,
  CrmCockpitDictionary,
  CrmProjectLineItemsDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import type { SettingsPermissionsDictionary } from "@/i18n/dictionaries/workspace/settings";
import type { ProjectLineItemsViewModel } from "@/common/contracts/crm/project-line-items-view-model";
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
  projects?: ProjectDto[] | null;
  permissionsContent?: SettingsPermissionsDictionary;
  projectOwnerHasAccess?: Readonly<Record<string, boolean>>;
  projectLineItems?: ProjectLineItemsViewModel;
  projectLineItemsContent?: CrmProjectLineItemsDictionary;
  rolesHref?: string;
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
}: CustomerCockpitDialogProps) {
  const router = useRouter();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  function close() {
    router.replace(closeHref, { scroll: false });
  }

  return (
    <Dialog
      closeLabel={content.close}
      description={undefined}
      footer={
        <ButtonControl
          onClick={close}
          ref={closeButtonRef}
          type="button"
          variant="ghost"
        >
          {content.close}
        </ButtonControl>
      }
      initialFocusRef={closeButtonRef}
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
      />
    </Dialog>
  );
}
