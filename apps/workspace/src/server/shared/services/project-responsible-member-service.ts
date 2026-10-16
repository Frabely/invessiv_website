import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import type {
  ContactDatabaseReader,
  ContactDatabaseTransaction,
} from "@invessiv/db/core";
import {
  customers,
  projects,
  users,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import type { ProjectResponsibleContact } from "@/common/contracts/crm/project-responsible-contact";
import type { ProjectBookingContact } from "./project-responsible-member-types";

/** Who answers for a project, in order: its owner, then the owner of its customer. */
async function loadOwnerMemberIds(
  executor: ContactDatabaseReader,
  projectId: string,
): Promise<string[]> {
  const [owners] = await executor
    .select({
      projectOwner: projects.owner_member_id,
      customerOwner: customers.owner_member_id,
    })
    .from(projects)
    .innerJoin(customers, eq(customers.id, projects.customer_id))
    .where(eq(projects.id, projectId));
  return owners ? [owners.projectOwner, owners.customerOwner] : [];
}

/**
 * The member who answers for a project right now: its owner, otherwise the owner of its customer,
 * each only while active. The member row stays shared-locked until commit, so it cannot be
 * deactivated between this lookup and the write that names it.
 */
async function findActiveMemberId(
  tx: ContactDatabaseTransaction,
  projectId: string,
): Promise<string | null> {
  for (const memberId of await loadOwnerMemberIds(tx, projectId)) {
    const [member] = await tx
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.id, memberId),
          eq(workspaceMembers.active, true),
        ),
      )
      .for("share");
    if (member) return member.id;
  }
  return null;
}

/** The active ones of project owner and customer owner, in that order. A pure read without lock. */
async function loadActiveOwners(
  executor: ContactDatabaseReader,
  projectId: string,
) {
  const ownerMemberIds = await loadOwnerMemberIds(executor, projectId);
  if (ownerMemberIds.length === 0) return [];
  const members = await executor
    .select({
      memberId: workspaceMembers.id,
      displayName: users.display_name,
      email: users.primary_email,
      bookingUrl: workspaceMembers.booking_url,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.user_id))
    .where(
      and(
        inArray(workspaceMembers.id, ownerMemberIds),
        eq(workspaceMembers.active, true),
      ),
    );
  return ownerMemberIds.flatMap((memberId) =>
    members.filter((member) => member.memberId === memberId),
  );
}

/**
 * Whose calendar the customer of a project books: the first of project owner and customer owner
 * who is active **and** has a booking link. An active project owner without a link passes the
 * question on to the customer owner; an inactive member never offers a link, even a stored one.
 */
async function findBookingContact(
  executor: ContactDatabaseReader,
  projectId: string,
): Promise<ProjectBookingContact | null> {
  for (const member of await loadActiveOwners(executor, projectId)) {
    if (member.bookingUrl)
      return {
        memberId: member.memberId,
        displayName: member.displayName,
        bookingUrl: member.bookingUrl,
      };
  }
  return null;
}

/**
 * Whom the customer of a project writes to: the first active member of project owner and customer
 * owner. The address is master data shown to the customer; it never authorizes anything.
 */
async function findContact(
  executor: ContactDatabaseReader,
  projectId: string,
): Promise<ProjectResponsibleContact | null> {
  const [member] = await loadActiveOwners(executor, projectId);
  return member
    ? { displayName: member.displayName, email: member.email }
    : null;
}

export const projectResponsibleMemberService = {
  findActiveMemberId,
  findBookingContact,
  findContact,
} as const;
