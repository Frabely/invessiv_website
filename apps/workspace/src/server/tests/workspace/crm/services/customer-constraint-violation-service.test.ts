import { describe, expect, it } from "vitest";

import { CustomersConstraintName } from "@invessiv/db/constraint-names/crm/customers-constraint-names";
import { PostgresErrorCode } from "@invessiv/db/core";
import { customerConstraintViolationService } from "@/server/workspace/crm/services/customer-constraint-violation-service";

describe("customerConstraintViolationService.isDisplayNameTaken", () => {
  it("recognizes the display name index behind a wrapped driver error", () => {
    const error = new Error("insert failed", {
      cause: {
        code: PostgresErrorCode.UniqueViolation,
        constraint: CustomersConstraintName.DisplayNameLowerUnique,
      },
    });

    expect(customerConstraintViolationService.isDisplayNameTaken(error)).toBe(
      true,
    );
  });

  it("ignores other unique constraints and other failures", () => {
    expect(
      customerConstraintViolationService.isDisplayNameTaken({
        code: PostgresErrorCode.UniqueViolation,
        constraint: CustomersConstraintName.CustomerNumberUnique,
      }),
    ).toBe(false);
    expect(
      customerConstraintViolationService.isDisplayNameTaken({
        code: PostgresErrorCode.CheckViolation,
        constraint: CustomersConstraintName.DisplayNameLowerUnique,
      }),
    ).toBe(false);
    expect(
      customerConstraintViolationService.isDisplayNameTaken(new Error("boom")),
    ).toBe(false);
  });
});
