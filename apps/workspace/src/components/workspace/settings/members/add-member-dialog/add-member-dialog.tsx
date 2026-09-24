"use client";

import { type SubmitEvent, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";

import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { ClerkCandidateDto } from "@invessiv/common/contracts/auth/clerk-candidate.dto";
import type { RoleAssignmentOptionDto } from "@invessiv/common/contracts/auth/role-assignment-option.dto";
import { accessApiService } from "@/client/access/access-api-service";
import { AccessFieldLimits } from "@/common/constants/access/access-field-limits";
import { selectDefaultRoleIds } from "@/common/patterns/access/role-selection";
import {
  ButtonControl,
  Dialog,
  DialogSize,
  EmptyState,
  PrimaryCtaButton,
} from "@invessiv/ui";
import type {
  SettingsMembersDictionary,
  SettingsPermissionsDictionary,
} from "@/i18n/dictionaries/workspace/settings";
import { RoleChecklist } from "../../shared/role-checklist/role-checklist";
import styles from "./add-member-dialog.module.css";

type AddMemberDialogProps = {
  content: SettingsMembersDictionary;
  onCloseAction: () => void;
  permissionsContent: SettingsPermissionsDictionary;
  roles: RoleAssignmentOptionDto[];
};

const SEARCH_DEBOUNCE_MS = 300;

function toggleId(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((entry) => entry !== id) : [...ids, id];
}

export function AddMemberDialog({
  content,
  onCloseAction,
  permissionsContent,
  roles,
}: AddMemberDialogProps) {
  const router = useRouter();
  const formId = useId();
  const searchId = useId();
  const text = content.addDialog;
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<ClerkCandidateDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<WorkspaceMemberErrorCode | null>(
    null,
  );
  const [clerkUserId, setClerkUserId] = useState<string | null>(null);
  const [roleIds, setRoleIds] = useState<string[]>(() =>
    selectDefaultRoleIds(roles),
  );
  const [showValidation, setShowValidation] = useState(false);
  const [submitError, setSubmitError] =
    useState<WorkspaceMemberErrorCode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(
      async () => {
        setIsLoading(true);
        const result = await accessApiService.listClerkCandidates({ query });
        if (cancelled) {
          return;
        }
        setIsLoading(false);
        if (result.ok) {
          setLoadError(null);
          setCandidates(result.candidates);
          setClerkUserId((current) =>
            result.candidates.some(
              (candidate) => candidate.clerkUserId === current,
            )
              ? current
              : null,
          );
        } else {
          setLoadError(result.code);
          setCandidates([]);
        }
      },
      query ? SEARCH_DEBOUNCE_MS : 0,
    );

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowValidation(true);
    if (!clerkUserId || roleIds.length === 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    const result = await accessApiService.addMember({ clerkUserId, roleIds });
    if (!result.ok) {
      setIsSubmitting(false);
      setSubmitError(
        result.code === ConcurrencyErrorCode.VersionConflict
          ? WorkspaceMemberErrorCode.Internal
          : result.code,
      );
      return;
    }

    router.refresh();
    onCloseAction();
  }

  function renderCandidateStatus() {
    if (isLoading) {
      return <p className={styles.muted}>{text.loading}</p>;
    }
    if (loadError) {
      return (
        <p className={styles.error} role="alert">
          {content.errors[loadError]}
        </p>
      );
    }
    if (candidates.length > 0) {
      return null;
    }
    if (query.trim()) {
      return <p className={styles.muted}>{text.noMatches}</p>;
    }
    return (
      <EmptyState
        description={text.emptyDescription}
        icon={<span aria-hidden="true">+</span>}
        title={text.emptyTitle}
      />
    );
  }

  return (
    <Dialog
      busy={isSubmitting}
      closeLabel={text.close}
      description={text.description}
      footer={
        <>
          <ButtonControl
            disabled={isSubmitting}
            onClick={onCloseAction}
            type="button"
            variant="ghost"
          >
            {text.cancel}
          </ButtonControl>
          <PrimaryCtaButton disabled={isSubmitting} form={formId} type="submit">
            {isSubmitting ? text.submitting : text.submit}
          </PrimaryCtaButton>
        </>
      }
      onCloseAction={onCloseAction}
      size={DialogSize.Narrow}
      title={text.title}
    >
      <form
        className={styles.form}
        id={formId}
        noValidate
        onSubmit={handleSubmit}
      >
        <div className={styles.field}>
          <label className={styles.label} htmlFor={searchId}>
            {text.searchLabel}
          </label>
          <input
            autoComplete="off"
            className={styles.searchInput}
            id={searchId}
            maxLength={AccessFieldLimits.ClerkCandidateQueryMaxLength}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={text.searchPlaceholder}
            type="search"
            value={query}
          />
        </div>

        <fieldset aria-busy={isLoading} className={styles.candidates}>
          <legend className={styles.label}>{text.candidatesLabel}</legend>
          <div aria-live="polite">{renderCandidateStatus()}</div>
          {!isLoading && candidates.length > 0 ? (
            <ul className={styles.candidateList}>
              {candidates.map((candidate) => {
                const disabled = !candidate.primaryEmail;
                const selected = clerkUserId === candidate.clerkUserId;
                return (
                  <li key={candidate.clerkUserId}>
                    <label
                      className={styles.candidate}
                      data-disabled={disabled ? "true" : "false"}
                      data-selected={selected ? "true" : "false"}
                    >
                      <input
                        checked={selected}
                        className={styles.radio}
                        disabled={disabled}
                        name={`${formId}-candidate`}
                        onChange={() => setClerkUserId(candidate.clerkUserId)}
                        type="radio"
                        value={candidate.clerkUserId}
                      />
                      <span className={styles.candidateText}>
                        <span className={styles.candidateName}>
                          {candidate.displayName}
                          {candidate.hasPortalMembership ? (
                            <span className={styles.portalBadge}>
                              {text.portalBadge}
                            </span>
                          ) : null}
                        </span>
                        <span className={styles.candidateMeta}>
                          {candidate.primaryEmail ?? text.noEmail}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {showValidation && !clerkUserId ? (
            <p className={styles.error} role="alert">
              {text.validation.accountRequired}
            </p>
          ) : null}
        </fieldset>

        <RoleChecklist
          errorMessage={
            showValidation && roleIds.length === 0
              ? text.validation.roleRequired
              : undefined
          }
          hint={text.rolesHint}
          inactiveTemplate={content.list.inactiveRole}
          legend={text.rolesLabel}
          onToggleAction={(roleId) =>
            setRoleIds((current) => toggleId(current, roleId))
          }
          permissionsContent={permissionsContent}
          roles={roles}
          selectedRoleIds={roleIds}
        />

        {submitError ? (
          <p className={styles.error} role="alert">
            {content.errors[submitError]}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
