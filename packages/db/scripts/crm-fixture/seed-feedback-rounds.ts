import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { FeedbackItemKind } from "@invessiv/common/constants/crm/feedback-item-kinds";
import { FeedbackItemResult } from "@invessiv/common/constants/crm/feedback-item-results";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  feedbackRoundItems,
  feedbackRounds,
  projects,
  tasks,
} from "@invessiv/db/record-configuration";

type FeedbackProjectFixture = {
  customerId: string;
  projectId: string;
  membershipId: string;
};

type FeedbackFixtureInput = {
  memberId: string;
  /** Gets a completed round 1 and an open draft in round 2. */
  running: FeedbackProjectFixture;
  /** Gets round 1 approved without feedback. */
  approved: FeedbackProjectFixture;
};

const FEEDBACK_AREAS = ["Startseite", "Über uns", "Kontakt"];

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function roundBase(project: FeedbackProjectFixture, memberId: string) {
  return {
    project_id: project.projectId,
    customer_id: project.customerId,
    preview_url: "https://example.test/fixture-preview",
    area_options: FEEDBACK_AREAS,
    handed_over_by_member_id: memberId,
    draft_updated_at: null,
    draft_updated_by_portal_membership_id: null,
    submitted_at: null,
    submitted_by_portal_membership_id: null,
    customer_notice: null,
    started_at: null,
    completed_at: null,
    completed_by_member_id: null,
    approved_at: null,
    approved_by_portal_membership_id: null,
    read_at: null,
    version: 1,
  };
}

function noResult() {
  return {
    result: null,
    result_note: null,
    result_set_by_member_id: null,
    result_set_at: null,
  };
}

async function seedRunningProject(
  tx: ContactDatabaseTransaction,
  project: FeedbackProjectFixture,
  memberId: string,
) {
  await tx
    .update(projects)
    .set({ feedback_areas: FEEDBACK_AREAS })
    .where(eq(projects.id, project.projectId));

  const completedRoundId = randomUUID();
  const completedAt = daysAgo(3);
  await tx.insert(feedbackRounds).values({
    ...roundBase(project, memberId),
    id: completedRoundId,
    round_number: 1,
    status: FeedbackRoundStatus.Completed,
    handover_note: "Erster Entwurf der Startseite und der Unterseiten.",
    due_on: daysAgo(10).toISOString().slice(0, 10),
    handed_over_at: daysAgo(14),
    draft_updated_at: daysAgo(11),
    draft_updated_by_portal_membership_id: project.membershipId,
    submitted_at: daysAgo(10),
    submitted_by_portal_membership_id: project.membershipId,
    started_at: daysAgo(9),
    completed_at: completedAt,
    completed_by_member_id: memberId,
    read_at: daysAgo(10),
  });
  const itemBase = {
    round_id: completedRoundId,
    created_by_portal_membership_id: project.membershipId,
    result_set_by_member_id: memberId,
    result_set_at: completedAt,
    version: 1,
  };
  await tx.insert(feedbackRoundItems).values([
    {
      ...itemBase,
      id: randomUUID(),
      position: 0,
      area_label: FEEDBACK_AREAS[0],
      kind: FeedbackItemKind.ChangeRequest,
      body: "Das Hero-Bild bitte durch ein Teamfoto ersetzen.",
      result: FeedbackItemResult.Implemented,
      result_note: null,
    },
    {
      ...itemBase,
      id: randomUUID(),
      position: 1,
      area_label: FEEDBACK_AREAS[2],
      kind: FeedbackItemKind.Bug,
      body: "Das Kontaktformular zeigt auf dem Handy keinen Absende-Button.",
      result: FeedbackItemResult.NotImplemented,
      result_note:
        "Der Button liegt unter der Tastatur; wir lösen das mit dem nächsten Release.",
    },
    {
      ...itemBase,
      id: randomUUID(),
      position: 2,
      area_label: null,
      kind: null,
      body: "Können wir zusätzlich einen Blog anbinden?",
      result: FeedbackItemResult.AdditionalService,
      result_note: "Gerne als Zusatzleistung, wir schicken ein Angebot.",
    },
  ]);
  await tx.insert(tasks).values({
    id: randomUUID(),
    project_id: project.projectId,
    title: "Feedbackrunde 1 umsetzen",
    description: "",
    status: TaskStatus.Done,
    action_side: TaskActionSide.Internal,
    visible_to_customer: false,
    assignee_member_id: memberId,
    due_on: null,
    completed_at: completedAt,
    completed_by_member_id: memberId,
    completed_by_portal_membership_id: null,
    created_by_portal_membership_id: null,
    feedback_round_id: completedRoundId,
    version: 1,
  });

  const openRoundId = randomUUID();
  await tx.insert(feedbackRounds).values({
    ...roundBase(project, memberId),
    id: openRoundId,
    round_number: 2,
    status: FeedbackRoundStatus.Open,
    handover_note: "Kontaktformular überarbeitet, Teamfoto eingebaut.",
    due_on: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    handed_over_at: daysAgo(1),
    draft_updated_at: new Date(),
    draft_updated_by_portal_membership_id: project.membershipId,
  });
  await tx.insert(feedbackRoundItems).values([
    {
      ...noResult(),
      id: randomUUID(),
      round_id: openRoundId,
      position: 0,
      area_label: FEEDBACK_AREAS[1],
      kind: FeedbackItemKind.ChangeRequest,
      body: "Im Teamtext fehlt noch unsere neue Kollegin.",
      created_by_portal_membership_id: project.membershipId,
      version: 1,
    },
    {
      ...noResult(),
      id: randomUUID(),
      round_id: openRoundId,
      position: 1,
      area_label: null,
      kind: null,
      // A draft item may stay empty until the customer submits.
      body: "",
      created_by_portal_membership_id: project.membershipId,
      version: 1,
    },
  ]);
}

/** The customer approved in round 1 without any feedback, so the round has no items. */
async function seedApprovedProject(
  tx: ContactDatabaseTransaction,
  project: FeedbackProjectFixture,
  memberId: string,
) {
  await tx.insert(feedbackRounds).values({
    ...roundBase(project, memberId),
    id: randomUUID(),
    round_number: 1,
    status: FeedbackRoundStatus.Approved,
    handover_note: null,
    due_on: null,
    handed_over_at: daysAgo(6),
    approved_at: daysAgo(2),
    approved_by_portal_membership_id: project.membershipId,
  });
}

/** Rounds hang on projects; the caller's project cleanup removes them through the cascade. */
export async function seedFeedbackRounds(
  tx: ContactDatabaseTransaction,
  { memberId, running, approved }: FeedbackFixtureInput,
) {
  await seedRunningProject(tx, running, memberId);
  await seedApprovedProject(tx, approved, memberId);
}
