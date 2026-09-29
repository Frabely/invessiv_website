import { eq } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { feedbackRounds, projects } from "@invessiv/db/record-configuration";
import { createPortalActor } from "@/server/portal/auth/portal-actor";
import { createFileTestFixture } from "../../files/file-test-fixture";

export const TRACK = {
  processSteps: ["Design", "Entwicklung", "Launch"],
  currentProcessStep: "Entwicklung",
  positions: [2, 2],
};

/** File fixture plus projects with a round track and actors for both worlds. */
export function createFeedbackIntegrationFixture() {
  const f = createFileTestFixture();

  async function project(
    overrides: Partial<{
      status: ProjectStatus;
      processSteps: string[];
      currentProcessStep: string;
      positions: number[] | null;
      includedFeedbackRounds: number;
      customerId: string;
    }> = {},
  ): Promise<string> {
    const id = crypto.randomUUID();
    const [template] = await f
      .database()
      .select()
      .from(projects)
      .where(eq(projects.id, f.projectId));
    const positions =
      overrides.positions === undefined ? TRACK.positions : overrides.positions;
    await f
      .database()
      .insert(projects)
      .values({
        ...template,
        id,
        customer_id: overrides.customerId ?? f.customerId,
        status: overrides.status ?? ProjectStatus.Active,
        process_steps: overrides.processSteps ?? TRACK.processSteps,
        current_process_step:
          overrides.currentProcessStep ?? TRACK.currentProcessStep,
        included_feedback_rounds:
          overrides.includedFeedbackRounds ?? positions?.length ?? 0,
        feedback_round_positions: positions,
        feedback_areas: [],
        version: 1,
      });
    return id;
  }

  async function readProject(id: string) {
    const [row] = await f
      .database()
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    return row;
  }

  async function readRound(id: string) {
    const [row] = await f
      .database()
      .select()
      .from(feedbackRounds)
      .where(eq(feedbackRounds.id, id));
    return row;
  }

  const member = (
    permissions: Permission[] = [
      Permission.ProjectsRead,
      Permission.ProjectsWrite,
      Permission.FilesRead,
    ],
  ) => f.actor({ permissions: new Set(permissions) });

  const contact = (
    permissions: Permission[] = [
      Permission.PortalAccess,
      Permission.PortalProjectsRead,
      Permission.PortalFilesRead,
      Permission.PortalFilesWrite,
      Permission.PortalFeedbackRead,
      Permission.PortalFeedbackSubmit,
    ],
    customerId = f.customerId,
  ) =>
    createPortalActor({
      userId: f.actor().userId,
      membershipId: f.membershipId,
      customerId,
      personId: f.personId,
      firstName: null,
      permissions: new Set(permissions),
      projectPermissions: new Map(),
    });

  return { ...f, project, readProject, readRound, member, contact };
}
