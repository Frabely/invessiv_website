import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, eq, inArray, like, or } from "drizzle-orm";
import { BlobNotFoundError, del } from "@vercel/blob";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import { CustomerStatus } from "@invessiv/common/constants/crm/customer-statuses";
import { HourPurchaseKind } from "@invessiv/common/constants/crm/hour-purchase-kinds";
import { HourPurchaseSource } from "@invessiv/common/constants/crm/hour-purchase-sources";
import { ProjectBillingModel } from "@invessiv/common/constants/crm/project-billing-models";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { ProjectWorkflowKey } from "@invessiv/common/constants/crm/project-workflows";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import {
  activities,
  customerContactAssignments,
  customerHourPurchases,
  customers,
  files,
  people,
  portalInvitationRoles,
  portalInvitations,
  portalMembershipRoles,
  portalMemberships,
  projectHourAllocations,
  projects,
  projectTimeEntries,
  rolePermissions,
  tasks,
  roles,
  users,
  workspaceMemberRoles,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import type { PortalE2eFixture } from "./portal-e2e-fixture";

const PREFIX = "Invessiv Portal E2E";

async function loadSystemRoles(tx: ContactDatabaseTransaction) {
  const found = await tx
    .select({ id: roles.id, key: roles.system_key, active: roles.active })
    .from(roles)
    .where(
      inArray(roles.system_key, [
        SystemRoleKey.WorkspaceOwner,
        SystemRoleKey.PortalStandard,
        SystemRoleKey.PortalCredentials,
      ]),
    );
  const owner = found.find(
    (role) => role.key === SystemRoleKey.WorkspaceOwner && role.active,
  );
  const portal = found.find(
    (role) => role.key === SystemRoleKey.PortalStandard && role.active,
  );
  const credentials = found.find(
    (role) => role.key === SystemRoleKey.PortalCredentials && role.active,
  );
  if (!owner || !portal || !credentials)
    throw new Error(
      "Portal E2E requires active workspace_owner, portal_standard and portal_credentials roles.",
    );
  return {
    ownerId: owner.id,
    portalId: portal.id,
    credentialsId: credentials.id,
  };
}

async function ensureManager(
  tx: ContactDatabaseTransaction,
  clerkUserId: string,
  ownerRoleId: string,
) {
  await tx
    .insert(users)
    .values({
      id: randomUUID(),
      clerk_user_id: clerkUserId,
      primary_email: "invessiv-portal-manager+clerk_test@example.com",
      first_name: "Portal",
      last_name: "E2E Manager",
      display_name: `${PREFIX} Manager`,
      active: true,
      version: 1,
    })
    .onConflictDoNothing({ target: users.clerk_user_id });
  const [manager] = await tx
    .select({ id: users.id, active: users.active })
    .from(users)
    .where(eq(users.clerk_user_id, clerkUserId))
    .limit(1);
  if (!manager?.active)
    throw new Error("Portal E2E manager identity is missing or inactive.");

  await tx
    .insert(workspaceMembers)
    .values({
      id: randomUUID(),
      user_id: manager.id,
      active: true,
      version: 1,
    })
    .onConflictDoNothing({ target: workspaceMembers.user_id });
  const [member] = await tx
    .select({ id: workspaceMembers.id, active: workspaceMembers.active })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.user_id, manager.id))
    .limit(1);
  if (!member?.active)
    throw new Error("Portal E2E manager membership is missing or inactive.");

  await tx
    .insert(workspaceMemberRoles)
    .values({
      workspace_member_id: member.id,
      role_id: ownerRoleId,
      role_realm: AuthRealm.Workspace,
      assigned_by_user_id: manager.id,
      assigned_at: new Date(),
    })
    .onConflictDoNothing();
  return member.id;
}

