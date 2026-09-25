import { ButtonControl, Dialog, DialogSize } from "@invessiv/ui";
import type { CrmPortalAccessDictionary } from "@/i18n/dictionaries/workspace/crm";

export interface RevokePortalMembershipDialogProps {
  content: CrmPortalAccessDictionary;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function RevokePortalMembershipDialog({
  content,
  busy,
  onClose,
  onConfirm,
}: RevokePortalMembershipDialogProps) {
  return (
    <Dialog
      closeLabel={content.dialog.close}
      title={content.dialog.revokeTitle}
      description={content.dialog.revokeHint}
      onCloseAction={onClose}
      size={DialogSize.Narrow}
      footer={
        <>
          <ButtonControl type="button" variant="ghost" onClick={onClose}>
            {content.dialog.cancel}
          </ButtonControl>
          <ButtonControl type="button" disabled={busy} onClick={onConfirm}>
            {content.dialog.revokeConfirm}
          </ButtonControl>
        </>
      }
    >
      <p>{content.dialog.revokeHint}</p>
    </Dialog>
  );
}
