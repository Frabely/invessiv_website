import type { PortalRoleDto } from "@invessiv/common/contracts/crm/portal-role.dto";
import { portalRoleLabel } from "@/common/patterns/crm/portal-role-label";
import type { CrmPortalAccessDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./portal-invitation-preview.module.css";

export interface PortalInvitationPreviewProps {
  content: CrmPortalAccessDictionary;
  contactName: string;
  roles: readonly PortalRoleDto[];
  permittedAreas: readonly string[];
}

export function PortalInvitationPreview({
  content,
  contactName,
  roles,
  permittedAreas,
}: PortalInvitationPreviewProps) {
  return (
    <div className={styles.preview}>
      <dl className={styles.details}>
        <div>
          <dt>{content.dialog.contact}</dt>
          <dd>{contactName}</dd>
        </div>
        <div>
          <dt>{content.dialog.role}</dt>
          <dd>
            <ul>
              {roles.map((role) => (
                <li key={role.id}>
                  {portalRoleLabel(role, content.portalStandard)}
                </li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt>{content.dialog.previewAreas}</dt>
          <dd>
            {permittedAreas.length > 0 ? (
              <ul>
                {permittedAreas.map((area) => (
                  <li key={area}>{area}</li>
                ))}
              </ul>
            ) : (
              content.dialog.previewNoAreas
            )}
          </dd>
        </div>
      </dl>
      <p className={styles.private}>{content.dialog.previewPrivate}</p>
    </div>
  );
}
