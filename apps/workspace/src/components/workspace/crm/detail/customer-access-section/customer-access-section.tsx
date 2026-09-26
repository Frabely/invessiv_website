"use client";

import { useId, useRef, useState } from "react";
import { faKey } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";
import type { AccessCustomerOptionDto } from "@invessiv/common/contracts/auth/access-customer-option.dto";
import type { AccessProjectOptionDto } from "@invessiv/common/contracts/auth/access-project-option.dto";
import type { AccessScopeEntryDto } from "@invessiv/common/contracts/auth/access-scope-entry.dto";
import type { RoleAssignmentOptionDto } from "@invessiv/common/contracts/auth/role-assignment-option.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { formatCustomerNumber } from "@invessiv/common/patterns/crm/format-customer-number";
import {
  ButtonControl,
  CustomSelect,
  Dialog,
  DialogSize,
  PrimaryCtaButton,
} from "@invessiv/ui";
import type { CrmAccessDictionary } from "@/i18n/dictionaries/workspace/crm";
import type { SettingsPermissionsDictionary } from "@/i18n/dictionaries/workspace/settings";
import { formatMessage } from "@/lib/i18n/format-message";
import { AccessScopeTree } from "@/components/workspace/settings/shared/access-scope-tree/access-scope-tree";
import { SectionCollapseToggle } from "@/components/workspace/crm/shared/section-collapse-toggle/section-collapse-toggle";
import { CustomerAccessAssignmentRow } from "../customer-access-assignment-row/customer-access-assignment-row";
import styles from "./customer-access-section.module.css";

type CustomerAccessSectionProps = {
  accessScopes: readonly AccessScopeEntryDto[];
  content: CrmAccessDictionary;
  customer: AccessCustomerOptionDto;
  members: readonly WorkspaceMemberDto[];
  permissionsContent: SettingsPermissionsDictionary;
  projects: readonly AccessProjectOptionDto[];
  roles: readonly RoleAssignmentOptionDto[];
  rolesHref: string;
  requestedMemberId?: string | null;
  onRequestedDialogCloseAction?: () => void;
};

