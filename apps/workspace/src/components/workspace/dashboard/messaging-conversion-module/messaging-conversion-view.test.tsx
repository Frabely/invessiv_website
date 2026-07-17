// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import type { MessagingConversionDto } from "@/common/contracts/dashboard/messaging-conversion.dto";
import { getLeadStatusBadgeTone } from "../../leads/shared/lead-status-badge/lead-status-badge";
import { MessagingConversionView } from "./messaging-conversion-view";

afterEach(() => {
  cleanup();
});

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
  connectorAriaLabel: "Übergang zur nächsten Stufe",
};

const TITLE = "Nachrichten";

function buildData(
  counts: {
    contacted: number;
    responded: number;
    setting: number;
    closing: number;
    won: number;
  } = {
    contacted: 25,
    responded: 16,
    setting: 9,
    closing: 6,
    won: 3,
  },
): MessagingConversionDto {
  const { contacted, responded, setting, closing, won } = counts;

  return {
    steps: [
      {
        key: ContactLeadStatus.Contacted,
        count: contacted,
        rateFromPrev: null,
      },
      {
        key: ContactLeadStatus.Responded,
        count: responded,
        rateFromPrev: contacted === 0 ? 0 : Math.min(responded / contacted, 1),
      },
      {
        key: ContactLeadStatus.SettingCall,
        count: setting,
        rateFromPrev: responded === 0 ? 0 : Math.min(setting / responded, 1),
      },
      {
        key: ContactLeadStatus.ClosingCall,
        count: closing,
        rateFromPrev: setting === 0 ? 0 : Math.min(closing / setting, 1),
      },
      {
        key: ContactLeadStatus.Won,
        count: won,
        rateFromPrev: closing === 0 ? 0 : Math.min(won / closing, 1),
      },
    ],
    contactedToSetting: {
      fromCount: contacted,
      toCount: setting,
      rate: contacted === 0 ? 0 : Math.min(setting / contacted, 1),
    },
    contactedToClosing: {
      fromCount: contacted,
      toCount: closing,
      rate: contacted === 0 ? 0 : Math.min(closing / contacted, 1),
    },
    contactedToWon: {
      fromCount: contacted,
      toCount: won,
      rate: contacted === 0 ? 0 : Math.min(won / contacted, 1),
    },
  };
}

