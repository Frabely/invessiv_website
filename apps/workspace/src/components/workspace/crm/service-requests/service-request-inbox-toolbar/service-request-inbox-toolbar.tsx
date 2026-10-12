"use client";

import { useRouter } from "next/navigation";
import {
  faArrowRotateLeft,
  faBellConcierge,
  faList,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { BadgeTone } from "@invessiv/common/constants/ui/badge-tones";
import { Badge, ButtonControl } from "@invessiv/ui";
import { ServiceRequestInboxFilter as F } from "@/common/constants/crm/service-request-inbox-query-params";
import { buildServiceRequestInboxHref } from "@/common/patterns/crm/service-request-inbox-query";
import { FacetFilter } from "@/components/workspace/shared/toolbar/facet-filter/facet-filter";
import type { CrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./service-request-inbox-toolbar.module.css";

type ServiceRequestInboxToolbarProps = {
  basePath: string;
  content: CrmServiceRequestsDictionary;
  filter: F;
};

const STATUS_SELECT_ID = "service-request-inbox-status";

/** The filter lives in the URL; open requests are the default and leave no parameter behind. */
export function ServiceRequestInboxToolbar({
  basePath,
  content,
  filter,
}: ServiceRequestInboxToolbarProps) {
  const router = useRouter();
  const toolbar = content.toolbar;
  const show = (next: F) =>
    router.push(buildServiceRequestInboxHref(basePath, next), {
      scroll: false,
    });

  return (
    <section aria-label={toolbar.ariaLabel} className={styles.toolbar}>
      <FacetFilter
        activeValue={filter === F.All ? F.All : undefined}
        allOption={{
          chip: (
            <Badge
              icon={faBellConcierge}
              kind="status"
              label={toolbar.status.open}
              tone={BadgeTone.Warning}
            />
          ),
          selectLabel: toolbar.status.open,
        }}
        ariaLabel={toolbar.status.ariaLabel}
        clearLabel={toolbar.clear}
        label={toolbar.status.label}
        onChangeAction={(value) => show(value === F.All ? F.All : F.Open)}
        options={[
          {
            chip: (
              <Badge
                icon={faList}
                kind="status"
                label={toolbar.status.all}
                tone={BadgeTone.Neutral}
              />
            ),
            selectLabel: toolbar.status.all,
            value: F.All,
          },
        ]}
        selectId={STATUS_SELECT_ID}
      />
      <ButtonControl
        className={styles.reset}
        disabled={filter === F.Open}
        onClick={() => show(F.Open)}
        type="button"
        variant="ghost"
      >
        <FontAwesomeIcon aria-hidden="true" icon={faArrowRotateLeft} />
        {toolbar.reset}
      </ButtonControl>
    </section>
  );
}
