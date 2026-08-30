"use client";

import type { RefObject } from "react";
import { useEffect, useMemo, useState } from "react";

import type { ContactOfferKey } from "@invessiv/common/constants/contact/contact-offer-keys";
import { CONTACT_OFFER_KEY } from "@invessiv/common/constants/contact/contact-offer-keys";
import { BrandMarkBackdrop } from "@/components/marketing/shared/brand-mark-backdrop/brand-mark-backdrop";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import type { ServiceCardCopy } from "@/i18n/dictionaries/marketing/home";
import { PROJECT_OFFER_CHANGE_EVENT } from "@/common/constants/marketing";
import type {
  PrimaryServiceCardData,
  PrimaryServiceKey,
  ServiceOption,
} from "@/common/contracts/marketing";

import { SelectedService } from "./selected-service/selected-service";
import styles from "./services-section.module.css";

const PRIMARY_SERVICE_ORDER = [
  CONTACT_OFFER_KEY.Landing,
  CONTACT_OFFER_KEY.Upgrade,
  CONTACT_OFFER_KEY.Web,
] as const;
const DEFAULT_SERVICE_KEY = CONTACT_OFFER_KEY.Landing;

type ServicesSectionProps = {
  deliveryLabel: string;
  detailPageCtaLabel: string;
  id: string;
  kicker: string;
  primaryCtaLabel: string;
  primaryCtaLabels: Record<ContactOfferKey, string>;
  recommendedBadgeLabel: string;
  sectionRef: RefObject<HTMLElement | null>;
  serviceCards: ServiceCardCopy[];
  serviceDetailHrefs?: Partial<Record<ContactOfferKey, string>>;
  serviceOptions: ServiceOption[];
  servicePickerTitle: string;
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
  primaryCtaLabel,
  primaryCtaLabels,
  recommendedBadgeLabel,
  sectionRef,
  serviceCards,
  serviceDetailHrefs,
  serviceOptions,
  servicePickerTitle,
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

  const selectedCard =
    primaryCards.find((card) => card.key === selectedServiceKey) ??
    primaryCards[0] ??
    null;
  const selectedOption =
    serviceOptions.find(
      (option) => (option.serviceKey ?? option.key) === selectedCard?.key,
    ) ?? null;
  const ctaProjectGoal = selectedOption?.label ?? selectedCard?.title ?? "";

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

  if (!selectedCard) {
    return null;
  }

  const detailHref = serviceDetailHrefs?.[selectedCard.key];

  return (
    <section className={styles.section} id={id} ref={sectionRef}>
      <span className={styles.brandMark}>
        <BrandMarkBackdrop sizes="(max-width: 760px) 90vw, 60vw" />
      </span>

      <header className={styles.header}>
        <EyebrowPill>{kicker}</EyebrowPill>
        <h2 className={styles.sectionTitle}>{title}</h2>
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
    </section>
  );
}