export function CustomerAccessSection({
  accessScopes,
  content,
  customer,
  members,
  permissionsContent,
  projects,
  roles,
  rolesHref,
  requestedMemberId = null,
  onRequestedDialogCloseAction,
}: CustomerAccessSectionProps) {
  const headingId = useId();
  const memberSelectId = useId();
  const accessFormId = useId();
  const eligibleMembers = members.filter(
    (member) => member.active && !member.isOwner,
  );
  const requestedMember = eligibleMembers.find(
    (member) => member.id === requestedMemberId,
  );
  const [dialogOpen, setDialogOpen] = useState(Boolean(requestedMember));
  const [selectedMemberId, setSelectedMemberId] = useState(
    requestedMember?.id ?? eligibleMembers[0]?.id ?? "",
  );
  const [accessIsDirty, setAccessIsDirty] = useState(false);
  const [accessIsSubmitting, setAccessIsSubmitting] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const bodyId = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const selectedMember =
    eligibleMembers.find((member) => member.id === selectedMemberId) ??
    eligibleMembers[0] ??
    null;
  const membersById = new Map(members.map((member) => [member.id, member]));
  const customerAssignments = accessScopes.filter(
    (assignment) => assignment.scope.type === AccessScopeType.Customer,
  );
  const knownProjects = new Map(
    projects.map((project) => [project.id, project] as const),
  );
  for (const assignment of accessScopes) {
    if (
      assignment.scope.type === AccessScopeType.Project &&
      !knownProjects.has(assignment.scope.projectId)
    ) {
      knownProjects.set(assignment.scope.projectId, {
        id: assignment.scope.projectId,
        customerId: assignment.scope.customerId,
        title: assignment.projectTitle ?? assignment.scope.projectId,
      });
    }
  }

  function openDialog(memberId?: string) {
    triggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    if (memberId) setSelectedMemberId(memberId);
    setDialogOpen(true);
  }

  function closeDialog() {
    setAccessIsDirty(false);
    setAccessIsSubmitting(false);
    setConfirmDiscard(false);
    setDialogOpen(false);
    if (requestedMemberId) onRequestedDialogCloseAction?.();
    queueMicrotask(() => triggerRef.current?.focus());
  }

  function requestCloseDialog() {
    if (accessIsDirty) {
      setConfirmDiscard(true);
      return;
    }
    closeDialog();
  }

  function renderAssignments(
    assignments: readonly AccessScopeEntryDto[],
    scopeLabel: string,
  ) {
    if (assignments.length === 0) {
      return <p className={styles.emptyGroup}>{content.section.emptyGroup}</p>;
    }
    return (
      <ul className={styles.assignments}>
        {assignments.map((assignment) => {
          const member = membersById.get(assignment.workspaceMemberId);
          return member ? (
            <CustomerAccessAssignmentRow
              assignment={assignment}
              content={content}
              key={assignment.id}
              member={member}
              permissionsContent={permissionsContent}
              scopeLabel={scopeLabel}
            />
          ) : null;
        })}
      </ul>
    );
  }

  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <header className={styles.header}>
        <h3 id={headingId}>{content.section.heading}</h3>
        <div className={styles.headMeta}>
          {eligibleMembers.length > 0 ? (
            <PrimaryCtaButton
              className={styles.actionButton}
              onClick={() => openDialog()}
              type="button"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faKey} />
              {content.section.giveAccess}
            </PrimaryCtaButton>
          ) : null}
          <SectionCollapseToggle
            controls={bodyId}
            expanded={expanded}
            labelCollapse={content.section.collapseLabel}
            labelExpand={content.section.expandLabel}
            onToggleAction={() => setExpanded((current) => !current)}
          />
        </div>
      </header>

      {expanded ? (
        <div className={styles.body} id={bodyId}>
          <p className={styles.description}>{content.section.description}</p>
          <div className={styles.groups}>
            <section className={styles.group} data-scope="customer">
              <h4>{content.section.wholeCustomer}</h4>
              {renderAssignments(
                customerAssignments,
                content.section.wholeCustomer,
              )}
            </section>
            {[...knownProjects.values()].map((project) => {
              const heading = formatMessage(content.section.projectHeading, {
                project: project.title,
              });
              const projectAssignments = accessScopes.filter(
                (assignment) =>
                  assignment.scope.type === AccessScopeType.Project &&
                  assignment.scope.projectId === project.id,
              );
              return (
                <section
                  className={styles.group}
                  data-scope="project"
                  key={project.id}
                >
                  <h4>{heading}</h4>
                  {renderAssignments(projectAssignments, heading)}
                  {customerAssignments.length > 0 ? (
                    <p className={styles.inheritedHint}>
                      {content.section.inheritedHint}
                    </p>
                  ) : null}
                </section>
              );
            })}
          </div>

          {eligibleMembers.length === 0 ? (
            <p className={styles.emptyMembers}>
              {content.section.emptyMembers}
            </p>
          ) : null}
        </div>
      ) : null}

      {dialogOpen && selectedMember ? (
        <Dialog
          busy={accessIsSubmitting}
          closeLabel={content.dialog.close}
          description={content.dialog.description}
          eyebrow={`${formatCustomerNumber(customer.customerNumber)} · ${customer.displayName}`}
          footer={
            <>
              <ButtonControl
                disabled={accessIsSubmitting}
                onClick={requestCloseDialog}
                type="button"
                variant="ghost"
              >
                {content.dialog.cancel}
              </ButtonControl>
              <PrimaryCtaButton
                disabled={accessIsSubmitting || !accessIsDirty}
                form={accessFormId}
                type="submit"
              >
                {accessIsSubmitting
                  ? content.dialog.submitting
                  : content.dialog.submit}
              </PrimaryCtaButton>
            </>
          }
          onCloseAction={requestCloseDialog}
          size={DialogSize.Wide}
          title={content.dialog.title}
        >
          <div className={styles.dialogBody}>
            <label className={styles.memberField} htmlFor={memberSelectId}>
              <span>{content.dialog.memberLabel}</span>
              <CustomSelect
                ariaLabel={content.dialog.memberLabel}
                disabled={accessIsDirty || accessIsSubmitting}
                id={memberSelectId}
                onChange={setSelectedMemberId}
                options={eligibleMembers.map((member) => ({
                  label: member.displayName,
                  value: member.id,
                }))}
                value={selectedMember.id}
              />
            </label>
            <AccessScopeTree
              accessContent={content.tree}
              canManageAccess
              fixedCustomer={customer}
              formId={accessFormId}
              initialAccessScopes={accessScopes.filter(
                (assignment) =>
                  assignment.workspaceMemberId === selectedMember.id,
              )}
              key={selectedMember.id}
              member={selectedMember}
              onDirtyChangeAction={setAccessIsDirty}
              onSavedAction={closeDialog}
              onSubmittingChangeAction={setAccessIsSubmitting}
              permissionsContent={permissionsContent}
              roles={roles}
              rolesHref={rolesHref}
            />
          </div>
        </Dialog>
      ) : null}
      {confirmDiscard ? (
        <Dialog
          closeLabel={content.dialog.keepEditing}
          description={content.dialog.discardDescription}
          footer={
            <>
              <ButtonControl
                onClick={() => setConfirmDiscard(false)}
                type="button"
                variant="ghost"
              >
                {content.dialog.keepEditing}
              </ButtonControl>
              <PrimaryCtaButton onClick={closeDialog} type="button">
                {content.dialog.discard}
              </PrimaryCtaButton>
            </>
          }
          onCloseAction={() => setConfirmDiscard(false)}
          size={DialogSize.Narrow}
          title={content.dialog.discardTitle}
        />
      ) : null}
    </section>
  );
}
