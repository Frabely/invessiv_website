"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

import { ButtonControl, Dialog, DialogSize } from "@invessiv/ui";
import { CustomerCockpitView } from "@/components/workspace/crm/detail/customer-cockpit-view/customer-cockpit-view";
import type { CustomerCockpitDto } from "@invessiv/common/contracts/crm/customer-cockpit.dto";
import type { ProjectDto } from "@invessiv/common/contracts/crm/project.dto";
import type { CrmCockpitDictionary } from "@/i18n/dictionaries/workspace/crm";

type CustomerCockpitDialogProps = {
  closeHref: string;
  content: CrmCockpitDictionary;
  customer: CustomerCockpitDto;
  canWriteProjects?: boolean;
  projects?: ProjectDto[] | null;
};

export function CustomerCockpitDialog({
  closeHref,
  content,
  customer,
  canWriteProjects,
  projects,
}: CustomerCockpitDialogProps) {
  const router = useRouter();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  function close() {
    router.replace(closeHref, { scroll: false });
  }

  return (
    <Dialog
      closeLabel={content.close}
      description={undefined}
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
      size={DialogSize.Full}
      title={customer.displayName}
    >
      <CustomerCockpitView
        canWriteProjects={canWriteProjects}
        content={content}
        customer={customer}
        projects={projects}
      />
    </Dialog>
  );
}
