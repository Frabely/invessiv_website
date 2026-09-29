import { describe, expect, it } from "vitest";
import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";
import { mapPagedFiles } from "./map-paged-files";

describe("mapPagedFiles", () => {
  it("maps every entry and keeps the paging", () => {
    expect(
      mapPagedFiles(
        { ok: true, value: { files: [1, 2], total: 5, page: 1, pageSize: 2 } },
        (value) => String(value),
      ),
    ).toEqual({
      ok: true,
      value: { files: ["1", "2"], total: 5, page: 1, pageSize: 2 },
    });
  });

  it("passes a failure through", () => {
    const failure = { ok: false, code: FileApiErrorCode.NotFound } as const;
    expect(mapPagedFiles(failure, (value: number) => value)).toBe(failure);
  });
});
