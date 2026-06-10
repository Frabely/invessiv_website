// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getLinkedInPostGeneratorContent } from "@/i18n/dictionaries/linkedin-post/generator";
import { ResultDownloadCard } from "./result-download-card";

vi.mock(
  "@/client/linkedin-post/services/linkedin-post-zip-download-service",
  () => ({
    linkedinPostZipDownloadService: {
      downloadLinkedInPostZip: vi.fn(),
    },
  }),
);

const content = getLinkedInPostGeneratorContent("de").resultDownload;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ResultDownloadCard", () => {
  it("downloads the generated image and caption zip", async () => {
    const { linkedinPostZipDownloadService } =
      await import("@/client/linkedin-post/services/linkedin-post-zip-download-service");
    const onDownload = vi.fn();

    render(
      <ResultDownloadCard
        caption="Caption"
        content={content}
        downloadFileName="post.png"
        imageDataUrl="data:image/png;base64,AAAA"
        onDownload={onDownload}
        onRequestNewPost={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: content.downloadAction }),
    );

    expect(
      linkedinPostZipDownloadService.downloadLinkedInPostZip,
    ).toHaveBeenCalledWith({
      caption: "Caption",
      downloadFileName: "post.png",
      imageDataUrl: "data:image/png;base64,AAAA",
    });
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it("disables download when no image is available", () => {
    render(
      <ResultDownloadCard
        caption="Caption"
        content={content}
        downloadFileName="post.png"
        imageDataUrl={null}
        onDownload={vi.fn()}
        onRequestNewPost={vi.fn()}
      />,
    );

    expect(
      (
        screen.getByRole("button", {
          name: content.downloadAction,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(screen.getByText(content.downloadUnavailable)).toBeTruthy();
  });

  it("offers a secondary action to generate a new post", () => {
    const onRequestNewPost = vi.fn();
    render(
      <ResultDownloadCard
        caption="Caption"
        content={content}
        downloadFileName="post.png"
        imageDataUrl="data:image/png;base64,AAAA"
        onDownload={vi.fn()}
        onRequestNewPost={onRequestNewPost}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: content.newPostAction }),
    );

    expect(onRequestNewPost).toHaveBeenCalledTimes(1);
  });
});
