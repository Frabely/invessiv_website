"use client";

import { useEffect, useState } from "react";

import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { OwnBookingUrlDto } from "@invessiv/common/contracts/auth/own-booking-url.dto";
import { ButtonControl, Dialog, DialogSize } from "@invessiv/ui";
import { accessApiService } from "@/client/access/access-api-service";
import { DialogMessageTone } from "@/common/constants/ui/dialog-message-tones";
import type { BookingUrlSaveResult } from "@/common/contracts/access/booking-url-save-result";
import { BookingUrlDialog } from "@/components/workspace/shared/booking-url-dialog/booking-url-dialog";
import type { WorkspacePageContent } from "@/i18n/dictionaries/workspace";
import styles from "./own-booking-url-dialog.module.css";

type OwnBookingUrlDialogProps = {
  content: WorkspacePageContent["shell"]["bookingUrlDialog"];
  onCloseAction: () => void;
};

async function save(input: OwnBookingUrlDto): Promise<BookingUrlSaveResult> {
  const result = await accessApiService.updateOwnBookingUrl(input);
  if (result.ok) return { ok: true };
  return {
    ok: false,
    current:
      result.code === ConcurrencyErrorCode.VersionConflict
        ? result.current
        : null,
  };
}

/**
 * The signed-in member's own booking link. The link is read when the dialog opens, not with
 * every page: the shell stays free of a query that almost no navigation needs.
 */
export function OwnBookingUrlDialog({
  content,
  onCloseAction,
}: OwnBookingUrlDialogProps) {
  const [own, setOwn] = useState<OwnBookingUrlDto | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void accessApiService.getOwnBookingUrl().then((result) => {
      if (cancelled) return;
      if (result.ok) setOwn(result.own);
      else setLoadFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (own) {
    return (
      <BookingUrlDialog
        initial={own}
        onCloseAction={onCloseAction}
        onSavedAction={() => undefined}
        saveAction={save}
        texts={content}
      />
    );
  }

  return (
    <Dialog
      closeLabel={content.close}
      description={content.description}
      footer={
        <ButtonControl onClick={onCloseAction} type="button" variant="ghost">
          {content.cancel}
        </ButtonControl>
      }
      onCloseAction={onCloseAction}
      size={DialogSize.Narrow}
      title={content.title}
    >
      {loadFailed ? (
        <p
          className={styles.message}
          data-tone={DialogMessageTone.Error}
          role="alert"
        >
          {content.loadError}
        </p>
      ) : (
        <p className={styles.message} role="status">
          {content.loading}
        </p>
      )}
    </Dialog>
  );
}
