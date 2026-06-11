// @vitest-environment jsdom

import { LINKEDIN_POST_IMAGE_DATA_URL_PREFIX } from "@/common/constants";
import { strFromU8, unzipSync } from "fflate";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createLinkedInPostZipArchive,
  downloadLinkedInPostZip,
} from "./linkedin-post-zip-download-service";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createLinkedInPostZipArchive", () => {
  it("creates a zip with post.png and post.txt using the resource basename", () => {
    const archive = createLinkedInPostZipArchive({
      caption: "Caption\n\n#LinkedIn",
      downloadFileName: "post.png",
      imageDataUrl: `${LINKEDIN_POST_IMAGE_DATA_URL_PREFIX}${btoa("png-bytes")}`,
    });

    const files = unzipSync(archive);
    expect(Object.keys(files).sort()).toEqual(["post.png", "post.txt"]);
    expect(strFromU8(files["post.png"])).toBe("png-bytes");
    expect(strFromU8(files["post.txt"])).toBe("Caption\n\n#LinkedIn\n");
  });

  it("rejects non-png data urls", () => {
    expect(() =>
      createLinkedInPostZipArchive({
        caption: "Caption",
        downloadFileName: "post.png",
        imageDataUrl: "data:text/plain;base64,AAAA",
      }),
    ).toThrow("linkedin_post_zip_invalid_image_data_url");
  });
});

describe("downloadLinkedInPostZip", () => {
  it("downloads the generated archive as post.zip", () => {
    const anchor = document.createElement("a");
    const click = vi.spyOn(anchor, "click").mockImplementation(() => undefined);
    vi.spyOn(document, "createElement").mockReturnValue(anchor);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:post");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

    downloadLinkedInPostZip({
      caption: "Caption",
      downloadFileName: "post.png",
      imageDataUrl: `${LINKEDIN_POST_IMAGE_DATA_URL_PREFIX}${btoa("png-bytes")}`,
    });

    expect(anchor.download).toBe("post.zip");
    expect(click).toHaveBeenCalledTimes(1);
  });
});
