// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import type { FunnelStage } from "@/common/constants/dashboard/funnel-stage-order";
import type { FunnelSnapshotDto } from "@/common/contracts/dashboard/funnel-snapshot.dto";
import { FunnelSnapshotView } from "./funnel-snapshot-view";

afterEach(() => {
  cleanup();
});

const LABELS = {
  stageLabels: {
    new: "Neu",
    contacted: "Kontaktiert",
    responded: "Geantwortet",
    qualified: "Qualifiziert",
    proposal: "Angebot",
    won: "Gewonnen",
    on_hold: "Pausiert",
    lost: "Verloren",
    archived: "Archiviert",
  },
  stageDescriptions: {
    new: "Frische Anfragen, noch ohne Kontakt.",
    contacted: "Erste Outreach läuft.",
    responded: "Lead reagiert, Dialog aktiv.",
    qualified: "Passt zum Angebot, sales-ready.",
    proposal: "Angebot liegt vor oder wird konkretisiert.",
    won: "Abgeschlossen und gewonnen.",
  },
  stageCountAriaSuffix: "Leads",
  pipelineShareRoot: "{value} % aktive Pipeline",
  pipelineShareFromPrev: "{value} % von {stage}",
  dropOff: {
    forwarded: "{value} % weiter",
    noData: "—",
    noDataDescription: "Vorstufe ohne Daten",
  },
  outcome: {
    percent: "{value} %",
    ariaLabel: "{label}: {count} Leads, {value} vom Gesamtbestand",
  },
  summary: {
    activePipeline: "Aktive Pipeline",
    total: "{count} gesamt",
    excluded: "{count} ausgeschlossen",
    outcomeLabel: "{count} {label}",
  },
  insight: {
    largestDropOff: "Größter Verlust: {from} → {to} · {drop} Leads offen",
    weakestConversion: "Schwächste Conversion: {from} → {to} · {value} %",
  },
  pendingReview: {
    prefix: "davon",
    format: "{count} warten auf Review",
  },
  connectorAriaLabel: "Übergang zur nächsten Stufe",
  emptyState: "Keine Leads.",
};

const TITLE = "Funnel";
const ORDER: ReadonlyArray<FunnelStage> = [
  ContactLeadStatus.New,
  ContactLeadStatus.Contacted,
  ContactLeadStatus.Responded,
  ContactLeadStatus.Qualified,
  ContactLeadStatus.Proposal,
  ContactLeadStatus.Won,
];

function buildSnapshot(
  overrides: Partial<Record<FunnelStage, number>> = {},
  outcomes = {
    onHold: 1,
    lost: 1,
    archived: 1,
  },
): FunnelSnapshotDto {
  const counts: Record<FunnelStage, number> = {
    new: 46,
    contacted: 25,
    responded: 19,
    qualified: 8,
    proposal: 5,
    won: 3,
    ...overrides,
  };

  return {
    stages: ORDER.map((key, index) => {
      const count = counts[key] ?? 0;
      const previousCount =
        index === 0 ? null : (counts[ORDER[index - 1]] ?? 0);
      const dropOff =
        previousCount === null || previousCount === 0
          ? null
          : Math.min(count / previousCount, 1);
      return {
        key,
        count,
        dropOffFromPrev: dropOff,
        ...(key === ContactLeadStatus.New ? { pendingReviewCount: 7 } : {}),
      };
    }),
    outcomes: [
      { key: ContactLeadStatus.OnHold, count: outcomes.onHold },
      { key: ContactLeadStatus.Lost, count: outcomes.lost },
      { key: ContactLeadStatus.Archived, count: outcomes.archived },
    ],
    totalCount: 49,
  };
}

