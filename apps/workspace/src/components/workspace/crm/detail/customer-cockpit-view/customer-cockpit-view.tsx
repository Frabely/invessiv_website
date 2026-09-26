"use client";

import { useId, useState } from "react";
import { faEnvelope, faUserTie } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { CustomerCockpitDto } from "@invessiv/common/contracts/crm/customer-cockpit.dto";
import type { PortalAccessDto } from "@invessiv/common/contracts/crm/portal-access.dto";
import { PortalAccessSection } from "@/components/workspace/crm/portal-access/portal-access-section/portal-access-section";
import type { AccessScopeEntryDto } from "@invessiv/common/contracts/auth/access-scope-entry.dto";
import type { AccessProjectOptionDto } from "@invessiv/common/contracts/auth/access-project-option.dto";
import type { RoleAssignmentOptionDto } from "@invessiv/common/contracts/auth/role-assignment-option.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { CustomerProjectsSection } from "@/components/workspace/crm/projects/customer-projects-section/customer-projects-section";
import { CustomerAccessSection } from "@/components/workspace/crm/detail/customer-access-section/customer-access-section";
import { CustomerChatDock } from "@/components/workspace/crm/detail/customer-chat-dock/customer-chat-dock";
import { MockSectionCard } from "@/components/workspace/crm/shared/mock-section-card/mock-section-card";
import { OwnerWithoutAccessBadge } from "@/components/workspace/crm/shared/owner-without-access-badge/owner-without-access-badge";
import { CustomerStatusBadge } from "@/components/workspace/crm/list/customer-status-badge/customer-status-badge";
import { formatCustomerNumber } from "@invessiv/common/patterns/crm/format-customer-number";
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
import { formatMessage } from "@/lib/i18n/format-message";
import { formatEuroCents } from "@/lib/workspace/crm/format-service-price";
import { taskDueStateService } from "@/lib/workspace/crm/task-due-state-service";
import styles from "./customer-cockpit-view.module.css";

type FutureCustomerSection = keyof CrmCockpitDictionary["futureSections"];

