import { describe, expect, it } from "vitest";

import {
  AUTH_CONSTRAINT_NAME_VALUES,
  AuthConstraintName,
} from "./auth-constraint-names";

describe("AUTH_CONSTRAINT_NAME_VALUES", () => {
  it("contains exactly the values of the const object without duplicates", () => {
    expect([...AUTH_CONSTRAINT_NAME_VALUES]).toEqual(
      Object.values(AuthConstraintName),
    );
    expect(new Set(AUTH_CONSTRAINT_NAME_VALUES).size).toBe(
      AUTH_CONSTRAINT_NAME_VALUES.length,
    );
  });
});
