// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { LeadDetailDto } from "@/common/contracts/leads/lead-detail.dto";
import {
  getLeadsDetailDictionary,
  getLeadsSharedDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import { LeadDetailPanel } from "./lead-detail-panel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const leadFixture: LeadDetailDto = {
  id: "2b3d2f33-f3d7-4f8a-8ff6-6ac5df6c9b01",
  displayName: "Anna Meyer",
  firstName: "Anna",
  lastName: "Meyer",
  companyName: "Acme",
  email: "anna@example.com",
  phone: "+49 30 123456",
  websiteUrl: "https://example.com",
  score: 82,
  source: "manual",
  leadStatus: "qualified",
  owner: "Moritz",
  notes: "Existing note",
  improvements: ["Sharper hero", "Add proof"],
  externalGuid: null,
  createdAt: "2026-05-01T10:00:00.000Z",
  updatedAt: "2026-05-02T10:00:00.000Z",
  category: {
    id: "f88d2bf8-aace-45bf-bd28-46dfd71bbb0d",
    slug: "coaches",
    labelKey: "coaches",
  },
  socialProfiles: [
    {
      id: "2ce55c76-3369-4749-9954-2437178f5001",
      platform: "linkedin",
      profileUrl: "https://linkedin.com/company/acme",
      normalizedUrl: "linkedin.com/company/acme",
    },
  ],
  activities: [],
  submissions: [],
};

describe("LeadDetailPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders lead details and keeps close href without selected", () => {
    render(
      <LeadDetailPanel
        closeHref="/de/workspace/leads?status=qualified&page=2"
        content={getLeadsDetailDictionary("de")}
        editHref={`/de/workspace/leads?status=qualified&page=2&mode=edit&edit=${leadFixture.id}`}
        lead={leadFixture}
        locale="de"
        sharedContent={getLeadsSharedDictionary("de")}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Anna Meyer" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Qualifiziert")).toBeInTheDocument();
    expect(screen.getByText("Manuell")).toBeInTheDocument();
    expect(screen.getByText("Coaches")).toBeInTheDocument();
    expect(screen.getByText("Existing note")).toBeInTheDocument();
    expect(screen.getByText("Sharper hero")).toBeInTheDocument();
    expect(screen.getByLabelText("Score: 82")).toBeInTheDocument();
    expect(screen.getByLabelText("LinkedIn-Profil öffnen")).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
    expect(
      screen.getByRole("button", { name: "Detail-Panel schließen" }),
    ).toBeInTheDocument();
  });

  it("shows localized empty labels for optional values", () => {
    render(
      <LeadDetailPanel
        closeHref="/en/workspace/leads"
        content={getLeadsDetailDictionary("en")}
        editHref={`/en/workspace/leads?mode=edit&edit=${leadFixture.id}`}
        lead={{
          ...leadFixture,
          email: null,
          firstName: null,
          lastName: null,
          companyName: null,
          phone: null,
          websiteUrl: null,
          score: null,
          owner: null,
          notes: null,
          improvements: null,
          category: null,
          socialProfiles: [],
        }}
        locale="en"
        sharedContent={getLeadsSharedDictionary("en")}
      />,
    );

    expect(screen.getByText("No phone number")).toBeInTheDocument();
    expect(screen.getByText("No email")).toBeInTheDocument();
    expect(screen.getByText("No website")).toBeInTheDocument();
    expect(screen.getByText("No company")).toBeInTheDocument();
    expect(screen.getByText("No owner")).toBeInTheDocument();
    expect(screen.getByText("No notes yet")).toBeInTheDocument();
    expect(screen.getByText("No improvements yet")).toBeInTheDocument();
    expect(screen.getByText("No social profiles")).toBeInTheDocument();
    expect(screen.getByText("No activities yet")).toBeInTheDocument();
  });
});
