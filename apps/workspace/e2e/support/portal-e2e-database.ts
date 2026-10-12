import { createHash, randomBytes, randomUUID } from "node:crypto";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  portalInvitationRoles,
  portalInvitations,
} from "@invessiv/db/record-configuration";
import type { PortalE2eFixture } from "./portal-e2e-fixture";
import { PORTAL_E2E_PREFIX as PREFIX } from "@/common/constants/testing/portal-e2e-prefix";
import type { PortalE2eSeed } from "@/common/contracts/testing/portal-e2e-seed";
import {
  loadSystemRoles,
  ensureManager,
  insertPortalMember,
} from "./fixtures/portal-auth-fixture";
import { removeOldCustomers } from "./fixtures/portal-fixture-cleanup";
import { insertBase } from "./fixtures/portal-base-fixture";
import { insertProjects } from "./fixtures/portal-projects-fixture";
import { insertTasks } from "./fixtures/portal-tasks-fixture";
import { insertServiceCatalogFixture } from "./fixtures/portal-services-fixture";
import { insertCredentialsFixture } from "./fixtures/portal-credentials-fixture";
import { insertHoursAccessFixture } from "./fixtures/portal-hours-access-fixture";
export async function preparePortalE2eDatabase(
  managerClerkUserId: string,
  filesContactClerkUserId: string,
  feedbackContactClerkUserId: string,
): Promise<PortalE2eFixture> {
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const { ownerId, portalId, credentialsId } = await loadSystemRoles(tx);
    const managerMemberId = await ensureManager(
      tx,
      managerClerkUserId,
      ownerId,
    );
    await removeOldCustomers(tx);
    const customerA = randomUUID();
    const customerB = randomUUID();
    const filesCustomer = randomUUID();
    const credentialsCustomer = randomUUID();
    const credentialsProject = randomUUID();
    const credentialsHiddenProject = randomUUID();
    const feedbackCustomer = randomUUID();
    const feedbackProject = randomUUID();
    const feedbackApprovalProject = randomUUID();
    const onboardingProject = randomUUID();
    const taskProject = randomUUID();
    const customerTaskId = randomUUID();
    const hoursCustomer = randomUUID();
    const hoursOtherCustomer = randomUUID();
    const hoursProjectA = randomUUID();
    const hoursProjectB = randomUUID();
    const serviceCatalog = {
      serviceStandard: randomUUID(),
      serviceHours: randomUUID(),
      serviceFeedbackRound: randomUUID(),
      serviceNewProject: randomUUID(),
    };
    const personFeedback = randomUUID();
    const personA = randomUUID();
    const personB = randomUUID();
    const personExpired = randomUUID();
    const personFiles = randomUUID();
    const assignmentA = randomUUID();
    const assignmentB = randomUUID();
    const assignmentOther = randomUUID();
    const expiredAssignment = randomUUID();
    const seed: PortalE2eSeed = {
      managerMemberId,
      customerA,
      customerB,
      filesCustomer,
      credentialsCustomer,
      credentialsProject,
      credentialsHiddenProject,
      feedbackCustomer,
      feedbackProject,
      feedbackApprovalProject,
      onboardingProject,
      taskProject,
      customerTaskId,
      hoursCustomer,
      hoursOtherCustomer,
      hoursProjectA,
      hoursProjectB,
      serviceCatalog,
      personFeedback,
      personA,
      personB,
      personExpired,
      personFiles,
      assignmentA,
      assignmentB,
      assignmentOther,
      expiredAssignment,
    };
    await insertBase(tx, seed);
    await insertProjects(tx, seed);
    await insertTasks(tx, seed);
    await insertPortalMember(tx, {
      clerkUserId: filesContactClerkUserId,
      email: "invessiv-portal-files+clerk_test@example.com",
      lastName: "E2E Files Contact",
      displayName: `${PREFIX} Files Contact`,
      customerId: filesCustomer,
      personId: personFiles,
      portalRoleId: portalId,
      managerMemberId,
    });

    await insertPortalMember(tx, {
      clerkUserId: filesContactClerkUserId,
      email: "invessiv-portal-files+clerk_test@example.com",
      lastName: "Files Contact",
      customerId: feedbackCustomer,
      personId: personFiles,
      portalRoleId: portalId,
      managerMemberId,
    });
    await insertPortalMember(tx, {
      clerkUserId: feedbackContactClerkUserId,
      email: "invessiv-portal-feedback+clerk_test@example.com",
      lastName: "Feedback Contact",
      customerId: feedbackCustomer,
      personId: personFeedback,
      portalRoleId: portalId,
      managerMemberId,
    });
    const credentialsMembership = await insertCredentialsFixture(
      tx,
      seed,
      filesContactClerkUserId,
      feedbackContactClerkUserId,
      portalId,
      credentialsId,
    );
    await insertServiceCatalogFixture(tx, serviceCatalog);
    await insertHoursAccessFixture(
      tx,
      seed,
      filesContactClerkUserId,
      feedbackContactClerkUserId,
      portalId,
    );
    const expiredToken = randomBytes(32).toString("base64url");
    const invitationId = randomUUID();
    await tx.insert(portalInvitations).values({
      id: invitationId,
      assignment_id: expiredAssignment,
      token_hash: createHash("sha256").update(expiredToken).digest("hex"),
      email_notifications_enabled: true,
      expires_at: new Date(Date.now() - 60_000),
      redeemed_at: null,
      revoked_at: null,
      created_by_member_id: managerMemberId,
    });
    await tx.insert(portalInvitationRoles).values({
      portal_invitation_id: invitationId,
      role_id: portalId,
      role_realm: AuthRealm.Portal,
    });
    return {
      customerA,
      customerB,
      filesCustomer,
      credentialsCustomer,
      credentialsProject,
      credentialsHiddenProject,
      credentialsMembership,
      credentialsRole: credentialsId,
      standardRole: portalId,
      feedbackCustomer,
      feedbackProject,
      feedbackApprovalProject,
      onboardingProject,
      taskProject,
      customerTaskId,
      hoursCustomer,
      hoursOtherCustomer,
      hoursProjectA,
      hoursProjectB,
      ...serviceCatalog,
      assignmentA,
      assignmentB,
      assignmentOther,
      expiredToken,
    };
  });
}
