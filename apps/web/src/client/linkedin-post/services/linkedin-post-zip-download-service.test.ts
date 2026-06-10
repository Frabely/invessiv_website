// @vitest-environment jsdom

import { LINKEDIN_POST_IMAGE_DATA_URL_PREFIX } from "@/common/constants";
import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { createLinkedInPostZipArchive } from "./linkedin-post-zip-download-service";

describe("createLinkedInPostZipArchive", () => {
  it("creates a zip with png and caption text using the download basename", () => {
    const archive = createLinkedInPostZipArchive({
      caption: "Caption\n\n#LinkedIn",
      downloadFileName: "pricing-post.png",
      imageDataUrl: `${LINKEDIN_POST_IMAGE_DATA_URL_PREFIX}${btoa("png-bytes")}`,
    });

    const files = unzipSync(archive);
    expect(Object.keys(files).sort()).toEqual([
      "pricing-post.png",
      "pricing-post.txt",
    ]);
    expect(strFromU8(files["pricing-post.png"])).toBe("png-bytes");
    expect(strFromU8(files["pricing-post.txt"])).toBe("Caption\n\n#LinkedIn\n");
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