async function removeOldCustomers(tx: ContactDatabaseTransaction) {
  const oldCustomers = await tx
    .select({ id: customers.id })
    .from(customers)
    .where(like(customers.display_name, `${PREFIX}%`));
  if (oldCustomers.length) {
    const customerIds = oldCustomers.map((row) => row.id);
    const storedFiles = await tx
      .select({ customerId: files.customer_id, storageKey: files.storage_key })
      .from(files)
      .where(inArray(files.customer_id, customerIds));
    if (storedFiles.some((row) => row.storageKey)) {
      for (const row of storedFiles) {
        if (!row.storageKey) continue;
        if (!row.storageKey.startsWith(`customers/${row.customerId}/`))
          throw new Error("Portal E2E file has an unexpected storage scope.");
        // Keep the database reference if storage cleanup fails so the next run can retry.
        try {
          await del(row.storageKey);
        } catch (error) {
          if (!(error instanceof BlobNotFoundError)) throw error;
        }
      }
    }
    const oldProjects = await tx
      .select({ id: projects.id })
      .from(projects)
      .where(inArray(projects.customer_id, customerIds));
    await tx.delete(activities).where(
      oldProjects.length > 0
        ? or(
            inArray(activities.customer_id, customerIds),
            inArray(
              activities.project_id,
              oldProjects.map((row) => row.id),
            ),
          )
        : inArray(activities.customer_id, customerIds),
    );
    await tx.delete(customers).where(inArray(customers.id, customerIds));
  }
  const oldPeople = await tx
    .select({ id: people.id })
    .from(people)
    .where(like(people.display_name, `${PREFIX}%`));
  if (oldPeople.length) {
    await tx.delete(people).where(
      inArray(
        people.id,
        oldPeople.map((row) => row.id),
      ),
    );
  }
  // Custom roles of an earlier run; their memberships went with the customers above.
  await tx
    .delete(roles)
    .where(and(like(roles.name, `${PREFIX}%`), eq(roles.is_system, false)));
}

/** A project that only has to exist and be visible in the portal. */
function plainProjectRow(
  id: string,
  customerId: string,
  ownerMemberId: string,
  title: string,
) {
  return {
    ...feedbackProjectRow(id, customerId, ownerMemberId, title),
    included_feedback_rounds: 0,
    feedback_round_positions: null,
    feedback_areas: [],
  };
}

/**
 * The worked example of the hours plan on its own customer: 10:00 bought, 5:00 for each of two
 * projects, 2:30 and 6:00 booked, plus one goodwill entry that counts against nothing. A second
 * customer holds different numbers, and a custom role without the detail right exists for the
 * contact who may see the balance only.
 */
