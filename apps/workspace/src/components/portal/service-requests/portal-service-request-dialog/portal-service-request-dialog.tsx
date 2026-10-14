"use client";

import type { PortalServiceRequestsDictionary } from "@/common/contracts/portal/portal-service-requests-dictionary";
import { useEffect, useId, useRef, useState } from "react";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { PortalServiceRequestDto } from "@invessiv/common/contracts/portal/portal-service-request.dto";
import type { PortalServicesDto } from "@invessiv/common/contracts/portal/portal-services.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import {
  ButtonControl,
  ConfirmDialog,
  Dialog,
  DialogSize,
  TabList,
} from "@invessiv/ui";
import { portalServiceRequestsApiService } from "@/client/portal/portal-service-requests-api-service";
import { PORTAL_SERVICE_REQUEST_CUSTOM } from "@/common/constants/portal/portal-dashboard-query-params";
import { PortalOwnerNotice } from "@/components/portal/portal-owner-notice/portal-owner-notice";
import type { Locale } from "@/config/i18n";
import { PortalServicePicker } from "../portal-service-picker/portal-service-picker";
import { PortalServiceRequestForm } from "../portal-service-request-form/portal-service-request-form";
import { PortalServiceRequestList } from "../portal-service-request-list/portal-service-request-list";
import { FormNotice } from "@invessiv/ui";
import styles from "./portal-service-request-dialog.module.css";

export type PortalServiceRequestDialogProps = {
  /** Set only in the owner view, which reads and never sends. */
  cockpitHref: string | null;
  content: PortalServiceRequestsDictionary;
  customerId: string;
  /** What `?service` named when the dialog opened: a catalog id, the free-text value or null. */
  initialSelection: string | null;
  locale: Locale;
  /**
   * Something was sent or withdrawn; the dashboard announces the message, drops the selection from
   * the URL and reloads, so `services` arrives with the changed list.
   */
  onChangedAction: (announcement: string) => void;
  onCloseAction: () => void;
  /** Mirrors the selection into the URL without a server roundtrip; null clears it. */
  onSelectionChangeAction: (selection: string | null) => void;
  /** The project the dashboard shows; the form preselects it where the service allows. */
  selectedProjectId: string | null;
  /** Catalog, projects and own requests as the dashboard loaded them. */
  services: PortalServicesDto;
};

const Tab = { Request: "request", Mine: "mine" } as const;
type Tab = (typeof Tab)[keyof typeof Tab];

/**
 * Requesting a service as a dialog of the dashboard; there is no page of its own. One tab asks
 * (selection, then form, then confirmation), the other lists the company's requests. Selection and
 * confirmation replace each other and withdrawing replaces the dialog with its confirmation, so
 * there are never two dialogs on top of each other.
 */
