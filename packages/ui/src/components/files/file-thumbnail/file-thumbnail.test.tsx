// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { UploadExtension } from "@invessiv/common/constants/files/upload-extension";
import { FileThumbnail } from "@invessiv/ui";

afterEach(cleanup);

describe("FileThumbnail", () => {
  it("shows a lazy, fixed-size, decorative preview instead of the kind icon", () => {
    const { container } = render(
      <FileThumbnail
        assetKind={AssetKind.Image}
        extension={UploadExtension.Jpg}
        thumbnailUrl="https://storage.invalid/a.thumb.webp"
      />,
    );
    const image = container.querySelector("img")!;
    expect(image).toHaveAttribute(
      "src",
      "https://storage.invalid/a.thumb.webp",
    );
    expect(image).toHaveAttribute("alt", "");
    expect(image).toHaveAttribute("loading", "lazy");
    expect(image).toHaveAttribute("decoding", "async");
    expect(image).toHaveAttribute("width");
    expect(image).toHaveAttribute("height");
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("falls back to the kind icon when the preview fails and retries a new URL", () => {
    const { container, rerender } = render(
      <FileThumbnail
        assetKind={AssetKind.Image}
        extension={UploadExtension.Png}
        thumbnailUrl="https://storage.invalid/expired"
      />,
    );
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();

    rerender(
      <FileThumbnail
        assetKind={AssetKind.Image}
        extension={UploadExtension.Png}
        thumbnailUrl="https://storage.invalid/fresh"
      />,
    );
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "https://storage.invalid/fresh",
    );
  });

  it("renders only the kind icon without a preview URL", () => {
    const { container } = render(
      <FileThumbnail
        assetKind={AssetKind.Document}
        extension={UploadExtension.Pdf}
        thumbnailUrl={null}
      />,
    );
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
