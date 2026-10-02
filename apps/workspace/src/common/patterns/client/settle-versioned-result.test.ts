import { describe, expect, it } from "vitest";

import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { VersionedMutationOutcomeKind } from "@/common/constants/client/versioned-mutation-outcome-kinds";
import { settleVersionedResult } from "./settle-versioned-result";

describe("settleVersionedResult", () => {
  it("passes the written value on", () => {
    expect(settleVersionedResult({ ok: true, value: { version: 2 } })).toEqual({
      kind: VersionedMutationOutcomeKind.Saved,
      value: { version: 2 },
    });
  });

  it("hands over the current state of a stale write", () => {
    expect(
      settleVersionedResult({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        current: { version: 5 },
      }),
    ).toEqual({
      kind: VersionedMutationOutcomeKind.Conflict,
      current: { version: 5 },
    });
  });

  it("keeps the code of any other rejection", () => {
    expect(
      settleVersionedResult<{ version: number }, "NOT_EDITABLE">({
        ok: false,
        code: "NOT_EDITABLE",
      }),
    ).toEqual({
      kind: VersionedMutationOutcomeKind.Failure,
      code: "NOT_EDITABLE",
    });
  });
});
