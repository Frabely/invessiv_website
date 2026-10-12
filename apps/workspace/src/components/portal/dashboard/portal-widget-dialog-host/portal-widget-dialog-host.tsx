"use client";

import type { ReactNode } from "react";
import { Dialog, DialogSize } from "@invessiv/ui";
import { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import type { PortalDashboardDictionary } from "@/i18n/dictionaries/portal";

export type PortalWidgetDialogHostProps = {
  content: PortalDashboardDictionary;
  /** The complete credentials dialog; null when the reader may not see credentials. */
  credentialsDialog: ReactNode;
  /** Full content of the customer task dialog, built by the dashboard that owns the task state. */
  customerTasksContent: ReactNode;
  /** The complete hours dialog; null when the reader may not see hours or there are none. */
  hoursDialog: ReactNode;
  onCloseAction: () => void;
  /** The complete service request dialog; null when the reader may not see services. */
  serviceRequestDialog: ReactNode;
  /** The complete request dialog of the "our tasks" widget; null when the reader may not create. */
  taskRequestDialog: ReactNode;
  /** The dialog widget named in `?widget`; null keeps every dialog closed. */
  widgetKey: PortalWidgetKey | null;
};

/** Renders the one dialog the URL asks for. Closing removes the parameter, so Back closes too. */
export function PortalWidgetDialogHost({
  content,
  credentialsDialog,
  customerTasksContent,
  hoursDialog,
  onCloseAction,
  serviceRequestDialog,
  taskRequestDialog,
  widgetKey,
}: PortalWidgetDialogHostProps) {
  if (widgetKey === PortalWidgetKey.OurTasks) return taskRequestDialog;
  if (widgetKey === PortalWidgetKey.Credentials) return credentialsDialog;
  if (widgetKey === PortalWidgetKey.Hours) return hoursDialog;
  if (widgetKey === PortalWidgetKey.ServiceRequest) return serviceRequestDialog;
  if (widgetKey !== PortalWidgetKey.CustomerTasks) return null;

  return (
    <Dialog
      closeLabel={content.dialog.close}
      onCloseAction={onCloseAction}
      size={DialogSize.Wide}
      title={content.widgets.customerTasks.title}
    >
      {customerTasksContent}
    </Dialog>
  );
}
