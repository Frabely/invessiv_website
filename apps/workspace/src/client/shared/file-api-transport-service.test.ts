// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";
import { fileApiTransportService } from "./file-api-transport-service";

afterEach(() => vi.unstubAllGlobals());

describe("fileApiTransportService.downloadArchive", () => {
  it("preflights an archive and returns a native download URL without reading its body", async () => {
    const fileId = "22222222-2222-4222-8222-222222222222";
    const response = { ok: true, blob: vi.fn() };
    const fetch = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetch);

    expect(
      await fileApiTransportService.downloadArchive("/api/files/archive", [
        fileId,
      ]),
    ).toEqual({
      ok: true,
      value: `/api/files/archive?fileId=${fileId}`,
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/files/archive?preflight=true",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ fileIds: [fileId] }),
      }),
    );
    expect(response.blob).not.toHaveBeenCalled();
  });

  it("keeps a preflight error in the UI instead of starting a download", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ code: FileApiErrorCode.ArchiveLimit }),
      }),
    );
    expect(
      await fileApiTransportService.downloadArchive("/api/files/archive", []),
    ).toEqual({ ok: false, code: FileApiErrorCode.ArchiveLimit });
  });
});
