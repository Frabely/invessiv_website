"use client";

import type { ReactNode } from "react";
import { Dialog, DialogSize } from "@invessiv/ui";
import { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import type { PortalDashboardDictionary } from "@/i18n/dictionaries/portal";
import { PortalMockDialogContent } from "../portal-mock-dialog-content/portal-mock-dialog-content";

export type PortalWidgetDialogHostProps = {
  content: PortalDashboardDictionary;
  /** Full content of the customer task dialog, built by the dashboard that owns the task state. */
  customerTasksContent: ReactNode;
  onCloseAction: () => void;
  /** The dialog widget named in `?widget`; null keeps every dialog closed. */
  widgetKey: PortalWidgetKey | null;
};

/** Renders the one dialog the URL asks for. Closing removes the parameter, so Back closes too. */
export function PortalWidgetDialogHost({
  content,
  customerTasksContent,
  onCloseAction,
  widgetKey,
}: PortalWidgetDialogHostProps) {
  if (widgetKey === PortalWidgetKey.CustomerTasks) {
    return (
      <Dialog
        closeLabel={content.mock.dialogClose}
        onCloseAction={onCloseAction}
        size={DialogSize.Wide}
        title={content.widgets.customerTasks.title}
      >
        {customerTasksContent}
      </Dialog>
    );
  }

  const mock =
    widgetKey === PortalWidgetKey.Onboarding ||
    widgetKey === PortalWidgetKey.Feedback ||
    widgetKey === PortalWidgetKey.Hours ||
    widgetKey === PortalWidgetKey.Files ||
    widgetKey === PortalWidgetKey.ServiceRequest
      ? content.widgets[widgetKey]
      : null;
  if (!mock) return null;

  return (
    <Dialog
      closeLabel={content.mock.dialogClose}
      onCloseAction={onCloseAction}
      size={DialogSize.Narrow}
      title={mock.title}
    >
      <PortalMockDialogContent
        intro={content.mock.dialogIntro}
        upcoming={mock.upcoming}
      />
    </Dialog>
  );
}
