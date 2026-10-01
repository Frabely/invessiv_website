import { describe, expect, it } from "vitest";
import { AssetKind } from "../../constants/files/asset-kind";
import { UPLOAD_ACCEPT_ATTRIBUTE } from "../../constants/files/upload-accept";
import { uploadAcceptForKinds } from "./upload-accept-for-kinds";

describe("uploadAcceptForKinds", () => {
  it("offers every uploadable extension when the field accepts any kind", () => {
    expect(uploadAcceptForKinds(null)).toBe(UPLOAD_ACCEPT_ATTRIBUTE);
  });

  it("narrows the picker to the extensions of the accepted kinds", () => {
    expect(uploadAcceptForKinds([AssetKind.Font])).toBe(".otf,.ttf,.woff2");
    expect(uploadAcceptForKinds([AssetKind.Video, AssetKind.Font])).toBe(
      ".mp4,.mov,.webm,.otf,.ttf,.woff2",
    );
  });

  it("ignores links, which are never uploaded", () => {
    expect(uploadAcceptForKinds([AssetKind.Link, AssetKind.Font])).toBe(
      ".otf,.ttf,.woff2",
    );
  });
});
