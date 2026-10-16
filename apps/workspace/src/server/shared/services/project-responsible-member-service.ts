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
import type {
  ProjectBookingContact,
  ProjectResponsibleContacts,
} from "./project-responsible-member-types";

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
  return (await findContacts(executor, projectId)).bookingContact;
}

/**
 * Loads owners once for the address and calendar choices. The first active owner answers email;
 * the calendar may belong to the next one when the first has no booking link.
 */
async function findContacts(
  executor: ContactDatabaseReader,
  projectId: string,
): Promise<ProjectResponsibleContacts> {
  const members = await loadActiveOwners(executor, projectId);
  const [contact] = members;
  const bookable = members.find((member) => member.bookingUrl);
  return {
    contact: contact
      ? { displayName: contact.displayName, email: contact.email }
      : null,
    bookingContact: bookable?.bookingUrl
      ? {
          memberId: bookable.memberId,
          displayName: bookable.displayName,
          bookingUrl: bookable.bookingUrl,
        }
      : null,
  };
}

export const projectResponsibleMemberService = {
  findActiveMemberId,
  findBookingContact,
  findContacts,
} as const;
