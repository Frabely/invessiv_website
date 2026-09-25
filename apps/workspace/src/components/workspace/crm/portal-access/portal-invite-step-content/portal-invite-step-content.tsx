import {
  ButtonControl,
  CheckboxControl,
  CustomSelect,
  FormField,
} from "@invessiv/ui";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import type { PortalAccessDto } from "@invessiv/common/contracts/crm/portal-access.dto";
import type { CrmPortalAccessDictionary } from "@/i18n/dictionaries/workspace/crm";
import type { SettingsPermissionsDictionary } from "@/i18n/dictionaries/workspace/settings";
import { resolveRoleLabel } from "@/lib/workspace/access/role-label";
import { PortalInvitationPreview } from "../portal-invitation-preview/portal-invitation-preview";
import styles from "./portal-invite-step-content.module.css";

type Props = {
  access: PortalAccessDto;
  content: CrmPortalAccessDictionary;
  permissionsContent: SettingsPermissionsDictionary;
  baseId: string;
  assignmentId: string;
  roleIds: readonly string[];
  contactName: string;
  permittedAreas: readonly string[];
  preview: boolean;
  inviteUrl: string | null;
  copied: boolean;
  onAssignmentChange: (assignmentId: string) => void;
  onRoleToggle: (roleId: string) => void;
  onCopy: () => void;
};

function InvitationForm({
  access,
  content,
  permissionsContent,
  assignmentId,
  onAssignmentChange,
  roleIds,
  onRoleToggle,
  baseId,
}: Pick<
  Props,
  | "access"
  | "content"
  | "permissionsContent"
  | "assignmentId"
  | "onAssignmentChange"
  | "roleIds"
  | "onRoleToggle"
  | "baseId"
>) {
  return (
    <div className={styles.stack}>
      <FormField
        kind={FormFieldKind.Custom}
        label={content.dialog.contact}
        renderControl={({ describedBy, id, invalid }) => (
          <CustomSelect
            describedBy={describedBy}
            id={id}
            invalid={invalid}
            onChange={onAssignmentChange}
            options={[
              { label: content.dialog.contactPlaceholder, value: "" },
              ...access.contacts.map((contact) => ({
                label: contact.displayName,
                value: contact.assignmentId,
              })),
            ]}
            value={assignmentId}
          />
        )}
      />
      <fieldset className={styles.roles}>
        <legend>{content.dialog.role}</legend>
        {access.roles
          .filter((role) => role.active)
          .map((role) => {
            const inputId = `${baseId}-role-${role.id}`;
            return (
              <div className={styles.role} key={role.id}>
                <CheckboxControl
                  checked={roleIds.includes(role.id)}
                  id={inputId}
                  onChange={() => onRoleToggle(role.id)}
                />
                <label htmlFor={inputId}>
                  {resolveRoleLabel(role, permissionsContent)}
                </label>
              </div>
            );
          })}
      </fieldset>
    </div>
  );
}

function OneTimeInviteLink({
  inviteUrl,
  copied,
  content,
  onCopy,
}: Pick<Props, "inviteUrl" | "copied" | "content" | "onCopy">) {
  return (
    <div className={styles.stack}>
      <p>{content.dialog.linkHint}</p>
      <output className={styles.link}>{inviteUrl}</output>
      <ButtonControl type="button" onClick={onCopy}>
        {copied ? content.dialog.copied : content.dialog.copy}
      </ButtonControl>
    </div>
  );
}

export function PortalInviteStepContent(props: Props) {
  if (props.inviteUrl) return <OneTimeInviteLink {...props} />;
  if (props.preview)
    return (
      <PortalInvitationPreview
        content={props.content}
        permissionsContent={props.permissionsContent}
        contactName={props.contactName}
        roles={props.access.roles.filter(
          (role) => role.active && props.roleIds.includes(role.id),
        )}
        permittedAreas={props.permittedAreas}
      />
    );
  return <InvitationForm {...props} />;
}
