"use client";

import type { CSSProperties, RefObject } from "react";
import { useEffect, useMemo, useState } from "react";

import { ServiceActionCta } from "@/components/marketing/home/sections/services-section/service-action-cta/service-action-cta";
import { ServiceCardIcon } from "@/components/marketing/home/sections/services-section/service-card-icon";
import { PrimaryCtaLink } from "@/components/shared/button/button";
import { SECTION_HREFS } from "@/config/navigation/home";
import type { ServiceCardCopy } from "@/i18n/dictionaries/marketing/home";

import styles from "./services-section.module.css";

const PRIMARY_SERVICE_ORDER = ["landing", "process", "upgrade", "web"] as const;
const DEFAULT_SERVICE_KEY = "landing";
const CALENDAR_ICON_MASK_STYLE = {
  WebkitMaskImage: 'url("/services/calender-icon.svg")',
  maskImage: 'url("/services/calender-icon.svg")',
} satisfies CSSProperties;

type PrimaryServiceKey = (typeof PRIMARY_SERVICE_ORDER)[number];
type PrimaryServiceCardData = Extract<
  ServiceCardCopy,
  { key: PrimaryServiceKey }
>;
type MaintenanceServiceCardData = Extract<
  ServiceCardCopy,
  { key: "maintenance" }
>;

type ServiceOption = {
  key: string;
  label: string;
  serviceKey?: string;
};

