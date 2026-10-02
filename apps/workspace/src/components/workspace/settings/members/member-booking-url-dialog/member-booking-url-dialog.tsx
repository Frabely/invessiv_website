"use client";

import { useRouter } from "next/navigation";

import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { OwnBookingUrlDto } from "@invessiv/common/contracts/auth/own-booking-url.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { accessApiService } from "@/client/access/access-api-service";
import type { BookingUrlSaveResult } from "@/common/contracts/access/booking-url-save-result";
import { BookingUrlDialog } from "@/components/workspace/shared/booking-url-dialog/booking-url-dialog";
import type { SettingsMembersDictionary } from "@/i18n/dictionaries/workspace/settings";

type MemberBookingUrlDialogProps = {
  content: SettingsMembersDictionary;
  member: WorkspaceMemberDto;
  onCloseAction: () => void;
};

/** The booking link of another member, edited by someone with `members.manage`. */
export function MemberBookingUrlDialog({
  content,
  member,
  onCloseAction,
}: MemberBookingUrlDialogProps) {
  const router = useRouter();
  const text = content.bookingUrlDialog;
  const named = { name: member.displayName };

  async function save(input: OwnBookingUrlDto): Promise<BookingUrlSaveResult> {
    const result = await accessApiService.updateMemberBookingUrl(
      member.id,
      input,
    );
    if (result.ok) return { ok: true };
    return {
      ok: false,
      current:
        result.code === ConcurrencyErrorCode.VersionConflict
          ? {
              bookingUrl: result.current.bookingUrl,
              version: result.current.version,
            }
          : null,
    };
  }

  return (
    <BookingUrlDialog
      initial={{ bookingUrl: member.bookingUrl, version: member.version }}
      onCloseAction={onCloseAction}
      onSavedAction={() => router.refresh()}
      saveAction={save}
      texts={{
        ...text,
        title: formatMessage(text.title, named),
        description: formatMessage(text.description, named),
      }}
    />
  );
}
