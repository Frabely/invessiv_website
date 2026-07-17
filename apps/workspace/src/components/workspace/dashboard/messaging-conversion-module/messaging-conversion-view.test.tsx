// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { LEAD_STATUS_BADGE_TONES } from "@/common/constants/leads/badges/lead-status-badge-tones";
import type { MessagingConversionDto } from "@/common/contracts/dashboard/messaging-conversion.dto";
import { MessagingConversionView } from "./messaging-conversion-view";

afterEach(cleanup);

const LABELS = {
  stageLabels: {
    [ContactLeadStatus.Contacted]: "Kontaktiert",
    [ContactLeadStatus.Responded]: "Geantwortet",
    [ContactLeadStatus.SettingCall]: "Setting Call gebucht",
    [ContactLeadStatus.ClosingCall]: "Closing Call gebucht",
    [ContactLeadStatus.Won]: "Gewonnen",
  },
  ratePercent: "{value} %",
  stageCountAriaSuffix: "Leads",
  directRateLabel: "{from} → {to}",
  transitionAriaLabel: "{from} zu {to}: {rate}, {ratio} Leads",
};

function buildData(): MessagingConversionDto {
  return {
    steps: [
      { key: ContactLeadStatus.Contacted, count: 25, rateFromPrev: null },
      { key: ContactLeadStatus.Responded, count: 16, rateFromPrev: 16 / 25 },
      { key: ContactLeadStatus.SettingCall, count: 9, rateFromPrev: 9 / 16 },
      { key: ContactLeadStatus.ClosingCall, count: 6, rateFromPrev: 6 / 9 },
      { key: ContactLeadStatus.Won, count: 3, rateFromPrev: 3 / 6 },
    ],
    contactedToSetting: { fromCount: 25, toCount: 9, rate: 9 / 25 },
    contactedToClosing: { fromCount: 25, toCount: 6, rate: 6 / 25 },
    contactedToWon: { fromCount: 25, toCount: 3, rate: 3 / 25 },
  };
}

describe("MessagingConversionView", () => {
  it("renders all five stages in order with localized counts", () => {
    const { container } = render(
      <MessagingConversionView
        data={buildData()}
        labels={LABELS}
        locale="de"
        title="Nachrichten"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Nachrichten" }),
    ).toBeInTheDocument();
    const stages = container.querySelectorAll("[data-stage]");
    expect(stages).toHaveLength(5);
    expect(
      within(stages[0] as HTMLElement).getByText("Kontaktiert"),
    ).toBeInTheDocument();
    expect(
      within(stages[0] as HTMLElement).getByText("25"),
    ).toBeInTheDocument();
    expect(
      within(stages[4] as HTMLElement).getByText("Gewonnen"),
    ).toBeInTheDocument();
    expect(stages[4]).toHaveAttribute(
      "data-tone",
      LEAD_STATUS_BADGE_TONES[ContactLeadStatus.Won],
    );
  });

  it("renders sequential connector rates from the DTO", () => {
    const data = buildData();
    const respondedStep = data.steps[1];
    if (respondedStep) {
      respondedStep.rateFromPrev = 0.5;
    }

    const { container } = render(
      <MessagingConversionView
        data={data}
        labels={LABELS}
        locale="de"
        title="Nachrichten"
      />,
    );

    const connectors = container.querySelectorAll(
      'ol [data-slot="funnel-connector"]',
    );
    expect(connectors).toHaveLength(4);
    expect(
      within(connectors[0] as HTMLElement).getByText("50 %"),
    ).toBeInTheDocument();
    expect(
      within(connectors[0] as HTMLElement).getByText("16 / 25"),
    ).toBeInTheDocument();
    expect(connectors[0]).toHaveAccessibleName(
      "Kontaktiert zu Geantwortet: 50 %, 16 / 25 Leads",
    );
  });

  it("labels every direct contacted conversion visibly and accessibly", () => {
    const { container } = render(
      <MessagingConversionView
        data={buildData()}
        labels={LABELS}
        locale="de"
        title="Nachrichten"
      />,
    );

    const cases = [
      [
        ContactLeadStatus.SettingCall,
        "Kontaktiert → Setting Call gebucht",
        "36 %",
      ],
      [
        ContactLeadStatus.ClosingCall,
        "Kontaktiert → Closing Call gebucht",
        "24 %",
      ],
      [ContactLeadStatus.Won, "Kontaktiert → Gewonnen", "12 %"],
    ] as const;

    for (const [status, label, rate] of cases) {
      const span = container.querySelector(`[data-span="${status}"]`);
      expect(span).not.toBeNull();
      expect(within(span as HTMLElement).getByText(label)).toBeInTheDocument();
      expect(within(span as HTMLElement).getByText(rate)).toBeInTheDocument();
      expect(
        span?.querySelector('[data-slot="funnel-connector"]'),
      ).toHaveAccessibleName(new RegExp(`^${label.replace("→", "zu")}`));
    }
  });

  it("uses the direct rate from the DTO instead of recalculating it", () => {
    const data = buildData();
    data.contactedToSetting.rate = 0.2;

    const { container } = render(
      <MessagingConversionView
        data={data}
        labels={LABELS}
        locale="de"
        title="Nachrichten"
      />,
    );
    const settingSpan = container.querySelector(
      `[data-span="${ContactLeadStatus.SettingCall}"]`,
    );

    expect(
      within(settingSpan as HTMLElement).getByText("20 %"),
    ).toBeInTheDocument();
    expect(
      within(settingSpan as HTMLElement).getByText("9 / 25"),
    ).toBeInTheDocument();
  });

  it("renders zero rates for an empty DTO", () => {
    const data = buildData();
    data.steps = data.steps.map((step) => ({
      ...step,
      count: 0,
      rateFromPrev: step.rateFromPrev === null ? null : 0,
    }));
    data.contactedToSetting = { fromCount: 0, toCount: 0, rate: 0 };
    data.contactedToClosing = { fromCount: 0, toCount: 0, rate: 0 };
    data.contactedToWon = { fromCount: 0, toCount: 0, rate: 0 };

    const { container } = render(
      <MessagingConversionView
        data={data}
        labels={LABELS}
        locale="de"
        title="Nachrichten"
      />,
    );

    const connectors = container.querySelectorAll(
      '[data-slot="funnel-connector"]',
    );
    expect(connectors).toHaveLength(7);
    connectors.forEach((connector) => {
      expect(
        within(connector as HTMLElement).getByText("0 %"),
      ).toBeInTheDocument();
      expect(
        within(connector as HTMLElement).getByText("0 / 0"),
      ).toBeInTheDocument();
    });
  });
});