async function insertHoursFixture(
  tx: ContactDatabaseTransaction,
  input: {
    hoursCustomer: string;
    hoursOtherCustomer: string;
    hoursProjectA: string;
    hoursProjectB: string;
    hoursOtherProject: string;
    managerMemberId: string;
  },
): Promise<string> {
  const { hoursCustomer, hoursOtherCustomer, managerMemberId } = input;
  const yesterday = new Date(Date.now() - 86_400_000)
    .toISOString()
    .slice(0, 10);

  await tx.insert(customers).values(
    [
      [hoursCustomer, "Hours Customer"],
      [hoursOtherCustomer, "Hours Other Customer"],
    ].map(([id, name]) => ({
      id,
      display_name: `${PREFIX} ${name}`,
      status: CustomerStatus.Active,
      owner_member_id: managerMemberId,
      version: 1,
    })),
  );
  await tx
    .insert(projects)
    .values([
      plainProjectRow(
        input.hoursProjectA,
        hoursCustomer,
        managerMemberId,
        "Hours Website",
      ),
      plainProjectRow(
        input.hoursProjectB,
        hoursCustomer,
        managerMemberId,
        "Hours Shop",
      ),
      plainProjectRow(
        input.hoursOtherProject,
        hoursOtherCustomer,
        managerMemberId,
        "Hours Other",
      ),
    ]);

  await tx.insert(customerHourPurchases).values(
    [
      [hoursCustomer, 600],
      [hoursOtherCustomer, 120],
    ].map(([customerId, minutes]) => ({
      id: randomUUID(),
      customer_id: customerId as string,
      kind: HourPurchaseKind.Purchase,
      source: HourPurchaseSource.Manual,
      minutes: minutes as number,
      purchased_on: yesterday,
      note: "Betreuung nach dem Launch",
      idempotency_key: randomUUID(),
      created_by_member_id: managerMemberId,
    })),
  );
  await tx.insert(projectHourAllocations).values(
    [input.hoursProjectA, input.hoursProjectB].map((projectId) => ({
      id: randomUUID(),
      customer_id: hoursCustomer,
      project_id: projectId,
      minutes: 300,
      note: "E2E internal allocation note",
      idempotency_key: randomUUID(),
      created_by_member_id: managerMemberId,
    })),
  );
  await tx.insert(projectTimeEntries).values(
    (
      [
        [hoursCustomer, input.hoursProjectA, 60, "Umbau Hero-Section", true],
        [hoursCustomer, input.hoursProjectA, 90, "Kontaktformular", true],
        [hoursCustomer, input.hoursProjectA, 30, "Kleine Textkorrektur", false],
        [hoursCustomer, input.hoursProjectB, 360, "Produktseiten", true],
        [
          hoursOtherCustomer,
          input.hoursOtherProject,
          15,
          "Fremde Buchung",
          true,
        ],
      ] as const
    ).map(([customerId, projectId, minutes, description, billable]) => ({
      id: randomUUID(),
      customer_id: customerId,
      project_id: projectId,
      task_id: null,
      performed_on: yesterday,
      duration_minutes: minutes,
      description,
      billable,
      performed_by_member_id: managerMemberId,
      version: 1,
    })),
  );

  const summaryRoleId = randomUUID();
  await tx.insert(roles).values({
    id: summaryRoleId,
    realm: AuthRealm.Portal,
    system_key: null,
    name: `${PREFIX} Hours summary only`,
    description: null,
    is_system: false,
    active: true,
    scope_assignable: false,
    version: 1,
  });
  await tx.insert(rolePermissions).values(
    [Permission.PortalAccess, Permission.PortalHoursRead].map((key) => ({
      role_id: summaryRoleId,
      realm: AuthRealm.Portal,
      role_is_system: false,
      role_scope_assignable: false,
      permission_key: key,
      permission_delegable: true,
      permission_scope_assignable: false,
    })),
  );
  return summaryRoleId;
}

/** A contact with an active standard portal membership, created without the invitation flow. */
async function insertPortalMember(
  tx: ContactDatabaseTransaction,
  input: {
    clerkUserId: string;
    email: string;
    lastName: string;
    customerId: string;
    personId: string;
    portalRoleId: string;
    managerMemberId: string;
  },
) {
  await tx
    .insert(users)
    .values({
      id: randomUUID(),
      clerk_user_id: input.clerkUserId,
      primary_email: input.email,
      first_name: "Portal",
      last_name: input.lastName,
      display_name: `${PREFIX} ${input.lastName}`,
      active: true,
      version: 1,
    })
    .onConflictDoNothing({ target: users.clerk_user_id });
  const [user] = await tx
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerk_user_id, input.clerkUserId))
    .limit(1);
  if (!user) throw new Error("Portal E2E contact identity is missing.");
  const membershipId = randomUUID();
  await tx.insert(portalMemberships).values({
    id: membershipId,
    customer_id: input.customerId,
    person_id: input.personId,
    user_id: user.id,
    activated_at: new Date(),
    email_notifications_enabled: false,
    version: 1,
  });
  await tx.insert(portalMembershipRoles).values({
    portal_membership_id: membershipId,
    role_id: input.portalRoleId,
    role_realm: AuthRealm.Portal,
    assigned_by_member_id: input.managerMemberId,
    assigned_at: new Date(),
  });
  return membershipId;
}

/** Both rounds sit before "Launch" and the project is at "Entwicklung", so round 2 follows round 1
 * without moving the track, and the approval moves it to "Launch". */