type ServicesSectionProps = {
  deliveryLabel: string;
  detailPageCtaLabel: string;
  id: string;
  kicker: string;
  launchAddonTitle: string;
  otherServicesTitle: string;
  primaryCtaLabel: string;
  primaryCtaLabels: Record<
    "landing" | "maintenance" | "process" | "upgrade" | "web",
    string
  >;
  recommendedBadgeLabel: string;
  sectionRef: RefObject<HTMLElement | null>;
  serviceCards: ServiceCardCopy[];
  serviceContextNote?: string;
  serviceDetailHrefs?: Partial<Record<ServiceCardCopy["key"], string>>;
  serviceMoreAboutCtaPrefix: string;
  serviceMoreAboutLabels: Partial<Record<ServiceCardCopy["key"], string>>;
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
  serviceMoreAboutCtaPrefix,
  serviceMoreAboutLabels,
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
          card.key === "maintenance",
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
      new CustomEvent("invessiv:project-offer-change", {
        detail: {
          offerKey: selectedCard.key,
          projectGoal: ctaProjectGoal,
        },
      }),
    );
  }, [ctaProjectGoal, selectedCard]);

  const getPrimaryCtaLabel = (cardKey: ServiceCardCopy["key"]) =>
    primaryCtaLabels[cardKey as keyof typeof primaryCtaLabels] ||
    primaryCtaLabel;

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

  const selectedDeliveryLabel = selectedCard.deliveryLabel ?? deliveryLabel;
  const selectedDescription = selectedCard.description;
  const timelineItems =
    selectedCard.timeline ?? selectedCard.included.slice(0, 3);
  const detailHref = serviceDetailHrefs?.[selectedCard.key];

  return (
    <section className={styles.section} id={id} ref={sectionRef}>
      <header className={styles.header}>
        <p className={styles.kicker}>{kicker}</p>
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

      <article
        aria-label={selectedCard.title}
        className={styles.activeService}
        data-card-key={selectedCard.key}
        data-service-card="true"
        data-service-variant="active"
      >
        <div className={styles.activeMain}>
          <div className={styles.activeHeading}>
            <ServiceCardIcon
              iconAlt={selectedCard.iconAlt}
              iconSrc={selectedCard.iconSrc}
            />
            <div className={styles.activeHeadingText}>
              <p className={styles.activeEyebrow}>{recommendedBadgeLabel}</p>
              <h3 className={styles.activeTitle}>
                <span>
                  {selectedCard.title}
                  <span aria-hidden="true" className={styles.titleDot}>
                    .
                  </span>
                </span>
              </h3>
            </div>
          </div>

          <div className={styles.activeSummary}>
            {selectedDescription ? (
              <p className={styles.activeDescription}>{selectedDescription}</p>
            ) : null}

            <ul className={styles.bulletList}>
              {selectedCard.included.slice(0, 4).map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>
        </div>

        <aside className={styles.activeAside}>
          <div className={styles.timeBlock}>
            <div className={styles.timeHeader}>
              <span aria-hidden="true" className={styles.timeIcon}>
                <span
                  className={styles.timeIconImage}
                  style={CALENDAR_ICON_MASK_STYLE}
                />
              </span>
              <div className={styles.timeText}>
                <p className={styles.timeLabel}>{selectedDeliveryLabel}</p>
                <p className={styles.timeValue}>{selectedCard.delivery}</p>
              </div>
            </div>
            <p className={styles.timeSteps}>{timelineItems.join(" → ")}</p>
          </div>

          <div className={styles.actionRow}>
            <PrimaryCtaLink
              className={styles.primaryCta}
              data-analytics-event="cta_click"
              data-analytics-location="pricing"
              data-analytics-target="form"
              data-analytics-variant="primary"
              data-project-goal={ctaProjectGoal}
              data-project-offer={selectedCard.key}
              href={SECTION_HREFS.contact}
            >
              {getPrimaryCtaLabel(selectedCard.key)}
            </PrimaryCtaLink>

            {detailHref ? (
              <ServiceActionCta href={detailHref}>
                {detailPageCtaLabel}
              </ServiceActionCta>
            ) : null}
          </div>
        </aside>
      </article>

      <div className={styles.otherServices}>
        <h3 className={styles.listTitle}>{otherServicesTitle}</h3>
        <div className={styles.serviceRows} role="list">
          {otherPrimaryCards.map((card) => {
            const rowDeliveryLabel = card.deliveryLabel ?? deliveryLabel;
            const rowDetailHref = serviceDetailHrefs?.[card.key];
            const rowMoreAboutLabel = `${serviceMoreAboutCtaPrefix} ${
              serviceMoreAboutLabels[card.key] ?? card.title
            }`;

            return (
              <div
                className={styles.serviceRowShell}
                data-card-key={card.key}
                data-service-variant="alternative"
                key={card.key}
                role="listitem"
              >
                <div className={styles.serviceRow}>
                  <span className={styles.rowIconTitle}>
                    <ServiceCardIcon
                      iconAlt={card.iconAlt}
                      iconSrc={card.iconSrc}
                    />
                    <span className={styles.rowText}>
                      <span className={styles.rowTitle}>{card.title}</span>
                      <span className={styles.rowDescription}>
                        {card.description ?? card.fit}
                      </span>
                    </span>
                  </span>
                  <span className={styles.rowMeta}>
                    {rowDeliveryLabel}: {card.delivery}
                  </span>
                </div>
                <div
                  className={styles.mobileRowAction}
                  data-has-detail={rowDetailHref ? "true" : "false"}
                >
                  {rowDetailHref ? (
                    <ServiceActionCta href={rowDetailHref}>
                      {rowMoreAboutLabel}
                    </ServiceActionCta>
                  ) : (
                    <ServiceActionCta
                      onClick={() => selectServiceAndReveal(card.key)}
                    >
                      {rowMoreAboutLabel}
                    </ServiceActionCta>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {maintenanceCard ? (
        <div className={styles.launchAddon}>
          <h3 className={styles.listTitle}>
            {serviceSecondaryTitle ?? launchAddonTitle}
          </h3>
          <article
            aria-label={maintenanceCard.title}
            className={styles.maintenanceCard}
            data-card-key={maintenanceCard.key}
            data-service-variant="secondary"
          >
            <div className={styles.maintenanceContent}>
              <div className={styles.maintenanceTitleRow}>
                <h4 className={styles.maintenanceTitle}>
                  <ServiceCardIcon
                    iconAlt={maintenanceCard.iconAlt}
                    iconSrc={maintenanceCard.iconSrc}
                  />
                  <span>{maintenanceCard.title}</span>
                </h4>
              </div>
              <p className={styles.maintenanceDescription}>
                {maintenanceCard.description}
              </p>
              <ServiceActionCta
                data-analytics-event="cta_click"
                data-analytics-location="pricing"
                data-analytics-target="form"
                data-analytics-variant="secondary-link"
                data-project-goal={ctaProjectGoal}
                data-project-offer={maintenanceCard.key}
                href={SECTION_HREFS.contact}
              >
                {getPrimaryCtaLabel(maintenanceCard.key)}
              </ServiceActionCta>
            </div>
            <div className={styles.maintenanceMeta}>
              <span className={styles.rowMeta}>
                {maintenanceCard.deliveryLabel ?? deliveryLabel}:{" "}
                {maintenanceCard.delivery}
              </span>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
