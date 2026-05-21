// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  CONTACT_LEAD_STATUS_ALL,
  CONTACT_LEAD_STATUS_VALUES,
  ContactLeadStatus,
} from "@invessiv/common/constants/contact/contact-lead-statuses";
import {
  LEAD_BADGE_TONE_VALUES,
  type LeadBadgeTone,
} from "@invessiv/common/constants/leads/badges/lead-badge-tones";
import { LeadStatusBadge } from "./lead-status-badge";

afterEach(() => {
  cleanup();
});

const VALID_TONES: ReadonlySet<LeadBadgeTone> = new Set(LEAD_BADGE_TONE_VALUES);

describe("LeadStatusBadge", () => {
  it("renders the responded status with a valid tone and icon", () => {
    render(
      <LeadStatusBadge
        label="Geantwortet"
        status={ContactLeadStatus.Responded}
      />,
    );

    const badge = screen
      .getByText("Geantwortet")
      .closest("[data-kind='status']");

    expect(badge).not.toBeNull();
    const tone = badge?.getAttribute("data-tone");
    expect(tone).not.toBeNull();
    expect(VALID_TONES.has(tone as LeadBadgeTone)).toBe(true);
    expect(badge?.querySelector("svg")).toBeInTheDocument();
  });

  it("maps every contact lead status (including the all filter) to a tone", () => {
    const allStatuses = [
      CONTACT_LEAD_STATUS_ALL,
      ...CONTACT_LEAD_STATUS_VALUES,
    ];

    for (const status of allStatuses) {
      render(<LeadStatusBadge label={status} status={status} />);
      const badge = screen.getByText(status).closest("[data-kind='status']");
      const tone = badge?.getAttribute("data-tone");
      expect(
        tone,
        `expected a tone mapping for status "${status}"`,
      ).not.toBeNull();
      expect(VALID_TONES.has(tone as LeadBadgeTone)).toBe(true);
      cleanup();
    }
  });
});
