"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import type { FileAttachmentDto } from "@invessiv/common/contracts/files/file-attachment.dto";
import type { PortalOnboardingCallDto } from "@invessiv/common/contracts/portal/portal-onboarding-call.dto";
import type { PortalOnboardingFormDto } from "@invessiv/common/contracts/portal/portal-onboarding-form.dto";
import type { Locale } from "@/config/i18n";
import { usePortalFileDownloads } from "@/hooks/portal/use-portal-file-downloads";
import type {
  PortalFilesDictionary,
  PortalOnboardingDictionary,
} from "@/i18n/dictionaries/portal";
import { OnboardingFormEditor } from "../onboarding-form-editor/onboarding-form-editor";
import { OnboardingFormReader } from "../onboarding-form-reader/onboarding-form-reader";
import styles from "./onboarding-form-view.module.css";

export type OnboardingFormViewProps = {
  /** Where the back link leads: the dashboard of the company. */
  backHref: string;
  /** The onboarding call once the team has reviewed the form; null until then and afterwards. */
  call?: PortalOnboardingCallDto | null;
  /** The company's chat page; null without `portal.messages.read`. */
  chatHref?: string | null;
  /** Upload files as well, which needs `portal.files.write` and never the owner view. */
  canUpload: boolean;
  /** CRM link for the owner view; null for customer contacts. */
  cockpitHref: string | null;
  content: PortalOnboardingDictionary;
  customerId: string;
  /** File texts and errors for uploads, downloads and previews of attached files. */
  filesContent: PortalFilesDictionary;
  /** The company's files page, where files go once the form is completed; null without `portal.files.read`. */
  filesHref?: string | null;
  form: PortalOnboardingFormDto;
  locale: Locale;
};

/**
 * The onboarding of one project. Whoever may write right now gets the form, everyone else and
 * every later status the same steps to read. Mount it with `key={customerId}`; the form itself is
 * keyed by its status, so a submission elsewhere replaces it instead of editing a locked form, and
 * by a revision that moves on once the form reported itself stale and the reload has arrived.
 */
export function OnboardingFormView({
  backHref,
  call = null,
  chatHref = null,
  canUpload,
  cockpitHref,
  content,
  customerId,
  filesContent,
  filesHref = null,
  form,
  locale,
}: OnboardingFormViewProps) {
  const router = useRouter();
  const [announcement, setAnnouncement] = useState("");
  // The editor keeps its own copy of the answers. Once it reports that the server holds something
  // else, the next form the reload brings starts it over; any other refresh leaves it alone.
  const [staleForm, setStaleForm] = useState<PortalOnboardingFormDto | null>(
    null,
  );
  const [revision, setRevision] = useState(0);
  if (staleForm !== null && staleForm !== form) {
    setStaleForm(null);
    setRevision(revision + 1);
  }
  const downloads = usePortalFileDownloads<FileAttachmentDto>(
    customerId,
    filesContent.errors,
  );
  const files = {
    loadPreviewAction: downloads.loadPreview,
    locale,
    onDownloadAction: downloads.download,
    texts: filesContent,
  };
  const editable = form.editableBlockIds.length > 0;
  const downloadError = downloads.actionError ? (
    <p className={styles.error} role="alert">
      {downloads.actionError}
    </p>
  ) : null;

  return (
    <div className={styles.page} data-portal-fixed-head>
      {editable ? (
        <OnboardingFormEditor
          backHref={backHref}
          canUpload={canUpload}
          content={content}
          customerId={customerId}
          files={files}
          filesContent={filesContent}
          form={form}
          key={`${form.id}:${form.status}:${revision}`}
          locale={locale}
          notice={
            <>
              {downloadError}
              {form.status === OnboardingFormStatus.ChangesRequested ? (
                <div className={styles.state}>
                  <h2>{content.states.changes_requested.title}</h2>
                  <p>{content.states.changes_requested.editable}</p>
                </div>
              ) : null}
            </>
          }
          onAnnounceAction={setAnnouncement}
          onStaleAction={() => {
            setStaleForm(form);
            router.refresh();
          }}
        />
      ) : (
        <OnboardingFormReader
          backHref={backHref}
          call={call}
          chatHref={chatHref}
          cockpitHref={cockpitHref}
          content={content}
          files={files}
          filesHref={filesHref}
          form={form}
          locale={locale}
          notice={downloadError}
          onAnnounceAction={setAnnouncement}
        />
      )}
      <p aria-live="polite" className="sr-only" role="status">
        {announcement}
      </p>
    </div>
  );
}
