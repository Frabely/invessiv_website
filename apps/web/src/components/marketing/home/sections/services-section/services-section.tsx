"use client";

import type { RefObject } from "react";
import { useEffect, useMemo, useState } from "react";

import type { ContactOfferKey } from "@invessiv/common/constants/contact/contact-offer-keys";
import { CONTACT_OFFER_KEY } from "@invessiv/common/constants/contact/contact-offer-keys";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import type { ServiceCardCopy } from "@/i18n/dictionaries/marketing/home";
import { PROJECT_OFFER_CHANGE_EVENT } from "@/common/constants/marketing";
import type {
  MaintenanceServiceCardData,
  PrimaryServiceCardData,
  PrimaryServiceKey,
  ServiceOption,
} from "@/common/contracts/marketing";

import { ExtraService } from "./extra-service/extra-service";
import { SecondaryService } from "./secondary-service/secondary-service";
import { SelectedService } from "./selected-service/selected-service";
import styles from "./services-section.module.css";

const PRIMARY_SERVICE_ORDER = [
  CONTACT_OFFER_KEY.Landing,
  CONTACT_OFFER_KEY.Process,
  CONTACT_OFFER_KEY.Upgrade,
  CONTACT_OFFER_KEY.Web,
] as const;
const DEFAULT_SERVICE_KEY = CONTACT_OFFER_KEY.Landing;

type ServicesSectionProps = {
  deliveryLabel: string;
  detailPageCtaLabel: string;
  id: string;
  kicker: string;
  launchAddonTitle: string;
  otherServicesTitle: string;
  primaryCtaLabel: string;
  primaryCtaLabels: Record<ContactOfferKey, string>;
  recommendedBadgeLabel: string;
  sectionRef: RefObject<HTMLElement | null>;
  serviceCards: ServiceCardCopy[];
  serviceContextNote?: string;
  serviceDetailHrefs?: Partial<Record<ContactOfferKey, string>>;
  serviceOptions: ServiceOption[];
  servicePickerTitle: string;
  serviceSecondaryTitle?: string;
  title: string;
};

function isPrimaryServiceKey(key: string): key is PrimaryServiceKey {
  return PRIMARY_SERVICE_ORDER.some((serviceKey) => serviceKey === key);
}

export function ServicesSection({
  deliveryLabel,
  detailPageCtaLabel,
  id,
  kicker,
  launchAddonTitle,
  otherServicesTitle,
  primaryCtaLabel,
  primaryCtaLabels,
  recommendedBadgeLabel,
  sectionRef,
  serviceCards,
  serviceContextNote,
  serviceDetailHrefs,
  serviceOptions,
  servicePickerTitle,
  serviceSecondaryTitle,
  title,
}: ServicesSectionProps) {
  const [selectedServiceKey, setSelectedServiceKey] =
    useState<PrimaryServiceKey>(DEFAULT_SERVICE_KEY);

  const primaryCards = useMemo(
    () =>
      PRIMARY_SERVICE_ORDER.map((key) =>
        serviceCards.find((card) => card.key === key),
      ).filter((card): card is PrimaryServiceCardData => Boolean(card)),
    [serviceCards],
  );

  const maintenanceCard = useMemo(
    () =>
      serviceCards.find(
        (card): card is MaintenanceServiceCardData =>
          card.key === CONTACT_OFFER_KEY.Maintenance,
      ),
    [serviceCards],
  );

  const selectedCard =
    primaryCards.find((card) => card.key === selectedServiceKey) ??
    primaryCards[0] ??
    null;
  const selectedOption =
    serviceOptions.find(
      (option) => (option.serviceKey ?? option.key) === selectedCard?.key,
    ) ?? null;
  const ctaProjectGoal = selectedOption?.label ?? selectedCard?.title ?? "";
  const otherPrimaryCards = primaryCards.filter(
    (card) => card.key !== selectedCard?.key,
  );

  useEffect(() => {
    if (!selectedCard) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent(PROJECT_OFFER_CHANGE_EVENT, {
        detail: {
          offerKey: selectedCard.key,
          projectGoal: ctaProjectGoal,
        },
      }),
    );
  }, [ctaProjectGoal, selectedCard]);

  const getPrimaryCtaLabel = (cardKey: ContactOfferKey) =>
    primaryCtaLabels[cardKey] || primaryCtaLabel;

  const selectServiceAndReveal = (cardKey: PrimaryServiceKey) => {
    setSelectedServiceKey(cardKey);

    window.requestAnimationFrame(() => {
      sectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  if (!selectedCard) {
    return null;
  }

  const detailHref = serviceDetailHrefs?.[selectedCard.key];

  return (
    <section className={styles.section} id={id} ref={sectionRef}>
      <header className={styles.header}>
        <EyebrowPill>{kicker}</EyebrowPill>
        <div className={styles.headingBlock}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <p className={styles.contextNote}>{servicePickerTitle}</p>
          {serviceContextNote ? (
            <p className={styles.contextMeta}>{serviceContextNote}</p>
          ) : null}
        </div>
      </header>

      <div
        className={styles.servicePicker}
        aria-label={servicePickerTitle}
        role="group"
      >
        {serviceOptions.map((option) => {
          const optionServiceKey = option.serviceKey ?? option.key;
          const isActive = optionServiceKey === selectedCard.key;

          return (
            <button
              aria-pressed={isActive}
              className={`${styles.serviceChip}${
                isActive ? ` ${styles.serviceChipActive}` : ""
              }`}
              key={option.key}
              onClick={() => {
                if (isPrimaryServiceKey(optionServiceKey)) {
                  setSelectedServiceKey(optionServiceKey);
                }
              }}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div aria-hidden="true" className={styles.sectionDivider} />

      <SelectedService
        ctaLabel={getPrimaryCtaLabel(selectedCard.key)}
        ctaProjectGoal={ctaProjectGoal}
        defaultDeliveryLabel={deliveryLabel}
        detailHref={detailHref}
        detailPageCtaLabel={detailPageCtaLabel}
        recommendedBadgeLabel={recommendedBadgeLabel}
        selectedCard={selectedCard}
      />

      <div className={styles.otherServices}>
        <h3 className={styles.listTitle}>{otherServicesTitle}</h3>
        <div className={styles.serviceRows} role="list">
          {otherPrimaryCards.map((card) => {
            const rowDeliveryLabel = card.deliveryLabel ?? deliveryLabel;
            const isSelected = card.key === selectedCard.key;

            return (
              <SecondaryService
                card={card}
                defaultDeliveryLabel={rowDeliveryLabel}
                isSelected={isSelected}
                key={card.key}
                onSelectAction={selectServiceAndReveal}
              />
            );
          })}
        </div>
      </div>

      {maintenanceCard ? (
        <div className={styles.launchAddon}>
          <h3 className={styles.listTitle}>
            {serviceSecondaryTitle ?? launchAddonTitle}
          </h3>
          <ExtraService
            card={maintenanceCard}
            ctaLabel={getPrimaryCtaLabel(maintenanceCard.key)}
            ctaProjectGoal={ctaProjectGoal}
            defaultDeliveryLabel={deliveryLabel}
          />
        </div>
      ) : null}
    </section>
  );
}
