import { describe, expect, it } from "vitest";

import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { versionConflict } from "@/server/workspace/shared/version-conflict";

describe("versionConflict", () => {
  it("names the current version and carries the current aggregate", () => {
    const current = { id: "a", version: 4 };

    expect(versionConflict(4, current)).toEqual({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict: {
        code: ConcurrencyErrorCode.VersionConflict,
        currentVersion: 4,
        current,
      },
    });
  });
});
