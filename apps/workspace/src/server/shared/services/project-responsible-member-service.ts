import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  customers,
  projects,
  users,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import type { ProjectBookingContact } from "./project-responsible-member-types";

type ReadExecutor = Pick<ContactDatabaseTransaction, "select">;

/** Who answers for a project, in order: its owner, then the owner of its customer. */
async function loadOwnerMemberIds(
  executor: ReadExecutor,
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

/**
 * Whose calendar the customer of a project books: the first of project owner and customer owner
 * who is active **and** has a booking link. An active project owner without a link passes the
 * question on to the customer owner; an inactive member never offers a link, even a stored one.
 * A pure read, so it takes no lock.
 */
async function findBookingContact(
  executor: ReadExecutor,
  projectId: string,
): Promise<ProjectBookingContact | null> {
  const ownerMemberIds = await loadOwnerMemberIds(executor, projectId);
  if (ownerMemberIds.length === 0) return null;
  const members = await executor
    .select({
      memberId: workspaceMembers.id,
      displayName: users.display_name,
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
  for (const memberId of ownerMemberIds) {
    const member = members.find((candidate) => candidate.memberId === memberId);
    if (member?.bookingUrl) {
      return { ...member, bookingUrl: member.bookingUrl };
    }
  }
  return null;
}

export const projectResponsibleMemberService = {
  findActiveMemberId,
  findBookingContact,
} as const;
