// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AcquisitionVolumeView } from "./acquisition-volume-view";

afterEach(() => {
  cleanup();
});

const LABELS = {
  comparisonDescription: "vs. Vorperiode ({previous})",
  comparisonNoPriorData: "Vorperiode: keine Daten",
  comparisonFormat: {
    percent: "{value} %",
    noData: "—",
  },
  pendingReviewBadge: "{count} warten auf Review",
  subText: "Neue Leads im gewählten Zeitraum.",
  emptyValue: "0",
};

const TITLE = "Akquise-Volumen";

describe("AcquisitionVolumeView", () => {
  it("renders the current count as the KPI value", () => {
    render(
      <AcquisitionVolumeView
        data={{ current: 12, previous: 9, pendingReview: 0 }}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );

    expect(screen.getByRole("heading", { name: TITLE })).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("renders trend 'up' with positive percent and previous count in description", () => {
    const { container } = render(
      <AcquisitionVolumeView
        data={{ current: 12, previous: 9, pendingReview: 0 }}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );

    expect(container.querySelector('[data-trend="up"]')).not.toBeNull();
    expect(screen.getByText("+33,3 %")).toBeInTheDocument();
    expect(screen.getByText("vs. Vorperiode (9)")).toBeInTheDocument();
  });

  it("renders trend 'down' with negative percent", () => {
    const { container } = render(
      <AcquisitionVolumeView
        data={{ current: 5, previous: 10, pendingReview: 0 }}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );

    expect(container.querySelector('[data-trend="down"]')).not.toBeNull();
    expect(screen.getByText("-50 %")).toBeInTheDocument();
  });

  it("renders trend 'flat' as '0 %' when current equals previous", () => {
    const { container } = render(
      <AcquisitionVolumeView
        data={{ current: 7, previous: 7, pendingReview: 0 }}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );

    expect(container.querySelector('[data-trend="flat"]')).not.toBeNull();
    expect(screen.getByText("0 %")).toBeInTheDocument();
  });

  it("renders '—' and 'no prior data' description when previous is 0", () => {
    render(
      <AcquisitionVolumeView
        data={{ current: 5, previous: 0, pendingReview: 0 }}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );

    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("Vorperiode: keine Daten")).toBeInTheDocument();
  });

  it("renders pending-review badge when pendingReview > 0", () => {
    render(
      <AcquisitionVolumeView
        data={{ current: 5, previous: 5, pendingReview: 3 }}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );

    expect(screen.getByText("3 warten auf Review")).toBeInTheDocument();
  });

  it("hides pending-review badge when pendingReview is 0", () => {
    render(
      <AcquisitionVolumeView
        data={{ current: 5, previous: 5, pendingReview: 0 }}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );

    expect(screen.queryByText(/warten auf Review/)).not.toBeInTheDocument();
  });

  it("formats numbers using the en-US locale when locale is 'en'", () => {
    const enLabels = {
      ...LABELS,
      comparisonFormat: { percent: "{value}%", noData: "—" },
    };
    render(
      <AcquisitionVolumeView
        data={{ current: 1234, previous: 1000, pendingReview: 0 }}
        labels={enLabels}
        locale="en"
        title={TITLE}
      />,
    );

    expect(screen.getByText("1,234")).toBeInTheDocument();
  });

  it("formats numbers using the de-DE locale when locale is 'de'", () => {
    render(
      <AcquisitionVolumeView
        data={{ current: 1234, previous: 1000, pendingReview: 0 }}
        labels={LABELS}
        locale="de"
        title={TITLE}
      />,
    );

    expect(screen.getByText("1.234")).toBeInTheDocument();
  });
});
