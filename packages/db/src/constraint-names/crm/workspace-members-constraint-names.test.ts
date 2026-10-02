import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getTableConfig } from "drizzle-orm/pg-core";
import { expect, it, vi } from "vitest";
import { BookingUrlLimits } from "@invessiv/common/constants/auth/booking-url-limits";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { workspaceMembers } from "@invessiv/db";
import { WorkspaceMembersConstraintName as N } from "./workspace-members-constraint-names";

vi.mock("server-only", () => ({}));

const migration = readFileSync(
  resolve(
    process.cwd(),
    "migrations",
    "0050_add_workspace_member_booking_url.sql",
  ),
  "utf8",
);

it("keeps the booking link of a member aligned between model and migration", () => {
  const configuration = getTableConfig(workspaceMembers);
  expect(configuration.checks.map((check) => check.name)).toContain(
    N.BookingUrlCheck,
  );
  expect(migration).toContain(N.BookingUrlCheck);

  const column = configuration.columns.find(
    (candidate) => candidate.name === "booking_url",
  );
  expect(column).toMatchObject({ notNull: false, hasDefault: false });
  expect(migration).toMatch(/\bbooking_url\s+TEXT;/);
  // Protocol and length are the same values the schema checks before the database does.
  expect(migration).toContain(`LIKE '${BookingUrlLimits.Protocol}//%'`);
  expect(migration).toContain(
    `length(booking_url) <= ${BookingUrlLimits.MaxLength}`,
  );
});

it("admits the event of a booking link changed by someone else", () => {
  expect(migration).toContain(
    `'${SecurityEventType.WorkspaceMemberBookingUrlChanged}'`,
  );
});
