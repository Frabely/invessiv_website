"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

import type { CustomerCockpitDto } from "@invessiv/common/contracts/crm/customer-cockpit.dto";
import { ButtonControl, Dialog, DialogSize } from "@invessiv/ui";
import { CustomerStatusBadge } from "@/components/workspace/crm/list/customer-status-badge/customer-status-badge";
import type { CrmCockpitDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatCustomerNumber } from "@invessiv/common/patterns/crm/format-customer-number";
import styles from "./customer-cockpit-dialog.module.css";

type CustomerCockpitDialogProps = {
  closeHref: string;
  content: CrmCockpitDictionary;
  customer: CustomerCockpitDto;
};

export function CustomerCockpitDialog({
  closeHref,
  content,
  customer,
}: CustomerCockpitDialogProps) {
  const router = useRouter();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  function close() {
    router.replace(closeHref, { scroll: false });
  }

  return (
    <Dialog
      bodyClassName={styles.body}
      closeLabel={content.close}
      description={content.description}
      footer={
        <ButtonControl
          onClick={close}
          ref={closeButtonRef}
          type="button"
          variant="ghost"
        >
          {content.close}
        </ButtonControl>
      }
      initialFocusRef={closeButtonRef}
      onCloseAction={close}
      size={DialogSize.Wide}
      title={content.title}
    >
      <div className={styles.hero}>
        <span className={styles.number}>
          {formatCustomerNumber(customer.customerNumber)}
        </span>
        <h3 className={styles.customerName}>{customer.displayName}</h3>
      </div>
      <div className={styles.grid}>
        <section aria-labelledby="cockpit-status" className={styles.section}>
          <h3 id="cockpit-status">{content.sections.status}</h3>
          <CustomerStatusBadge
            label={content.status[customer.status]}
            status={customer.status}
          />
        </section>
        <section aria-labelledby="cockpit-owner" className={styles.section}>
          <h3 id="cockpit-owner">{content.sections.owner}</h3>
          <p>{customer.ownerDisplayName}</p>
        </section>
        <section
          aria-labelledby="cockpit-contact"
          className={`${styles.section} ${styles.contact}`}
        >
          <h3 id="cockpit-contact">{content.sections.primaryContact}</h3>
          <p>{customer.primaryContactName}</p>
          {customer.primaryContactEmail ? (
            <a href={`mailto:${customer.primaryContactEmail}`}>
              {customer.primaryContactEmail}
            </a>
          ) : (
            <p className={styles.empty}>{content.noEmail}</p>
          )}
        </section>
      </div>
    </Dialog>
  );
}
