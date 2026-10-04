import "server-only";

import {
  and,
  desc,
  eq,
  exists,
  gt,
  inArray,
  ne,
  or,
  type SQL,
} from "drizzle-orm";
import { cache } from "react";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { ONBOARDING_PORTAL_VISIBLE_STATUS_VALUES } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalCanOn } from "@/server/portal/shared/portal-can-on";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  feedbackRounds,
  onboardingForms,
  projects,
  tasks,
} from "@invessiv/db/record-configuration";
import { comparePortalCurrentProjects } from "@/common/patterns/portal/compare-portal-current-projects";
import { portalProjectCondition } from "@/server/portal/shared/portal-project-condition";

// Layout and page of one render share the reader object, so they also share this list.
const listSummaries = cache(async (reader: PortalReader) =>
  getDrizzleDatabaseClient()
    .select({
      id: projects.id,
      title: projects.title,
      status: projects.status,
      previewUrl: projects.preview_url,
    })
    .from(projects)
    .where(portalProjectCondition(reader, Permission.PortalProjectsRead))
    .orderBy(desc(projects.created_at)),
);

/** Project names provide navigation for independently readable project-bound portal areas. */
const listSelectableSummaries = cache(async (reader: PortalReader) => {
  const target = { customerId: reader.customerId };
  if (portalCanOn.forReader(reader, Permission.PortalProjectsRead, target))
    return listSummaries(reader);
  const db = getDrizzleDatabaseClient();
  const readableAreas: SQL[] = [];
  if (portalCanOn.forReader(reader, Permission.PortalTasksRead, target))
    readableAreas.push(
      exists(
        db
          .select({ id: tasks.id })
          .from(tasks)
          .where(
            and(
              eq(tasks.project_id, projects.id),
              eq(tasks.visible_to_customer, true),
              ne(tasks.status, TaskStatus.Cancelled),
            ),
          ),
      ),
    );
  if (portalCanOn.forReader(reader, Permission.PortalFeedbackRead, target))
    readableAreas.push(
      or(
        gt(projects.included_feedback_rounds, 0),
        exists(
          db
            .select({ id: feedbackRounds.id })
            .from(feedbackRounds)
            .where(eq(feedbackRounds.project_id, projects.id)),
        ),
      )!,
    );
  if (portalCanOn.forReader(reader, Permission.PortalOnboardingRead, target))
    readableAreas.push(
      exists(
        db
          .select({ id: onboardingForms.id })
          .from(onboardingForms)
          .where(
            and(
              eq(onboardingForms.project_id, projects.id),
              inArray(
                onboardingForms.status,
                ONBOARDING_PORTAL_VISIBLE_STATUS_VALUES,
              ),
            ),
          ),
      ),
    );
  if (readableAreas.length === 0) return [];
  return db
    .select({
      id: projects.id,
      title: projects.title,
      status: projects.status,
      previewUrl: projects.preview_url,
    })
    .from(projects)
    .where(
      and(
        portalProjectCondition(reader, Permission.PortalAccess),
        or(...readableAreas),
      ),
    )
    .orderBy(desc(projects.created_at));
});

/** Everything not completed, ordered the way the project switcher lists it. */
function toCurrent<Project extends { status: ProjectStatus }>(
  summaries: readonly Project[],
): Project[] {
  return summaries
    .filter((project) => project.status !== ProjectStatus.Completed)
    .sort(comparePortalCurrentProjects);
}

export const portalProjectService = {
  listSummaries,
  listSelectableSummaries,
  toCurrent,
} as const;