describe("FunnelSnapshotView", () => {
  it("renders the section title", () => {
    render(
      <FunnelSnapshotView
        data={buildSnapshot()}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );
    expect(screen.getByRole("heading", { name: TITLE })).toBeInTheDocument();
  });

  it("renders all six stage labels in order plus compact outcomes", () => {
    render(
      <FunnelSnapshotView
        data={buildSnapshot()}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );
    const stages = screen.getAllByRole("group", { name: /stage/i });
    expect(stages).toHaveLength(6);

    expect(within(stages[0]).getByText("Neu")).toBeInTheDocument();
    expect(within(stages[1]).getByText("Kontaktiert")).toBeInTheDocument();
    expect(within(stages[2]).getByText("Geantwortet")).toBeInTheDocument();
    expect(within(stages[3]).getByText("Qualifiziert")).toBeInTheDocument();
    expect(within(stages[4]).getByText("Angebot")).toBeInTheDocument();
    expect(within(stages[5]).getByText("Gewonnen")).toBeInTheDocument();
    expect(screen.getByText("1 Pausiert")).toBeInTheDocument();
    expect(screen.getByText("1 Verloren")).toBeInTheDocument();
    expect(screen.getByText("1 Archiviert")).toBeInTheDocument();
  });

  it("renders the count for each stage, total summary, and each outcome", () => {
    render(
      <FunnelSnapshotView
        data={buildSnapshot()}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );
    const stages = screen.getAllByRole("group", { name: /stage/i });
    expect(within(stages[0]).getByText("46")).toBeInTheDocument();
    expect(within(stages[1]).getByText("25")).toBeInTheDocument();
    expect(within(stages[2]).getByText("19")).toBeInTheDocument();
    expect(within(stages[3]).getByText("8")).toBeInTheDocument();
    expect(within(stages[4]).getByText("5")).toBeInTheDocument();
    expect(within(stages[5]).getByText("3")).toBeInTheDocument();
    const summaryPrimary = screen.getByText("Aktive Pipeline").parentElement;
    expect(summaryPrimary).not.toBeNull();
    expect(
      within(summaryPrimary as HTMLElement).getByText("46"),
    ).toBeInTheDocument();
    expect(screen.getByText("49 gesamt")).toBeInTheDocument();
    expect(screen.getByText("3 ausgeschlossen")).toBeInTheDocument();
    expect(screen.getByText("1 Pausiert")).toBeInTheDocument();
    expect(screen.getByText("1 Verloren")).toBeInTheDocument();
    expect(screen.getByText("1 Archiviert")).toBeInTheDocument();
  });

  it("renders the updated pending-review line in the new stage card", () => {
    render(
      <FunnelSnapshotView
        data={buildSnapshot()}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );
    const stages = screen.getAllByRole("group", { name: /stage/i });
    expect(within(stages[0]).getByText("46")).toBeInTheDocument();
    expect(within(stages[0]).getByText("davon")).toBeInTheDocument();
    expect(
      within(stages[0]).getByText("7 warten auf Review"),
    ).toBeInTheDocument();
  });

  it("keeps stage descriptions available for assistive context", () => {
    render(
      <FunnelSnapshotView
        data={buildSnapshot()}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );
    expect(screen.getByText(LABELS.stageDescriptions.new)).toBeInTheDocument();
    expect(
      screen.getByText(LABELS.stageDescriptions.proposal),
    ).toBeInTheDocument();
    expect(screen.getByText(LABELS.stageDescriptions.won)).toBeInTheDocument();
  });

  it("renders stage conversion labels and connector labels from the previous stage", () => {
    const { container } = render(
      <FunnelSnapshotView
        data={buildSnapshot()}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );
    expect(screen.getByText("100 % aktive Pipeline")).toBeInTheDocument();
    expect(screen.getByText("54 % von Neu")).toBeInTheDocument();
    expect(screen.getByText("76 % von Kontaktiert")).toBeInTheDocument();
    expect(screen.getByText("42 % von Geantwortet")).toBeInTheDocument();
    expect(screen.getByText("63 % von Qualifiziert")).toBeInTheDocument();
    expect(screen.getByText("60 % von Angebot")).toBeInTheDocument();
    const connectors = container.querySelectorAll(
      '[data-slot="funnel-connector"]',
    );
    const expectedConnectorContents: ReadonlyArray<[string, string]> = [
      ["54 %", "25 / 46"],
      ["76 %", "19 / 25"],
      ["42 %", "8 / 19"],
      ["63 %", "5 / 8"],
      ["60 %", "3 / 5"],
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
  });

  it("renders the bottleneck insight in the header", () => {
    render(
      <FunnelSnapshotView
        data={buildSnapshot()}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );
    expect(
      screen.getByText("Größter Verlust: Neu → Kontaktiert · 21 Leads offen"),
    ).toBeInTheDocument();
  });

  it("renders exactly five connectors", () => {
    const { container } = render(
      <FunnelSnapshotView
        data={buildSnapshot()}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );
    const connectors = container.querySelectorAll(
      '[data-slot="funnel-connector"]',
    );
    expect(connectors).toHaveLength(5);
  });

  it("renders 0 % with 0 / 0 ratio when the previous stage has zero leads", () => {
    const { container } = render(
      <FunnelSnapshotView
        data={buildSnapshot(
          {
            new: 0,
            contacted: 5,
            responded: 2,
            qualified: 1,
            proposal: 0,
            won: 0,
          },
          { onHold: 0, lost: 0, archived: 0 },
        )}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );

    const firstConnector = container.querySelector(
      '[data-slot="funnel-connector"]',
    );
    expect(firstConnector).not.toBeNull();
    expect(
      within(firstConnector as HTMLElement).getByText("0 %"),
    ).toBeInTheDocument();
    expect(
      within(firstConnector as HTMLElement).getByText("0 / 0"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("0 % von Neu").length).toBeGreaterThanOrEqual(1);
  });

  it("rounds connector and share percentages to whole numbers", () => {
    const { container } = render(
      <FunnelSnapshotView
        data={buildSnapshot(
          {
            new: 7,
            contacted: 3,
            responded: 0,
            qualified: 0,
            proposal: 0,
            won: 0,
          },
          { onHold: 0, lost: 0, archived: 0 },
        )}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );

    expect(screen.getByText("43 % von Neu")).toBeInTheDocument();
    expect(
      screen.getAllByText("0 % von Kontaktiert").length,
    ).toBeGreaterThanOrEqual(1);
    const connectors = container.querySelectorAll(
      '[data-slot="funnel-connector"]',
    );
    expect(
      within(connectors[0] as HTMLElement).getByText("43 %"),
    ).toBeInTheDocument();
    expect(
      within(connectors[0] as HTMLElement).getByText("3 / 7"),
    ).toBeInTheDocument();
    expect(
      within(connectors[1] as HTMLElement).getByText("0 %"),
    ).toBeInTheDocument();
    expect(
      within(connectors[1] as HTMLElement).getByText("0 / 3"),
    ).toBeInTheDocument();
    const summaryPrimary = screen.getByText("Aktive Pipeline").parentElement;
    expect(summaryPrimary).not.toBeNull();
    expect(
      within(summaryPrimary as HTMLElement).getByText("49"),
    ).toBeInTheDocument();
  });

  it("excludes paused, lost, and archived outcomes from the pipeline percentage base", () => {
    render(
      <FunnelSnapshotView
        data={{
          stages: [
            {
              key: ContactLeadStatus.New,
              count: 8,
              dropOffFromPrev: null,
            },
            {
              key: ContactLeadStatus.Contacted,
              count: 0,
              dropOffFromPrev: 0,
            },
            {
              key: ContactLeadStatus.Responded,
              count: 0,
              dropOffFromPrev: null,
            },
            {
              key: ContactLeadStatus.Qualified,
              count: 0,
              dropOffFromPrev: null,
            },
            {
              key: ContactLeadStatus.Proposal,
              count: 0,
              dropOffFromPrev: null,
            },
            {
              key: ContactLeadStatus.Won,
              count: 0,
              dropOffFromPrev: null,
            },
          ],
          outcomes: [
            { key: ContactLeadStatus.OnHold, count: 1 },
            { key: ContactLeadStatus.Lost, count: 1 },
            { key: ContactLeadStatus.Archived, count: 0 },
          ],
          totalCount: 10,
        }}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );

    const summaryPrimary = screen.getByText("Aktive Pipeline").parentElement;
    expect(summaryPrimary).not.toBeNull();
    expect(
      within(summaryPrimary as HTMLElement).getByText("8"),
    ).toBeInTheDocument();
  });

  it("does not render stage index counters", () => {
    render(
      <FunnelSnapshotView
        data={buildSnapshot()}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );
    expect(screen.queryByText("01/06")).not.toBeInTheDocument();
    expect(screen.queryByText("06/06")).not.toBeInTheDocument();
  });
});
