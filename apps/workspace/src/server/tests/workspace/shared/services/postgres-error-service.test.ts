import { describe, expect, it } from "vitest";

import { PostgresErrorCode } from "@invessiv/db/core";
import { postgresErrorService } from "@/server/workspace/shared/services/postgres-error-service";

describe("postgresErrorService", () => {
  it("finds a wrapped violation with its constraint", () => {
    const error = new Error("insert failed", {
      cause: {
        code: PostgresErrorCode.UniqueViolation,
        constraint: "roles_realm_name_uidx",
      },
    });

    expect(postgresErrorService.findViolation(error)).toEqual({
      code: PostgresErrorCode.UniqueViolation,
      constraint: "roles_realm_name_uidx",
    });
    expect(
      postgresErrorService.getViolatedConstraint(
        error,
        PostgresErrorCode.UniqueViolation,
      ),
    ).toBe("roles_realm_name_uidx");
  });

  it("distinguishes foreign key and check violations from unique violations", () => {
    const foreignKey = {
      originalError: {
        code: PostgresErrorCode.ForeignKeyViolation,
        constraint: "workspace_member_roles_role_fkey",
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
    ).toBe("workspace_member_roles_role_fkey");
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
});
