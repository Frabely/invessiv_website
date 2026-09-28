import { describe, expect, it } from "vitest";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileOrigin } from "@invessiv/common/constants/files/file-origin";
import { customerFilesFilter } from "./customer-files-filter";

const PROJECT = "3f1c0c8e-7f7a-4a5e-9d55-1f4f2f6b8a10";

describe("customerFilesFilter", () => {
  it("reads known values and drops unknown or unreadable ones", () => {
    expect(
      customerFilesFilter.read(
        new URLSearchParams(
          `filesProject=${PROJECT}&filesKind=image&filesOrigin=shared`,
        ),
        [PROJECT],
      ),
    ).toEqual({
      projectId: PROJECT,
      assetKind: AssetKind.Image,
      origin: FileOrigin.Shared,
      search: "",
    });
    expect(
      customerFilesFilter.read(
        new URLSearchParams(`filesProject=${PROJECT}&filesKind=exe`),
        [],
      ),
    ).toEqual({
      projectId: undefined,
      assetKind: undefined,
      origin: undefined,
      search: "",
    });
    expect(
      customerFilesFilter.read(new URLSearchParams("filesProject=customer"), [])
        .projectId,
    ).toBeNull();
  });

  it("writes the filter without touching other params and never the search", () => {
    const params = customerFilesFilter.write(
      new URLSearchParams("customer=abc&filesKind=video"),
      { projectId: null, origin: FileOrigin.Internal, search: "Vertrag" },
    );
    expect(params.toString()).toBe(
      "customer=abc&filesProject=customer&filesOrigin=internal",
    );
  });

  it("maps the filter onto the list query", () => {
    expect(
      customerFilesFilter.toListQuery(
        { projectId: null, search: "  logo ", assetKind: AssetKind.Image },
        2,
      ),
    ).toEqual({
      page: 2,
      pageSize: 25,
      projectId: null,
      assetKind: AssetKind.Image,
      search: "logo",
    });
    expect(customerFilesFilter.toListQuery({ search: "" }, 1)).toEqual({
      page: 1,
      pageSize: 25,
    });
    expect(customerFilesFilter.isFiltered({ search: " " })).toBe(false);
    expect(
      customerFilesFilter.isFiltered({ search: "", projectId: null }),
    ).toBe(true);
  });
});
