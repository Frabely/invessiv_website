// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CONTACT_REQUEST_KIND } from "@/common/constants/contact/contact-request-kind";
import { LeadActivityType } from "@/common/constants/leads/activity/lead-activity-types";
import { LeadActorType } from "@/common/constants/leads/activity/lead-actor-types";
import type { LeadActivityDto } from "@/common/contracts/leads/lead-activity.dto";
import type { LeadSubmissionDto } from "@/common/contracts/leads/lead-submission.dto";
import {
  getLeadsDetailDictionary,
  getLeadsSharedDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import { LeadDetailActivities } from "./lead-detail-activities";

const baseActivity: LeadActivityDto = {
  id: "act-1",
  type: LeadActivityType.Note,
  title: "Erstkontakt notiert",
  body: "Lead hat heute zurückgerufen.",
  metadata: null,
  occurredAt: "2026-04-12T10:30:00.000Z",
  actorType: LeadActorType.User,
  actorId: "user_123",
  actorLabel: "Moritz",
};

const statusChangeActivity: LeadActivityDto = {
  id: "act-2",
  type: LeadActivityType.StatusChange,
  title: null,
  body: null,
  metadata: {
    previous_status: "new",
    next_status: "qualified",
  },
  occurredAt: "2026-04-13T10:30:00.000Z",
  actorType: LeadActorType.System,
  actorId: null,
  actorLabel: null,
};

const invalidStatusChangeActivity: LeadActivityDto = {
  ...statusChangeActivity,
  id: "act-3",
  metadata: { previous_status: "new", next_status: "does-not-exist" },
};

const baseSubmission: LeadSubmissionDto = {
  id: "sub-1",
  requestId: "req-abc",
  channel: CONTACT_REQUEST_KIND.QuickContact,
  locale: "de",
  consentAcceptedAt: "2026-04-13T08:00:00.000Z",
  submissionStartedAt: null,
  createdAt: "2026-04-13T08:00:00.000Z",
};

function renderActivities(
  overrides: {
    activities?: LeadActivityDto[];
    submissions?: LeadSubmissionDto[];
    locale?: "de" | "en";
  } = {},
) {
  const locale = overrides.locale ?? "de";

  return render(
    <LeadDetailActivities
      activities={overrides.activities ?? []}
      submissions={overrides.submissions ?? []}
      content={getLeadsDetailDictionary(locale)}
      locale={locale}
      sharedContent={getLeadsSharedDictionary(locale)}
    />,
  );
}

describe("LeadDetailActivities", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the empty state when no timeline entries exist", () => {
    renderActivities();

    expect(screen.getByText("Noch keine Aktivitäten")).toBeInTheDocument();
  });

  it("merges activities and submissions in descending order", () => {
    renderActivities({
      activities: [baseActivity],
      submissions: [baseSubmission],
    });

    expect(
      screen.getByRole("heading", { name: "Eingang über Formular" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Schnellkontakt")).toBeInTheDocument();
    expect(screen.getByText("Erstkontakt notiert")).toBeInTheDocument();
    expect(
      screen.getByText("Lead hat heute zurückgerufen."),
    ).toBeInTheDocument();
    expect(screen.getByText("Moritz")).toBeInTheDocument();

    const articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(2);
    expect(articles[0]).toHaveTextContent("Eingang über Formular");
    expect(articles[1]).toHaveTextContent("Erstkontakt notiert");
  });

  it("renders status change metadata as badges and falls back when metadata is invalid", () => {
    renderActivities({
      activities: [statusChangeActivity, invalidStatusChangeActivity],
    });

    expect(screen.getByText("Neu")).toBeInTheDocument();
    expect(screen.getByText("Qualifiziert")).toBeInTheDocument();
    expect(screen.getByText("→")).toBeInTheDocument();
    expect(
      screen.getByText("Der Status wurde aktualisiert."),
    ).toBeInTheDocument();
  });

  it("renders localized English labels", () => {
    renderActivities({
      locale: "en",
      activities: [baseActivity],
      submissions: [baseSubmission],
    });

    expect(screen.getByText("Note")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Incoming form submission" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Quick contact")).toBeInTheDocument();
  });
});