const COLLABORATION_MOCKS: readonly FutureCustomerSection[] = [
  "files",
  "hours",
];

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
  /** False inside the dialog, whose chrome already names the customer. */
  showHeading?: boolean;
  tasks?: TasksViewModel;
  tasksContent?: CrmTasksDictionary;
  portalAccess?: PortalAccessDto;
  portalAccessContent?: CrmPortalAccessDictionary;
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
  showHeading = true,
  tasks,
  tasksContent,
  portalAccess,
  portalAccessContent,
}: CustomerCockpitViewProps) {
  const [requestedAccessMemberId, setRequestedAccessMemberId] = useState<
    string | null
  >(null);
  const collaborationLabelId = useId();
  const accessSecurityLabelId = useId();
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
  const taskSummary = tasks
    ? taskDueStateService.summarize(tasks.tasks, tasks.today)
    : null;

  function renderMock(section: FutureCustomerSection) {
    const future = content.futureSections[section];
    return (
      <MockSectionCard
        badgeLabel={content.mock.badge}
        body={future.body}
        key={section}
        labelCollapse={formatMessage(content.collapse.collapse, {
          section: future.title,
        })}
        labelExpand={formatMessage(content.collapse.expand, {
          section: future.title,
        })}
        title={future.title}
      />
    );
  }

  return (
    <div className={styles.view}>
      <div className={styles.content}>
        <header className={styles.head}>
          {showHeading ? (
            <div className={styles.identity}>
              <span className={styles.number}>
                {formatCustomerNumber(customer.customerNumber)}
              </span>
              <h2 className={styles.customerName}>{customer.displayName}</h2>
            </div>
          ) : null}
          <dl className={styles.meta}>
            <div className={styles.metaItem}>
              <dt>{content.sections.status}</dt>
              <dd>
                <CustomerStatusBadge
                  label={content.status[customer.status]}
                  status={customer.status}
                />
              </dd>
            </div>
            <div className={styles.metaItem}>
              <dt>{content.sections.owner}</dt>
              <dd>
                <FontAwesomeIcon
                  aria-hidden="true"
                  className={styles.metaIcon}
                  icon={faUserTie}
                />
                {customer.ownerDisplayName}
                {customerOwnerHasAccess === false &&
                customerOwnerMemberId &&
                canOpenAccessDialog ? (
                  <OwnerWithoutAccessBadge
                    content={content.ownerAccess}
                    onGrantAccessAction={
                      canGrantCustomerOwnerAccess
                        ? () =>
                            setRequestedAccessMemberId(customerOwnerMemberId)
                        : undefined
                    }
                  />
                ) : null}
              </dd>
            </div>
            <div className={styles.metaItem}>
              <dt>{content.sections.primaryContact}</dt>
              <dd>
                <FontAwesomeIcon
                  aria-hidden="true"
                  className={styles.metaIcon}
                  icon={faEnvelope}
                />
                <span>{customer.primaryContactName}</span>
                {customer.primaryContactEmail ? (
                  <a href={`mailto:${customer.primaryContactEmail}`}>
                    {customer.primaryContactEmail}
                  </a>
                ) : (
                  <span className={styles.empty}>{content.noEmail}</span>
                )}
              </dd>
            </div>
          </dl>
          <ul aria-label={content.kpis.label} className={styles.kpis}>
            {projectLineItems && projectLineItemsContent ? (
              <li className={styles.kpi}>
                <span className={styles.kpiLabel}>
                  {content.kpis.customerValue}
                </span>
                <span className={styles.kpiValue}>
                  {formatEuroCents(
                    projectLineItems.customerValue.oneTimeCents,
                    locale,
                  )}
                </span>
                <span className={styles.kpiNote}>
                  {content.kpis.oneTime}
                  {projectLineItems.customerValue.monthlyCents > 0
                    ? ` + ${formatEuroCents(projectLineItems.customerValue.monthlyCents, locale)} ${content.kpis.monthly}`
                    : null}
                </span>
              </li>
            ) : null}
            {taskSummary ? (
              <li className={styles.kpi}>
                <span className={styles.kpiLabel}>
                  {content.kpis.openTasks}
                </span>
                <span className={styles.kpiValue}>{taskSummary.open}</span>
                {taskSummary.overdue > 0 ? (
                  <span className={styles.kpiNote} data-tone="attention">
                    {formatMessage(content.kpis.overdueTasks, {
                      count: String(taskSummary.overdue),
                    })}
                  </span>
                ) : null}
              </li>
            ) : null}
            {[content.kpis.hoursLeft, content.kpis.openFeedback].map(
              (label) => (
                <li className={styles.kpi} data-mock="true" key={label}>
                  <span className={styles.kpiLabel}>{label}</span>
                  <span className={styles.kpiValue}>
                    {content.kpis.mockValue}
                  </span>
                  <span className={styles.kpiNote}>{content.mock.badge}</span>
                </li>
              ),
            )}
          </ul>
        </header>
        <div className={styles.columns}>
          <div className={styles.main}>
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
                tasks={tasks}
                tasksContent={tasksContent}
              />
            ) : null}
          </div>
          <div className={styles.aside}>
            <div
              aria-labelledby={collaborationLabelId}
              className={styles.group}
              role="group"
            >
              <p className={styles.groupLabel} id={collaborationLabelId}>
                {content.groups.collaboration}
              </p>
              {COLLABORATION_MOCKS.map(renderMock)}
            </div>
            <div
              aria-labelledby={accessSecurityLabelId}
              className={styles.group}
              role="group"
            >
              <p className={styles.groupLabel} id={accessSecurityLabelId}>
                {content.groups.accessSecurity}
              </p>
              {portalAccess && portalAccessContent && permissionsContent ? (
                <PortalAccessSection
                  access={portalAccess}
                  content={portalAccessContent}
                  permissionsContent={permissionsContent}
                  locale={locale}
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
                  onRequestedDialogCloseAction={() =>
                    setRequestedAccessMemberId(null)
                  }
                />
              ) : null}
              {renderMock("credentials")}
            </div>
          </div>
        </div>
      </div>
      <CustomerChatDock
        badgeLabel={content.mock.badge}
        className={styles.chat}
        content={content.chat}
      />
    </div>
  );
}
