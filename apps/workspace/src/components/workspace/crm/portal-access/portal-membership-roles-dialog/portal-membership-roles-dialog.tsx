"use client";

import { useState } from "react";
import { ButtonControl, Dialog, DialogSize } from "@invessiv/ui";
import type { PortalAccessDto } from "@invessiv/common/contracts/crm/portal-access.dto";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { portalAccessApiService } from "@/client/crm/portal-access-api-service";
import { portalRoleLabel } from "@/common/patterns/crm/portal-role-label";
import { portalAccessErrorMessage } from "@/common/patterns/crm/portal-access-error-message";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import type { CrmPortalAccessDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./portal-membership-roles-dialog.module.css";

export interface PortalMembershipRolesDialogProps {
  membership: PortalAccessDto["memberships"][number];
  roles: PortalAccessDto["roles"];
  content: CrmPortalAccessDictionary;
  onCloseAction: () => void;
}

export function PortalMembershipRolesDialog({
  membership,
  roles,
  content,
  onCloseAction,
}: PortalMembershipRolesDialogProps) {
  const [selected, setSelected] = useState<string[]>(
    membership.roleIds.filter((id) =>
      roles.some((role) => role.id === id && role.active),
    ),
  );
  const [validation, setValidation] = useState(false);
  const mutation = useVersionedMutation(membership, onCloseAction);

  async function save() {
    setValidation(true);
    if (selected.length === 0) return;
    await mutation.submit(async (current) => {
      const result = await portalAccessApiService.replaceRoles(current.id, {
        version: current.version,
        roleIds: selected,
      });
      if (!result.ok) {
        if (result.current) {
          return {
            ok: false,
            code: ConcurrencyErrorCode.VersionConflict,
            current: { ...current, ...result.current },
          };
        }
        return { ok: false, code: result.code };
      }
      return {
        ok: true,
        current: { ...current, ...result.value.membership, roleIds: selected },
      };
    });
  }

  return (
    <Dialog
      title={content.dialog.rolesTitle}
      description={content.dialog.rolesHint}
      closeLabel={content.dialog.close}
      onCloseAction={mutation.close}
      size={DialogSize.Narrow}
      footer={
        <>
          <ButtonControl type="button" variant="ghost" onClick={mutation.close}>
            {content.dialog.cancel}
          </ButtonControl>
          <ButtonControl
            type="button"
            disabled={mutation.isSubmitting}
            onClick={() => void save()}
          >
            {content.dialog.save}
          </ButtonControl>
        </>
      }
    >
      <fieldset className={styles.options}>
        <legend>{content.dialog.role}</legend>
        {roles
          .filter((role) => role.active)
          .map((role) => (
            <label className={styles.option} key={role.id}>
              <input
                type="checkbox"
                checked={selected.includes(role.id)}
                onChange={() =>
                  setSelected((current) =>
                    current.includes(role.id)
                      ? current.filter((id) => id !== role.id)
                      : [...current, role.id],
                  )
                }
              />
              {portalRoleLabel(role, content.portalStandard)}
            </label>
          ))}
      </fieldset>
      {validation && selected.length === 0 ? (
        <p role="alert">{content.errors.roles}</p>
      ) : null}
      {mutation.hasConflict ? (
        <p role="alert">{content.errors.conflict}</p>
      ) : null}
      {mutation.errorCode ? (
        <p role="alert">
          {portalAccessErrorMessage(mutation.errorCode, content)}
        </p>
      ) : null}
    </Dialog>
  );
}
