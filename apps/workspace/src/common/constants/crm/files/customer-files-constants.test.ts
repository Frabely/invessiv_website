import { describe, expect, it } from "vitest";
import {
  CUSTOMER_WIDE_FILES_FILTER,
  CustomerFilesQueryParam,
} from "./customer-files-query-params";

describe("customer files constants", () => {
  it("keeps URL parameters prefixed and unique", () => {
    expect(CustomerFilesQueryParam).toEqual({
      Project: "filesProject",
      Kind: "filesKind",
      Origin: "filesOrigin",
      Selected: "filesSelected",
    });
    expect(CUSTOMER_WIDE_FILES_FILTER).toBe("customer");
  });
});
