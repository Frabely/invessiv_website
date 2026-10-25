import type { PortalServiceRequestPickerDictionary } from "@/common/contracts/portal/portal-service-request-picker-dictionary";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faChevronRight,
  faCirclePlus,
  faClock,
  faComments,
  faPenToSquare,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import type { PortalRequestableServiceDto } from "@invessiv/common/contracts/portal/portal-requestable-service.dto";
import { PORTAL_SERVICE_REQUEST_CUSTOM } from "@/common/constants/portal/portal-dashboard-query-params";
import { ActionIcon, ButtonControl } from "@invessiv/ui";
import styles from "./portal-service-picker.module.css";

export type PortalServicePickerProps = {
  content: PortalServiceRequestPickerDictionary;
  headingId: string;
  /** Called with a catalog id or `PORTAL_SERVICE_REQUEST_CUSTOM`. */
  onSelectAction: (selection: string) => void;
  services: readonly PortalRequestableServiceDto[];
};

const KIND_ICONS: Record<LineItemKind, IconDefinition> = {
  [LineItemKind.Standard]: faCirclePlus,
  [LineItemKind.Hours]: faClock,
  [LineItemKind.FeedbackRound]: faComments,
};

/**
 * What can be requested: the released catalog entries with their customer text, and always free
 * text last. Never a price. Title and description are catalog text and rendered as plain text.
 */
export function PortalServicePicker({
  content,
  headingId,
  onSelectAction,
  services,
}: PortalServicePickerProps) {
  const options = [
    ...services.map((service) => ({
      id: service.id,
      icon: KIND_ICONS[service.kind],
      kind:
        service.kind === LineItemKind.Standard
          ? null
          : content.kind[service.kind],
      title: service.title,
      description: service.description,
    })),
    {
      id: PORTAL_SERVICE_REQUEST_CUSTOM,
      icon: faPenToSquare,
      kind: null,
      title: content.customTitle,
      description: content.customDescription,
    },
  ];

  return (
    <section aria-labelledby={headingId} className={styles.picker}>
      <h3 className={styles.heading} id={headingId}>
        {content.heading}
      </h3>
      {services.length === 0 ? (
        <p className={styles.empty}>{content.emptyCatalog}</p>
      ) : null}
      <ul className={styles.list}>
        {options.map((option) => (
          <li key={option.id}>
            <ButtonControl
              className={styles.option}
              data-custom={
                option.id === PORTAL_SERVICE_REQUEST_CUSTOM ? "true" : undefined
              }
              onClick={() => onSelectAction(option.id)}
              type="button"
              variant={ButtonVariant.Row}
            >
              <span aria-hidden="true" className={styles.icon}>
                <ActionIcon icon={option.icon} />
              </span>
              <span className={styles.text}>
                <span className={styles.title}>
                  {option.title}
                  {option.kind ? (
                    <span className={styles.kind}>{option.kind}</span>
                  ) : null}
                </span>
                <span className={styles.description}>{option.description}</span>
              </span>
              <FontAwesomeIcon
                aria-hidden="true"
                className={styles.chevron}
                icon={faChevronRight}
              />
            </ButtonControl>
          </li>
        ))}
      </ul>
    </section>
  );
}
