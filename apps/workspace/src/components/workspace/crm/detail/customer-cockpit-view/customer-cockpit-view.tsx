"use client";

import { useState } from "react";
import type { CustomerCockpitDto } from "@invessiv/common/contracts/crm/customer-cockpit.dto";
import type { AccessScopeEntryDto } from "@invessiv/common/contracts/auth/access-scope-entry.dto";
import type { AccessProjectOptionDto } from "@invessiv/common/contracts/auth/access-project-option.dto";
import type { RoleAssignmentOptionDto } from "@invessiv/common/contracts/auth/role-assignment-option.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { CustomerProjectsSection } from "@/components/workspace/crm/projects/customer-projects-section/customer-projects-section";
import { CustomerAccessSection } from "@/components/workspace/crm/detail/customer-access-section/customer-access-section";
import { OwnerWithoutAccessBadge } from "@/components/workspace/crm/shared/owner-without-access-badge/owner-without-access-badge";
import { formatCustomerNumber } from "@invessiv/common/patterns/crm/format-customer-number";
import type {
  CrmAccessDictionary,
  CrmCockpitDictionary,
  CrmProjectLineItemsDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import type { SettingsPermissionsDictionary } from "@/i18n/dictionaries/workspace/settings";
import type { ProjectLineItemsViewModel } from "@/common/contracts/crm/project-line-items-view-model";
import type { CockpitProjectDto } from "@/common/contracts/crm/cockpit-project.dto";
import type { Locale } from "@/config/i18n";
import styles from "./customer-cockpit-view.module.css";

type CustomerCockpitViewProps = {
  accessContent?: CrmAccessDictionary;
  accessProjects?: readonly AccessProjectOptionDto[];
  accessRoles?: readonly RoleAssignmentOptionDto[];
  accessScopes?: readonly AccessScopeEntryDto[];
  accessMembers?: readonly WorkspaceMemberDto[];
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
};

/** The shared customer detail content for the CRM dialog and future dashboard view. */
export function CustomerCockpitView({
  accessContent,
  accessMembers,
  accessProjects,
  accessRoles,
  accessScopes,
  content,
  customer,
  customerOwnerHasAccess,
  customerOwnerMemberId,
  locale,
  canWriteProjects = false,
  projects = null,
  permissionsContent,
  projectOwnerHasAccess,
  projectLineItems,
  projectLineItemsContent,
  rolesHref,
}: CustomerCockpitViewProps) {
  const [requestedAccessMemberId, setRequestedAccessMemberId] = useState<
    string | null
  >(null);
  const canOpenAccessDialog = Boolean(
    accessContent &&
    accessMembers &&
    accessProjects &&
    accessRoles &&
    accessScopes &&
    permissionsContent &&
    rolesHref,
  );
  const canGrantCustomerOwnerAccess = Boolean(
    customerOwnerMemberId &&
    accessMembers?.some(
      (member) => member.id === customerOwnerMemberId && member.active,
    ),
  );

  return (
    <div className={styles.view}>
      <header className={styles.hero}>
        <span className={styles.number}>
          {formatCustomerNumber(customer.customerNumber)}
        </span>
        <h2 className={styles.customerName}>{customer.displayName}</h2>
      </header>
      <div className={styles.grid}>
        <section className={styles.section}>
          <h3>{content.sections.status}</h3>
          <p>{content.status[customer.status]}</p>
        </section>
        <section className={styles.section}>
          <h3>{content.sections.owner}</h3>
          <p>{customer.ownerDisplayName}</p>
          {customerOwnerHasAccess === false &&
          customerOwnerMemberId &&
          canOpenAccessDialog ? (
            <OwnerWithoutAccessBadge
              content={content.ownerAccess}
              onGrantAccessAction={
                canGrantCustomerOwnerAccess
                  ? () => setRequestedAccessMemberId(customerOwnerMemberId)
                  : undefined
              }
            />
          ) : null}
        </section>
        <section className={`${styles.section} ${styles.contact}`}>
          <h3>{content.sections.primaryContact}</h3>
          <p>{customer.primaryContactName}</p>
          {customer.primaryContactEmail ? (
            <a href={`mailto:${customer.primaryContactEmail}`}>
              {customer.primaryContactEmail}
            </a>
          ) : (
            <p className={styles.empty}>{content.noEmail}</p>
          )}
        </section>
      </div>
      {projects ? (
        <CustomerProjectsSection
          accessMembers={accessMembers}
          canWrite={canWriteProjects}
          content={content}
          customerId={customer.id}
          locale={locale}
          onGrantAccessAction={setRequestedAccessMemberId}
          ownerHasAccess={projectOwnerHasAccess}
          projectLineItems={projectLineItems}
          projectLineItemsContent={projectLineItemsContent}
          projects={projects}
        />
      ) : null}
      {accessContent &&
      accessMembers &&
      accessProjects &&
      accessRoles &&
      accessScopes &&
      permissionsContent &&
      rolesHref ? (
        <CustomerAccessSection
          accessScopes={accessScopes}
          content={accessContent}
          customer={{
            id: customer.id,
            customerNumber: customer.customerNumber,
            displayName: customer.displayName,
          }}
          key={requestedAccessMemberId ?? "customer-access"}
          members={accessMembers}
          permissionsContent={permissionsContent}
          projects={accessProjects}
          roles={accessRoles}
          rolesHref={rolesHref}
          requestedMemberId={requestedAccessMemberId}
          onRequestedDialogCloseAction={() => setRequestedAccessMemberId(null)}
        />
      ) : null}
    </div>
  );
}