export function PortalServiceRequestDialog({
  cockpitHref,
  content,
  customerId,
  initialSelection,
  locale,
  onChangedAction,
  onCloseAction,
  onSelectionChangeAction,
  selectedProjectId,
  services,
}: PortalServiceRequestDialogProps) {
  const baseId = useId();
  const panelId = `${baseId}-panel`;
  const headingId = `${baseId}-heading`;
  const panelRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>(Tab.Request);
  const [selection, setSelection] = useState(initialSelection);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const navigationLocked = sending || uncertain;
  const [withdrawTarget, setWithdrawTarget] =
    useState<PortalServiceRequestDto | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  // Bumped on every step inside the dialog, so the focus follows what just replaced the view.
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step > 0) panelRef.current?.focus();
  }, [step]);

  const service =
    services.services.find((candidate) => candidate.id === selection) ?? null;
  const isCustom = selection === PORTAL_SERVICE_REQUEST_CUSTOM;
  const showsForm = !sent && (isCustom || service !== null);
  const unavailable = selection !== null && !isCustom && service === null;

  function select(next: string | null) {
    if (navigationLocked) return;
    setSelection(next);
    setSent(false);
    onSelectionChangeAction(next);
    setStep((current) => current + 1);
  }

  function showTab(next: Tab) {
    if (navigationLocked) return;
    setTab(next);
    setWithdrawError(null);
    setStep((current) => current + 1);
  }

  async function withdraw(request: PortalServiceRequestDto) {
    setWithdrawing(true);
    const result = await portalServiceRequestsApiService.withdrawRequest(
      customerId,
      request.id,
    );
    setWithdrawing(false);
    setWithdrawTarget(null);
    if (!result.ok) {
      setWithdrawError(content.errors[result.code]);
      return;
    }
    setWithdrawError(null);
    onChangedAction(
      formatMessage(content.list.withdrawn, { title: request.title }),
    );
  }

  if (withdrawTarget)
    return (
      <ConfirmDialog
        busy={withdrawing}
        cancelLabel={content.list.confirm.cancel}
        closeLabel={content.dialog.close}
        confirmLabel={content.list.confirm.confirm}
        description={formatMessage(content.list.confirm.description, {
          title: withdrawTarget.title,
        })}
        onCancelAction={() => setWithdrawTarget(null)}
        onConfirmAction={() => void withdraw(withdrawTarget)}
        title={content.list.confirm.title}
        tone="danger"
      />
    );

  const ownerNotice = cockpitHref ? (
    <PortalOwnerNotice
      cockpitHref={cockpitHref}
      hint={content.dialog.ownerHint}
      id={`${baseId}-owner`}
      linkLabel={content.dialog.ownerLink}
    />
  ) : null;
  const readOnlyNotice =
    ownerNotice ??
    (services.canRequest ? null : (
      <p className={styles.readOnly}>{content.dialog.readOnlyHint}</p>
    ));

  return (
    <Dialog
      busy={navigationLocked}
      closeLabel={content.dialog.close}
      description={content.dialog.intro}
      onCloseAction={onCloseAction}
      size={DialogSize.Wide}
      title={content.dialog.title}
    >
      <div className={styles.body}>
        <TabList
          activeValue={tab}
          ariaLabel={content.dialog.tabsLabel}
          disabled={navigationLocked}
          items={[
            {
              value: Tab.Request,
              id: `${baseId}-${Tab.Request}`,
              panelId,
              label: content.dialog.tabs.request,
            },
            {
              value: Tab.Mine,
              id: `${baseId}-${Tab.Mine}`,
              panelId,
              label: formatMessage(content.dialog.tabs.mine, {
                count: services.requests.length,
              }),
              accessibleName: content.dialog.tabs.mineName,
            },
          ]}
          onSelectAction={showTab}
        />
        <div
          aria-labelledby={`${baseId}-${tab}`}
          className={styles.panel}
          id={panelId}
          ref={panelRef}
          role="tabpanel"
          tabIndex={-1}
        >
          {tab === Tab.Mine ? (
            <>
              {withdrawError ? (
                <FormNotice role="alert">{withdrawError}</FormNotice>
              ) : null}
              <PortalServiceRequestList
                content={content.list}
                locale={locale}
                onWithdrawAction={setWithdrawTarget}
                ownerNotice={ownerNotice}
                requests={services.requests}
              />
            </>
          ) : sent ? (
            <div className={styles.sent} role="status">
              <FontAwesomeIcon
                aria-hidden="true"
                className={styles.sentIcon}
                icon={faCircleCheck}
              />
              <h3 className={styles.sentTitle}>{content.sent.title}</h3>
              <p className={styles.sentText}>{content.sent.description}</p>
              <div className={styles.sentActions}>
                <ButtonControl
                  onClick={() => showTab(Tab.Mine)}
                  type="button"
                  variant="primary"
                >
                  {content.sent.mine}
                </ButtonControl>
                <ButtonControl
                  onClick={() => select(null)}
                  type="button"
                  variant="ghost"
                >
                  {content.sent.another}
                </ButtonControl>
              </div>
            </div>
          ) : showsForm ? (
            <PortalServiceRequestForm
              busy={sending}
              canRequest={services.canRequest}
              content={content.form}
              customerId={customerId}
              errorTexts={content.errors}
              headingId={headingId}
              key={selection}
              onBackAction={() => select(null)}
              onBusyChangeAction={setSending}
              onUncertainChangeAction={setUncertain}
              onSentAction={(title) => {
                setSent(true);
                setStep((current) => current + 1);
                onChangedAction(
                  formatMessage(content.sent.announce, { title }),
                );
              }}
              preferredProjectId={selectedProjectId}
              projects={services.projects}
              readOnlyNotice={readOnlyNotice}
              service={service}
              title={service?.title ?? content.picker.customTitle}
            />
          ) : (
            <>
              {unavailable ? (
                <FormNotice role="status">
                  {content.form.unavailable}
                </FormNotice>
              ) : null}
              <PortalServicePicker
                content={content.picker}
                headingId={headingId}
                onSelectAction={select}
                services={services.services}
              />
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
}