describe("MessagingConversionView", () => {
  it("renders the section title", () => {
    render(
      <MessagingConversionView
        data={buildData()}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );
    expect(screen.getByRole("heading", { name: TITLE })).toBeInTheDocument();
  });

  it("renders all five step cards in order with counts", () => {
    render(
      <MessagingConversionView
        data={buildData()}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );

    const steps = screen.getAllByRole("group");
    expect(steps).toHaveLength(5);

    expect(within(steps[0]).getByText("Kontaktiert")).toBeInTheDocument();
    expect(within(steps[0]).getByText("25")).toBeInTheDocument();
    expect(within(steps[0]).getByText("100 %")).toBeInTheDocument();
    expect(within(steps[1]).getByText("Geantwortet")).toBeInTheDocument();
    expect(within(steps[1]).getByText("16")).toBeInTheDocument();
    expect(within(steps[1]).getByText("64 %")).toBeInTheDocument();
    expect(
      within(steps[2]).getByText("Setting Call gebucht"),
    ).toBeInTheDocument();
    expect(within(steps[2]).getByText("9")).toBeInTheDocument();
    expect(within(steps[2]).getByText("36 %")).toBeInTheDocument();
    expect(
      within(steps[3]).getByText("Closing Call gebucht"),
    ).toBeInTheDocument();
    expect(within(steps[3]).getByText("6")).toBeInTheDocument();
    expect(within(steps[3]).getByText("24 %")).toBeInTheDocument();
    expect(within(steps[4]).getByText("Gewonnen")).toBeInTheDocument();
    expect(within(steps[4]).getByText("3")).toBeInTheDocument();
    expect(within(steps[4]).getByText("12 %")).toBeInTheDocument();
    expect(steps[4].getAttribute("data-tone")).toBe(
      getLeadStatusBadgeTone(ContactLeadStatus.Won),
    );

    expect(steps[2].getAttribute("data-tone")).toBe(
      getLeadStatusBadgeTone(ContactLeadStatus.SettingCall),
    );
  });

  it("renders four shared connectors between the cards", () => {
    const { container } = render(
      <MessagingConversionView
        data={buildData()}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );

    const connectors = container.querySelectorAll(
      'ol [data-slot="funnel-connector"]',
    );
    expect(connectors).toHaveLength(4);

    const expectedConnectorContents: ReadonlyArray<[string, string]> = [
      ["64 %", "16 / 25"],
      ["56 %", "9 / 16"],
      ["67 %", "6 / 9"],
      ["50 %", "3 / 6"],
    ];
    expectedConnectorContents.forEach(([percent, ratio], index) => {
      const connector = connectors[index];
      expect(connector).toBeDefined();
      expect(
        within(connector as HTMLElement).getByText(percent),
      ).toBeInTheDocument();
      expect(
        within(connector as HTMLElement).getByText(ratio),
      ).toBeInTheDocument();
    });

    expect(connectors[3]?.getAttribute("data-tone")).toBe(
      getLeadStatusBadgeTone(ContactLeadStatus.Won),
    );
    expect(connectors[3]?.getAttribute("data-from-tone")).toBe(
      getLeadStatusBadgeTone(ContactLeadStatus.ClosingCall),
    );
  });

  it("renders the direct contacted span rates through won", () => {
    const { container } = render(
      <MessagingConversionView
        data={buildData()}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );

    const settingSpan = container.querySelector(
      `[data-span="${ContactLeadStatus.SettingCall}"]`,
    );
    expect(settingSpan).not.toBeNull();
    const settingConnector = settingSpan?.querySelector(
      '[data-slot="funnel-connector"]',
    );
    expect(settingConnector?.getAttribute("data-area-fade")).toBe("true");
    expect(settingConnector?.getAttribute("data-from-tone")).toBe(
      getLeadStatusBadgeTone(ContactLeadStatus.Contacted),
    );
    expect(
      within(settingSpan as HTMLElement).getByText("36 %"),
    ).toBeInTheDocument();
    expect(
      within(settingSpan as HTMLElement).getByText("9 / 25"),
    ).toBeInTheDocument();

    const closingSpan = container.querySelector(
      `[data-span="${ContactLeadStatus.ClosingCall}"]`,
    );
    expect(closingSpan).not.toBeNull();
    expect(
      within(closingSpan as HTMLElement).getByText("24 %"),
    ).toBeInTheDocument();
    expect(
      within(closingSpan as HTMLElement).getByText("6 / 25"),
    ).toBeInTheDocument();

    const wonSpan = container.querySelector(
      `[data-span="${ContactLeadStatus.Won}"]`,
    );
    expect(wonSpan).not.toBeNull();
    const wonConnector = wonSpan?.querySelector(
      '[data-slot="funnel-connector"]',
    );
    expect(wonConnector?.getAttribute("data-area-fade")).toBe("true");
    expect(wonConnector?.getAttribute("data-tone")).toBe(
      getLeadStatusBadgeTone(ContactLeadStatus.Won),
    );
    expect(
      within(wonSpan as HTMLElement).getByText("12 %"),
    ).toBeInTheDocument();
    expect(
      within(wonSpan as HTMLElement).getByText("3 / 25"),
    ).toBeInTheDocument();
  });

  it("renders 0 % rates when no leads were contacted", () => {
    const { container } = render(
      <MessagingConversionView
        data={buildData({
          contacted: 0,
          responded: 0,
          setting: 0,
          closing: 0,
          won: 0,
        })}
        labels={LABELS}
        locale="de"
        title={TITLE}
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
