import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";
import type { ContactDatabaseReader } from "@invessiv/db/core";
import { projectResponsibleMemberService } from "@/server/shared/services/project-responsible-member-service";

vi.mock("server-only", () => ({}));

const projectOwner = {
  memberId: "project-owner",
  displayName: "Project Owner",
  email: "project@example.test",
  bookingUrl: null as string | null,
};
const customerOwner = {
  memberId: "customer-owner",
  displayName: "Customer Owner",
  email: "customer@example.test",
  bookingUrl: "https://example.test/customer-calendar",
};

function database(
  members: readonly (typeof projectOwner)[],
  owners = [
    {
      projectOwner: projectOwner.memberId,
      customerOwner: customerOwner.memberId,
    },
  ],
) {
  const where = vi
    .fn()
    .mockResolvedValueOnce(owners)
    .mockResolvedValueOnce(members);
  const chain = { innerJoin: vi.fn(), where };
  chain.innerJoin.mockReturnValue(chain);
  const select = vi.fn(() => ({ from: vi.fn(() => chain) }));
  return {
    executor: { select } as unknown as ContactDatabaseReader,
    select,
    where,
  };
}

describe("projectResponsibleMemberService contact choices", () => {
  it("loads owners once and keeps the email owner when only the fallback offers a calendar", async () => {
    // Database order must not decide which of the two owners takes priority.
    const db = database([customerOwner, projectOwner]);
    await expect(
      projectResponsibleMemberService.findContacts(db.executor, "project-1"),
    ).resolves.toEqual({
      contact: {
        displayName: projectOwner.displayName,
        email: projectOwner.email,
      },
      bookingContact: {
        memberId: customerOwner.memberId,
        displayName: customerOwner.displayName,
        bookingUrl: customerOwner.bookingUrl,
      },
    });
    expect(db.select).toHaveBeenCalledTimes(2);
    const query = new PgDialect().sqlToQuery(db.where.mock.calls[1][0]);
    expect(query.sql).toContain('"active"');
    expect(query.params).toEqual([
      projectOwner.memberId,
      customerOwner.memberId,
      true,
    ]);
  });

  it("prefers the project owner's calendar when both active owners offer one", async () => {
    const bookableProjectOwner = {
      ...projectOwner,
      bookingUrl: "https://example.test/project-calendar",
    };
    const db = database([customerOwner, bookableProjectOwner]);
    const result = await projectResponsibleMemberService.findContacts(
      db.executor,
      "project-1",
    );
    expect(result.bookingContact).toEqual({
      memberId: projectOwner.memberId,
      displayName: projectOwner.displayName,
      bookingUrl: bookableProjectOwner.bookingUrl,
    });
    expect(db.select).toHaveBeenCalledTimes(2);
  });

  it("uses the customer owner when the active-member query excludes the project owner", async () => {
    const db = database([customerOwner]);
    const result = await projectResponsibleMemberService.findContacts(
      db.executor,
      "project-1",
    );
    expect(result.contact).toEqual({
      displayName: customerOwner.displayName,
      email: customerOwner.email,
    });
    expect(result.bookingContact?.memberId).toBe(customerOwner.memberId);
  });

  it("keeps an active email contact even when nobody offers a calendar", async () => {
    const db = database([projectOwner]);
    await expect(
      projectResponsibleMemberService.findContacts(db.executor, "project-1"),
    ).resolves.toEqual({
      contact: {
        displayName: projectOwner.displayName,
        email: projectOwner.email,
      },
      bookingContact: null,
    });
  });

  it("returns no contacts when both owners are inactive or missing", async () => {
    const db = database([]);
    await expect(
      projectResponsibleMemberService.findContacts(db.executor, "project-1"),
    ).resolves.toEqual({
      contact: null,
      bookingContact: null,
    });
    expect(db.select).toHaveBeenCalledTimes(2);
  });

  it("does not query members when the project does not exist", async () => {
    const db = database([], []);
    await expect(
      projectResponsibleMemberService.findContacts(db.executor, "missing"),
    ).resolves.toEqual({
      contact: null,
      bookingContact: null,
    });
    expect(db.select).toHaveBeenCalledOnce();
  });

  it("preserves the booking-only API used by dashboard and onboarding", async () => {
    const db = database([projectOwner, customerOwner]);
    await expect(
      projectResponsibleMemberService.findBookingContact(
        db.executor,
        "project-1",
      ),
    ).resolves.toEqual({
      memberId: customerOwner.memberId,
      displayName: customerOwner.displayName,
      bookingUrl: customerOwner.bookingUrl,
    });
    expect(db.select).toHaveBeenCalledTimes(2);
  });
});
