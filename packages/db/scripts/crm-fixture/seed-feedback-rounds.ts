import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { FeedbackItemKind } from "@invessiv/common/constants/crm/feedback-item-kinds";
import { FeedbackClarificationStatus } from "@invessiv/common/constants/crm/feedback-clarification-statuses";
import { FeedbackItemResult } from "@invessiv/common/constants/crm/feedback-item-results";
import { FeedbackResultActorSide } from "@invessiv/common/constants/crm/feedback-result-actor-sides";
import { FeedbackResultHistoryEventKind } from "@invessiv/common/constants/crm/feedback-result-history-event-kinds";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  feedbackRoundItems,
  feedbackRoundItemClarifications,
  feedbackRoundItemResultHistory,
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
  /** Gets a completed round 1 and round 2 in progress with clarification examples. */
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
    version: 4,
  };
  const ratedItems = await tx
    .insert(feedbackRoundItems)
    .values([
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
    ])
    .returning();
  for (const item of ratedItems) {
    const base = {
      item_id: item.id,
      actor_side: FeedbackResultActorSide.Member,
      actor_member_id: memberId,
      actor_portal_membership_id: null,
    };
    await tx.insert(feedbackRoundItemResultHistory).values([
      {
        ...base,
        id: randomUUID(),
        item_version: 1,
        event_kind: FeedbackResultHistoryEventKind.Baseline,
        result: item.result,
        result_note: "Ergebnis vor erneuter Prüfung.",
        result_set_by_member_id: memberId,
        result_set_at: daysAgo(6),
        occurred_at: daysAgo(6),
        command_id: null,
        request_version: null,
      },
      {
        ...base,
        id: randomUUID(),
        item_version: 2,
        event_kind: FeedbackResultHistoryEventKind.Set,
        result: item.result,
        result_note: "Ergebnis mit dem Team abgestimmt.",
        result_set_by_member_id: memberId,
        result_set_at: daysAgo(5),
        occurred_at: daysAgo(5),
        command_id: randomUUID(),
        request_version: 1,
      },
      {
        ...base,
        id: randomUUID(),
        item_version: 3,
        event_kind: FeedbackResultHistoryEventKind.Reset,
        result: null,
        result_note: null,
        result_set_by_member_id: null,
        result_set_at: null,
        occurred_at: daysAgo(4),
        command_id: randomUUID(),
        request_version: 2,
      },
      {
        ...base,
        id: randomUUID(),
        item_version: 4,
        event_kind: FeedbackResultHistoryEventKind.Set,
        result: item.result,
        result_note: item.result_note,
        result_set_by_member_id: memberId,
        result_set_at: completedAt,
        occurred_at: completedAt,
        command_id: randomUUID(),
        request_version: 3,
      },
    ]);
  }
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
  const clarificationItemIds = [randomUUID(), randomUUID(), randomUUID()];
  await tx.insert(feedbackRounds).values({
    ...roundBase(project, memberId),
    id: openRoundId,
    round_number: 2,
    status: FeedbackRoundStatus.InProgress,
    handover_note: "Kontaktformular überarbeitet, Teamfoto eingebaut.",
    due_on: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    handed_over_at: daysAgo(1),
    draft_updated_at: new Date(),
    draft_updated_by_portal_membership_id: project.membershipId,
    submitted_at: daysAgo(1),
    submitted_by_portal_membership_id: project.membershipId,
    started_at: daysAgo(1),
  });
  await tx.insert(feedbackRoundItems).values([
    {
      ...noResult(),
      id: clarificationItemIds[0],
      round_id: openRoundId,
      position: 0,
      area_label: FEEDBACK_AREAS[1],
      kind: FeedbackItemKind.ChangeRequest,
      body: "Im Teamtext fehlt noch unsere neue Kollegin.",
      created_by_portal_membership_id: project.membershipId,
      version: 2,
    },
    {
      ...noResult(),
      id: clarificationItemIds[1],
      round_id: openRoundId,
      position: 1,
      area_label: null,
      kind: null,
      body: "Das Kontaktformular soll weniger Felder haben.",
      created_by_portal_membership_id: project.membershipId,
      version: 3,
    },
    {
      ...noResult(),
      id: clarificationItemIds[2],
      round_id: openRoundId,
      position: 2,
      area_label: FEEDBACK_AREAS[0],
      kind: FeedbackItemKind.ChangeRequest,
      body: "Die Überschrift auf der Startseite bitte kürzen.",
      created_by_portal_membership_id: project.membershipId,
      version: 3,
    },
  ]);
  for (const [index, status] of [
    FeedbackClarificationStatus.Open,
    FeedbackClarificationStatus.Answered,
    FeedbackClarificationStatus.Closed,
  ].entries()) {
    await tx.insert(feedbackRoundItemClarifications).values({
      id: randomUUID(),
      item_id: clarificationItemIds[index],
      status,
      question: [
        "Wie heißt die neue Kollegin und welche Rolle hat sie?",
        "Welche Felder braucht ihr im Formular?",
        "Welche Aussage soll die Überschrift vermitteln?",
      ][index],
      requested_by_member_id: memberId,
      requested_at: daysAgo(1),
      request_version: 1,
      answer:
        status === FeedbackClarificationStatus.Answered
          ? "Name, E-Mail und Nachricht reichen uns."
          : null,
      answered_by_portal_membership_id:
        status === FeedbackClarificationStatus.Answered
          ? project.membershipId
          : null,
      answered_at:
        status === FeedbackClarificationStatus.Answered ? new Date() : null,
      answer_command_id:
        status === FeedbackClarificationStatus.Answered ? randomUUID() : null,
      answer_request_version:
        status === FeedbackClarificationStatus.Answered ? 2 : null,
      close_note:
        status === FeedbackClarificationStatus.Closed
          ? "Im Gespräch geklärt: Der Nutzen für Kunden steht im Vordergrund."
          : null,
      closed_by_member_id:
        status === FeedbackClarificationStatus.Closed ? memberId : null,
      closed_at:
        status === FeedbackClarificationStatus.Closed ? new Date() : null,
      close_command_id:
        status === FeedbackClarificationStatus.Closed ? randomUUID() : null,
      close_request_version:
        status === FeedbackClarificationStatus.Closed ? 2 : null,
      version: status === FeedbackClarificationStatus.Open ? 1 : 2,
    });
  }
  await tx.insert(tasks).values({
    id: randomUUID(),
    project_id: project.projectId,
    feedback_round_id: openRoundId,
    title: "Feedbackrunde 2 umsetzen",
    description: "",
    status: TaskStatus.InProgress,
    action_side: TaskActionSide.Internal,
    visible_to_customer: false,
    assignee_member_id: memberId,
    due_on: null,
    completed_at: null,
    completed_by_member_id: null,
    completed_by_portal_membership_id: null,
    created_by_portal_membership_id: null,
    version: 1,
  });
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
