import { describe, expect, it } from "vitest";

import { RolesConstraintName } from "@invessiv/db/constraint-names/auth/roles-constraint-names";
import { WorkspaceMemberRolesConstraintName } from "@invessiv/db/constraint-names/auth/workspace-member-roles-constraint-names";
import { PostgresErrorCode } from "@invessiv/db/core";
import { postgresErrorService } from "@/server/workspace/shared/services/postgres-error-service";

describe("postgresErrorService", () => {
  it("finds a wrapped violation with its constraint", () => {
    const error = new Error("insert failed", {
      cause: {
        code: PostgresErrorCode.UniqueViolation,
        constraint: RolesConstraintName.RealmNameUnique,
      },
    });

    expect(postgresErrorService.findViolation(error)).toEqual({
      code: PostgresErrorCode.UniqueViolation,
      constraint: RolesConstraintName.RealmNameUnique,
    });
    expect(
      postgresErrorService.getViolatedConstraint(
        error,
        PostgresErrorCode.UniqueViolation,
      ),
    ).toBe(RolesConstraintName.RealmNameUnique);
  });

  it("distinguishes foreign key and check violations from unique violations", () => {
    const foreignKey = {
      originalError: {
        code: PostgresErrorCode.ForeignKeyViolation,
        constraint: WorkspaceMemberRolesConstraintName.RoleForeignKey,
      },
    };
    const check = { code: PostgresErrorCode.CheckViolation };

    expect(
      postgresErrorService.isViolation(
        foreignKey,
        PostgresErrorCode.UniqueViolation,
      ),
    ).toBe(false);
    expect(
      postgresErrorService.getViolatedConstraint(
        foreignKey,
        PostgresErrorCode.ForeignKeyViolation,
      ),
    ).toBe(WorkspaceMemberRolesConstraintName.RoleForeignKey);
    expect(postgresErrorService.findViolation(check)).toEqual({
      code: PostgresErrorCode.CheckViolation,
      constraint: undefined,
    });
  });

  it("ignores other database errors, non-objects and circular causes", () => {
    const circular: { cause?: unknown } = {};
    circular.cause = circular;

    expect(
      postgresErrorService.findViolation({ code: "40001" }),
    ).toBeUndefined();
    expect(postgresErrorService.findViolation("boom")).toBeUndefined();
    expect(postgresErrorService.findViolation(circular)).toBeUndefined();
  });

  it("does not treat a known non-violation code such as a lock timeout as a violation", () => {
    expect(
      postgresErrorService.findViolation({
        code: PostgresErrorCode.LockNotAvailable,
      }),
    ).toBeUndefined();
  });
});
