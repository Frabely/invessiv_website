import { expect, it } from "vitest";
import { DATABASE_TARGET_VALUES, DatabaseTarget } from "./database-target";

it("defines unique database targets", () => {
  expect(DatabaseTarget).toEqual({
    Development: "development",
    Preview: "preview",
    Production: "production",
  });
  expect(DATABASE_TARGET_VALUES).toEqual(Object.values(DatabaseTarget));
  expect(new Set(DATABASE_TARGET_VALUES).size).toBe(
    DATABASE_TARGET_VALUES.length,
  );
});