function feedbackProjectRow(
  id: string,
  customerId: string,
  ownerMemberId: string,
  title: string,
) {
  return {
    id,
    customer_id: customerId,
    owner_member_id: ownerMemberId,
    title: `${PREFIX} ${title}`,
    status: ProjectStatus.Active,
    phase: ProjectPhase.Development,
    process_steps: ["Design", "Entwicklung", "Launch"],
    current_process_step: "Entwicklung",
    workflow_key: ProjectWorkflowKey.StandardWebV1,
    billing_model: ProjectBillingModel.FixedPrice,
    included_feedback_rounds: 2,
    feedback_round_positions: [2, 2],
    feedback_areas: ["Startseite", "Kontakt"],
    preview_url: "https://example.com/preview",
    next_step_label: null,
    next_step_due_on: null,
    started_on: null,
    budget_cents: null,
    hourly_rate_cents: null,
    version: 1,
  };
}

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
    const personFeedback = randomUUID();
    const personA = randomUUID();
    const personB = randomUUID();
    const personExpired = randomUUID();
    const personFiles = randomUUID();
    const assignmentA = randomUUID();
    const assignmentB = randomUUID();
    const assignmentOther = randomUUID();
    const expiredAssignment = randomUUID();

    await tx.insert(people).values([
      {
        id: personA,
        display_name: `${PREFIX} Contact A`,
        primary_email: "invessiv-portal-a+clerk_test@example.com",
        preferred_locale: "de",
        version: 1,
      },
      {
        id: personB,
        display_name: `${PREFIX} Contact B`,
        primary_email: "invessiv-portal-b+clerk_test@example.com",
        preferred_locale: "de",
        version: 1,
      },
      {
        id: personExpired,
        display_name: `${PREFIX} Expired Contact`,
        primary_email: "expired-portal+clerk_test@example.com",
        preferred_locale: "de",
        version: 1,
      },
      {
        id: personFiles,
        display_name: `${PREFIX} Files Contact`,
        primary_email: "invessiv-portal-files+clerk_test@example.com",
        preferred_locale: "de",
        version: 1,
      },
      {
        id: personFeedback,
        display_name: `${PREFIX} Feedback Contact`,
        primary_email: "invessiv-portal-feedback+clerk_test@example.com",
        preferred_locale: "de",
        version: 1,
      },
    ]);
    await tx.insert(customers).values([
      {
        id: credentialsCustomer,
        display_name: `${PREFIX} Credentials Customer`,
        status: CustomerStatus.Active,
        owner_member_id: managerMemberId,
        version: 1,
      },
      {
        id: customerA,
        display_name: `${PREFIX} Customer A`,
        status: CustomerStatus.Active,
        owner_member_id: managerMemberId,
        version: 1,
      },
      {
        id: customerB,
        display_name: `${PREFIX} Customer B`,
        status: CustomerStatus.Active,
        owner_member_id: managerMemberId,
        version: 1,
      },
      {
        id: filesCustomer,
        display_name: `${PREFIX} Files Customer`,
        status: CustomerStatus.Active,
        owner_member_id: managerMemberId,
        version: 1,
      },
      {
        id: feedbackCustomer,
        display_name: `${PREFIX} Feedback Customer`,
        status: CustomerStatus.Active,
        owner_member_id: managerMemberId,
        version: 1,
      },
    ]);
    await tx.insert(projects).values([
      {
        ...feedbackProjectRow(
          credentialsProject,
          credentialsCustomer,
          managerMemberId,
          "Credentials visible",
        ),
        included_feedback_rounds: 0,
        feedback_round_positions: null,
        feedback_areas: [],
      },
      {
        ...feedbackProjectRow(
          credentialsHiddenProject,
          credentialsCustomer,
          managerMemberId,
          "Credentials hidden",
        ),
        status: ProjectStatus.Archived,
        included_feedback_rounds: 0,
        feedback_round_positions: null,
        feedback_areas: [],
      },
      feedbackProjectRow(
        feedbackProject,
        feedbackCustomer,
        managerMemberId,
        "Feedback-Website",
      ),
      feedbackProjectRow(
        feedbackApprovalProject,
        feedbackCustomer,
        managerMemberId,
        "Feedback-Freigabe",
      ),
      // No round steps: the project stays out of the feedback widget and its tests.
      {
        ...feedbackProjectRow(
          onboardingProject,
          feedbackCustomer,
          managerMemberId,
          "Onboarding-Website",
        ),
        included_feedback_rounds: 0,
        feedback_round_positions: null,
        feedback_areas: [],
      },
      {
        ...feedbackProjectRow(
          taskProject,
          feedbackCustomer,
          managerMemberId,
          "Portal-Aufgaben-Test",
        ),
        included_feedback_rounds: 0,
        feedback_round_positions: null,
        feedback_areas: [],
      },
    ]);
    await tx.insert(tasks).values([
      {
        id: customerTaskId,
        project_id: taskProject,
        title: "E2E customer task",
        description: "Customer completion and reopening flow",
        status: TaskStatus.Open,
        action_side: TaskActionSide.Customer,
        visible_to_customer: true,
        assignee_member_id: managerMemberId,
        version: 1,
      },
      {
        id: randomUUID(),
        project_id: taskProject,
        title: "E2E team-completed task",
        description: "The customer must not reopen this completion",
        status: TaskStatus.Done,
        action_side: TaskActionSide.Customer,
        visible_to_customer: true,
        assignee_member_id: managerMemberId,
        completed_at: new Date(),
        completed_by_member_id: managerMemberId,
        version: 1,
      },
    ]);
    // Customer B: one feedback round after the design and two before the launch.
    await tx.insert(projects).values({
      id: randomUUID(),
      customer_id: customerB,
      owner_member_id: managerMemberId,
      title: `${PREFIX} Website-Relaunch`,
      status: ProjectStatus.Active,
      phase: ProjectPhase.Development,
      process_steps: [
        "Onboarding",
        "Design",
        "Entwicklung",
        "Launch",
        "Wartung",
      ],
      current_process_step: "Entwicklung",
      workflow_key: ProjectWorkflowKey.StandardWebV1,
      billing_model: ProjectBillingModel.FixedPrice,
      included_feedback_rounds: 3,
      feedback_round_positions: [2, 3, 3],
      preview_url: null,
      next_step_label: null,
      next_step_due_on: null,
      started_on: null,
      budget_cents: null,
      hourly_rate_cents: null,
      version: 1,
    });
    await tx.insert(customerContactAssignments).values([
      {
        id: randomUUID(),
        customer_id: credentialsCustomer,
        person_id: personFiles,
        is_primary: true,
        version: 1,
      },
      {
        id: randomUUID(),
        customer_id: credentialsCustomer,
        person_id: personFeedback,
        is_primary: false,
        version: 1,
      },
      {
        id: assignmentA,
        customer_id: customerA,
        person_id: personA,
        is_primary: true,
        version: 1,
      },
      {
        id: assignmentB,
        customer_id: customerB,
        person_id: personA,
        is_primary: true,
        version: 1,
      },
      {
        id: assignmentOther,
        customer_id: customerA,
        person_id: personB,
        is_primary: false,
        version: 1,
      },
      {
        id: expiredAssignment,
        customer_id: customerB,
        person_id: personExpired,
        is_primary: false,
        version: 1,
      },
      {
        id: randomUUID(),
        customer_id: filesCustomer,
        person_id: personFiles,
        is_primary: true,
        version: 1,
      },
      {
        id: randomUUID(),
        customer_id: feedbackCustomer,
        person_id: personFiles,
        is_primary: true,
        version: 1,
      },
      {
        id: randomUUID(),
        customer_id: feedbackCustomer,
        person_id: personFeedback,
        is_primary: false,
        version: 1,
      },
    ]);

    const filesUserId = randomUUID();
    await tx
      .insert(users)
      .values({
        id: filesUserId,
        clerk_user_id: filesContactClerkUserId,
        primary_email: "invessiv-portal-files+clerk_test@example.com",
        first_name: "Portal",
        last_name: "E2E Files Contact",
        display_name: `${PREFIX} Files Contact`,
        active: true,
        version: 1,
      })
      .onConflictDoNothing({ target: users.clerk_user_id });
    const [filesUser] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerk_user_id, filesContactClerkUserId))
      .limit(1);
    if (!filesUser)
      throw new Error("Portal E2E files contact identity is missing.");
    const filesMembershipId = randomUUID();
    await tx.insert(portalMemberships).values({
      id: filesMembershipId,
      customer_id: filesCustomer,
      person_id: personFiles,
      user_id: filesUser.id,
      activated_at: new Date(),
      email_notifications_enabled: false,
      version: 1,
    });
    await tx.insert(portalMembershipRoles).values({
      portal_membership_id: filesMembershipId,
      role_id: portalId,
      role_realm: AuthRealm.Portal,
      assigned_by_member_id: managerMemberId,
      assigned_at: new Date(),
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

    const credentialsMembership = await insertPortalMember(tx, {
      clerkUserId: filesContactClerkUserId,
      email: "invessiv-portal-files+clerk_test@example.com",
      lastName: "Files Contact",
      customerId: credentialsCustomer,
      personId: personFiles,
      portalRoleId: portalId,
      managerMemberId,
    });
    await tx.insert(portalMembershipRoles).values({
      portal_membership_id: credentialsMembership,
      role_id: credentialsId,
      role_realm: AuthRealm.Portal,
      assigned_by_member_id: managerMemberId,
      assigned_at: new Date(),
    });
    await insertPortalMember(tx, {
      clerkUserId: feedbackContactClerkUserId,
      email: "invessiv-portal-feedback+clerk_test@example.com",
      lastName: "Feedback Contact",
      customerId: credentialsCustomer,
      personId: personFeedback,
      portalRoleId: portalId,
      managerMemberId,
    });

    const hoursSummaryRole = await insertHoursFixture(tx, {
      hoursCustomer,
      hoursOtherCustomer,
      hoursProjectA,
      hoursProjectB,
      hoursOtherProject: randomUUID(),
      managerMemberId,
    });
    await tx.insert(customerContactAssignments).values([
      {
        id: randomUUID(),
        customer_id: hoursCustomer,
        person_id: personFiles,
        is_primary: true,
        version: 1,
      },
      {
        id: randomUUID(),
        customer_id: hoursCustomer,
        person_id: personFeedback,
        is_primary: false,
        version: 1,
      },
      {
        id: randomUUID(),
        customer_id: hoursOtherCustomer,
        person_id: personFeedback,
        is_primary: true,
        version: 1,
      },
    ]);
    await insertPortalMember(tx, {
      clerkUserId: filesContactClerkUserId,
      email: "invessiv-portal-files+clerk_test@example.com",
      lastName: "Files Contact",
      customerId: hoursCustomer,
      personId: personFiles,
      portalRoleId: portalId,
      managerMemberId,
    });
    // Same person, two companies: the summary-only role here, the standard role at the other one.
    await insertPortalMember(tx, {
      clerkUserId: feedbackContactClerkUserId,
      email: "invessiv-portal-feedback+clerk_test@example.com",
      lastName: "Feedback Contact",
      customerId: hoursCustomer,
      personId: personFeedback,
      portalRoleId: hoursSummaryRole,
      managerMemberId,
    });
    await insertPortalMember(tx, {
      clerkUserId: feedbackContactClerkUserId,
      email: "invessiv-portal-feedback+clerk_test@example.com",
      lastName: "Feedback Contact",
      customerId: hoursOtherCustomer,
      personId: personFeedback,
      portalRoleId: portalId,
      managerMemberId,
    });

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
      assignmentA,
      assignmentB,
      assignmentOther,
      expiredToken,
    };
  });
}
