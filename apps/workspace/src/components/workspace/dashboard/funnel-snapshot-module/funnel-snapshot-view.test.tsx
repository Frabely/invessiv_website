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
  pipelineShare: "{value} % der Pipeline",
  dropOff: {
    forwarded: "{value} % weiter",
    noData: "—",
    noDataDescription: "Vorstufe ohne Daten",
  },
  outcome: {
    percent: "{value} %",
    ariaLabel: "{label}: {count} Leads, {value} vom Gesamtbestand",
  },
  total: {
    label: "Gesamt",
  },
  pendingReview: {
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
    onHold: 3,
    lost: 11,
    archived: 2,
  },
): FunnelSnapshotDto {
  const counts: Record<FunnelStage, number> = {
    new: 100,
    contacted: 60,
    responded: 30,
    qualified: 12,
    proposal: 7,
    won: 4,
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
        ...(key === ContactLeadStatus.New ? { pendingReviewCount: 30 } : {}),
      };
    }),
    outcomes: [
      { key: ContactLeadStatus.OnHold, count: outcomes.onHold },
      { key: ContactLeadStatus.Lost, count: outcomes.lost },
      { key: ContactLeadStatus.Archived, count: outcomes.archived },
    ],
    totalCount: 116,
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
    expect(screen.getByText("Pausiert")).toBeInTheDocument();
    expect(screen.getByText("Verloren")).toBeInTheDocument();
    expect(screen.getByText("Archiviert")).toBeInTheDocument();
  });

  it("renders the count for each stage, total count, and each outcome", () => {
    render(
      <FunnelSnapshotView
        data={buildSnapshot()}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );
    const stages = screen.getAllByRole("group", { name: /stage/i });
    expect(within(stages[0]).getByText("100")).toBeInTheDocument();
    expect(within(stages[1]).getByText("60")).toBeInTheDocument();
    expect(within(stages[2]).getByText("30")).toBeInTheDocument();
    expect(within(stages[3]).getByText("12")).toBeInTheDocument();
    expect(within(stages[4]).getByText("7")).toBeInTheDocument();
    expect(within(stages[5]).getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Gesamt")).toBeInTheDocument();
    expect(screen.getByText("116")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("11")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders outcome percentages next to the top outcome counts", () => {
    render(
      <FunnelSnapshotView
        data={buildSnapshot()}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );
    expect(screen.getByText("3 %")).toBeInTheDocument();
    expect(screen.getByText("9 %")).toBeInTheDocument();
    expect(screen.getByText("2 %")).toBeInTheDocument();
  });

  it("renders the pending review count inside the new cumulative stage card", () => {
    render(
      <FunnelSnapshotView
        data={buildSnapshot({ new: 33 })}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );
    const stages = screen.getAllByRole("group", { name: /stage/i });
    expect(within(stages[0]).getByText("33")).toBeInTheDocument();
    expect(
      within(stages[0]).getByText("30 warten auf Review"),
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

  it("renders the pipeline share per stage relative to active pipeline entries", () => {
    render(
      <FunnelSnapshotView
        data={buildSnapshot()}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );
    expect(screen.getByText("100 % der Pipeline")).toBeInTheDocument();
    expect(screen.getByText("60 % der Pipeline")).toBeInTheDocument();
    expect(screen.getByText("30 % der Pipeline")).toBeInTheDocument();
    expect(screen.getByText("12 % der Pipeline")).toBeInTheDocument();
    expect(screen.getByText("7 % der Pipeline")).toBeInTheDocument();
    expect(screen.getByText("4 % der Pipeline")).toBeInTheDocument();
  });

  it("does not render a header close-rate KPI", () => {
    render(
      <FunnelSnapshotView
        data={buildSnapshot()}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );
    expect(screen.queryByText("Abschlussquote")).not.toBeInTheDocument();
  });

  it("renders five connector percentages and no absolute loss text", () => {
    render(
      <FunnelSnapshotView
        data={buildSnapshot()}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );
    expect(screen.getByText("60 % weiter")).toBeInTheDocument();
    expect(screen.getByText("50 % weiter")).toBeInTheDocument();
    expect(screen.getByText("40 % weiter")).toBeInTheDocument();
    expect(screen.getByText("58 % weiter")).toBeInTheDocument();
    expect(screen.getByText("57 % weiter")).toBeInTheDocument();
    expect(screen.queryByText(/\d+ verloren$/i)).not.toBeInTheDocument();
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

  it("renders 0 percent for a connector when previous stage has zero leads", () => {
    render(
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

    expect(screen.getAllByText("0 % weiter").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(LABELS.dropOff.noDataDescription).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("rounds connector and share percentages to whole numbers", () => {
    render(
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

    expect(screen.getByText("43 % weiter")).toBeInTheDocument();
    expect(screen.getByText("0 % weiter")).toBeInTheDocument();
    expect(screen.getByText("6 % der Pipeline")).toBeInTheDocument();
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

    expect(screen.getByText("100 % der Pipeline")).toBeInTheDocument();
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
