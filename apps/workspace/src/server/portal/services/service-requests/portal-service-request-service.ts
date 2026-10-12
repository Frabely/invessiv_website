import "server-only";
import { and, desc, eq, inArray, isNotNull, type SQL } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { HOURS_CLOSED_PROJECT_STATUS_VALUES } from "@invessiv/common/constants/crm/hours-closed-project-statuses";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import { PORTAL_VISIBLE_PROJECT_STATUS_VALUES } from "@invessiv/common/constants/portal/portal-visible-project-statuses";
import type {
  PortalServiceProjectRow,
  PortalSelectableProjectsByKind,
} from "./portal-service-request-types";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { OPEN_SERVICE_REQUEST_STATUS_VALUES } from "@invessiv/common/constants/crm/service-request-statuses";
import type { PortalServiceProjectOptionDto } from "@invessiv/common/contracts/portal/portal-service-project-option.dto";
import type { ContactDatabaseReader } from "@invessiv/db/core";
import {
  lineItemTemplates,
  projects,
  serviceRequests,
} from "@invessiv/db/record-configuration";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalAccessCondition } from "@/server/portal/shared/portal-access-condition";
import { portalCanOn } from "@/server/portal/shared/portal-can-on";
import { portalProjectCondition } from "@/server/portal/shared/portal-project-condition";
import { loadExtraFeedbackRoundBlockers } from "@/server/shared/services/feedback/load-extra-feedback-round-blockers";

/** What the portal offers: released and still active. Archiving ends the release at once. */
function catalogCondition(): SQL {
  return and(
    eq(lineItemTemplates.status, LineItemTemplateStatus.Active),
    eq(lineItemTemplates.portal_requestable, true),
  )!;
}

/** Requests of the reader's own company; `FALSE` without the right, so a miss looks like no data. */
function requestCondition(reader: PortalReader, permission: Permission): SQL {
  return portalAccessCondition.forReader(reader, permission, {
    customerId: serviceRequests.customer_id,
  });
}

/** Projects of one company that already wait for an answer on a further feedback round. */
async function openExtraRoundProjectIds(
  executor: ContactDatabaseReader,
  customerId: string,
): Promise<Set<string>> {
  const rows = await executor
    .select({ projectId: serviceRequests.requested_project_id })
    .from(serviceRequests)
    .where(
      and(
        eq(serviceRequests.customer_id, customerId),
        eq(serviceRequests.kind, LineItemKind.FeedbackRound),
        inArray(serviceRequests.status, OPEN_SERVICE_REQUEST_STATUS_VALUES),
        isNotNull(serviceRequests.requested_project_id),
      ),
    );
  return new Set(rows.flatMap((row) => row.projectId ?? []));
}

const PROJECT_STATUSES_BY_KIND: Record<LineItemKind, readonly ProjectStatus[]> =
  {
    [LineItemKind.Standard]: PORTAL_VISIBLE_PROJECT_STATUS_VALUES,
    [LineItemKind.Hours]: PORTAL_VISIBLE_PROJECT_STATUS_VALUES.filter(
      (status) => !HOURS_CLOSED_PROJECT_STATUS_VALUES.includes(status),
    ),
    [LineItemKind.FeedbackRound]: [ProjectStatus.Active],
  };

/**
 * The read flow loads every candidate once; a command can restrict the query to its service kind.
 * Naming a project means reading its title, so without `portal.projects.read` there are no
 * candidates: such a contact asks without a project, and services that need one are not offered.
 */
async function projectCandidates(
  executor: ContactDatabaseReader,
  reader: PortalReader,
  permission: Permission,
  kind?: LineItemKind,
): Promise<PortalServiceProjectRow[]> {
  return executor
    .select({
      id: projects.id,
      title: projects.title,
      status: projects.status,
      feedback_round_positions: projects.feedback_round_positions,
    })
    .from(projects)
    .where(
      and(
        portalProjectCondition(reader, permission),
        portalAccessCondition.forReader(reader, Permission.PortalProjectsRead, {
          customerId: projects.customer_id,
        }),
        kind === undefined
          ? undefined
          : inArray(projects.status, [...PROJECT_STATUSES_BY_KIND[kind]]),
      ),
    )
    .orderBy(desc(projects.created_at));
}

async function feedbackProjectOptions(
  executor: ContactDatabaseReader,
  rows: readonly PortalServiceProjectRow[],
  openProjectIds: ReadonlySet<string> | Promise<ReadonlySet<string>>,
): Promise<PortalServiceProjectOptionDto[]> {
  if (rows.length === 0) return [];
  const [blockers, alreadyRequested] = await Promise.all([
    loadExtraFeedbackRoundBlockers(
      executor,
      rows.map((row) => ({
        id: row.id,
        positions: row.feedback_round_positions ?? [],
      })),
    ),
    openProjectIds,
  ]);
  return rows
    .filter(
      (row) =>
        (blockers.get(row.id) ?? null) === null &&
        !alreadyRequested.has(row.id),
    )
    .map(projectOption);
}

function projectOption({
  id,
  title,
}: PortalServiceProjectRow): PortalServiceProjectOptionDto {
  return { id, title };
}

/** All kinds share these already authorized project rows and the requests read in the same query flow. */
async function projectOptionsByKind(
  executor: ContactDatabaseReader,
  rows: readonly PortalServiceProjectRow[],
  openExtraRoundIds: ReadonlySet<string>,
  includeFeedbackRounds: boolean,
): Promise<PortalSelectableProjectsByKind> {
  const candidates = (kind: LineItemKind) =>
    rows.filter((row) => PROJECT_STATUSES_BY_KIND[kind].includes(row.status));
  return {
    [LineItemKind.Standard]: candidates(LineItemKind.Standard).map(
      projectOption,
    ),
    [LineItemKind.Hours]: candidates(LineItemKind.Hours).map(projectOption),
    [LineItemKind.FeedbackRound]: includeFeedbackRounds
      ? await feedbackProjectOptions(
          executor,
          candidates(LineItemKind.FeedbackRound),
          openExtraRoundIds,
        )
      : [],
  };
}

/** Commands recheck eligibility in their own transaction instead of trusting the read DTO. */
async function selectableProjects(
  executor: ContactDatabaseReader,
  reader: PortalReader,
  permission: Permission,
  kind: LineItemKind,
): Promise<PortalServiceProjectOptionDto[]> {
  const rows = await projectCandidates(executor, reader, permission, kind);
  if (kind !== LineItemKind.FeedbackRound || rows.length === 0)
    return rows.map(projectOption);
  return feedbackProjectOptions(
    executor,
    rows,
    openExtraRoundProjectIds(executor, reader.customerId),
  );
}

/** The single definition of what the portal offers, shows and accepts for service requests. */
export const portalServiceRequestService = {
  can: portalCanOn.forCustomer,
  catalogCondition,
  requestCondition,
  openExtraRoundProjectIds,
  projectCandidates,
  projectOptionsByKind,
  selectableProjects,
} as const;
