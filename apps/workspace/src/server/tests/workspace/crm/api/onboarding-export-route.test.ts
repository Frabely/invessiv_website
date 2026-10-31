import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { strFromU8, unzipSync } from "fflate";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import { ARCHIVE_TIME_BUDGET_MS } from "@/common/constants/files/file-archive-limits";
import { FileArchiveEntryStatus } from "@/common/constants/files/file-archive-entry-status";
import type { ArchiveEntryOutcome } from "@/server/shared/files/file-object-service-types";
import { storageService } from "@/server/shared/files/storage-service";
import { GET } from "@/app/api/workspace/crm/onboarding/forms/[formId]/export/route";
import {
  authorizedWorkspaceRequest,
  unauthenticatedWorkspaceRequest,
} from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const ID = "0b000000-0000-4000-8000-000000000001";
const URL_BASE = `http://localhost/api/workspace/crm/onboarding/forms/${ID}/export`;

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  exportOnboardingForm: vi.fn(),
}));

vi.mock("@/lib/auth/workspace-authentication", () => ({
  authenticateWorkspaceRequest: mocks.authenticate,
}));
vi.mock(
  "@/server/workspace/crm/query-handler/export-onboarding-form.query-handler",
  () => ({ exportOnboardingForm: mocks.exportOnboardingForm }),
);

const context = { params: Promise.resolve({ formId: ID }) };

function call(query = "") {
  return GET(
    new NextRequest(`${URL_BASE}${query}`, { method: HttpMethod.Get }),
    context,
  );
}

describe("GET onboarding form export", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.authenticate.mockResolvedValue(
      authorizedWorkspaceRequest([Permission.ProjectsRead]),
    );
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it("counts preparation time toward the deadline and still exports the answers", async () => {
    const startedAt = Date.now();
    const clock = vi.spyOn(Date, "now").mockReturnValue(startedAt);
    const openReadStream = vi.fn();
    vi.spyOn(storageService, "getAdapter").mockReturnValue({
      openReadStream,
    } as never);
    mocks.exportOnboardingForm.mockImplementation(async () => {
      clock.mockReturnValue(startedAt + ARCHIVE_TIME_BUDGET_MS);
      return {
        filename: "onboarding.zip",
        entries: [{ displayName: "logo.png", storageKey: "logo", url: null }],
        manifest: {
          name: "onboarding.json",
          build: (outcomes: readonly ArchiveEntryOutcome[]) =>
            JSON.stringify({ answers: ["preserved"], outcomes }),
        },
        texts: [{ name: "README.md", content: "# Guide" }],
      };
    });

    const response = await call();
    const archive = unzipSync(new Uint8Array(await response.arrayBuffer()));
    expect(JSON.parse(strFromU8(archive["onboarding.json"]!))).toEqual({
      answers: ["preserved"],
      outcomes: [{ path: "logo.png", status: FileArchiveEntryStatus.Timeout }],
    });
    expect(strFromU8(archive["README.md"]!)).toBe("# Guide");
    expect(openReadStream).not.toHaveBeenCalled();
  });

  it("streams a private zip with the manifest and resolves labels in the requested locale", async () => {
    mocks.exportOnboardingForm.mockResolvedValue({
      filename: "onboarding-Relaunch-2026-10-31.zip",
      entries: [],
      manifest: { name: "onboarding.json", build: () => '{"blocks":[]}' },
      texts: [{ name: "README.md", content: "# Onboarding export" }],
    });

    const response = await call("?locale=en");

    expect(response.status).toBe(HttpResponseCode.Ok);
    expect(response.headers.get(HttpHeaderName.ContentType)).toBe(
      MediaType.Zip,
    );
    expect(response.headers.get(HttpHeaderName.ContentDisposition)).toContain(
      "onboarding-Relaunch-2026-10-31.zip",
    );
    expect(response.headers.get(HttpHeaderName.XContentTypeOptions)).toBe(
      "nosniff",
    );
    expect(mocks.exportOnboardingForm).toHaveBeenCalledWith(
      ID,
      expect.anything(),
      "en",
    );
    const archive = unzipSync(new Uint8Array(await response.arrayBuffer()));
    expect(strFromU8(archive["onboarding.json"]!)).toBe('{"blocks":[]}');
    expect(strFromU8(archive["README.md"]!)).toBe("# Onboarding export");
  });

  it("falls back to the default locale for an unknown one", async () => {
    mocks.exportOnboardingForm.mockResolvedValue(null);
    await call("?locale=xx");
    expect(mocks.exportOnboardingForm).toHaveBeenCalledWith(
      ID,
      expect.anything(),
      "de",
    );
  });

  it("answers 404 for a form out of reach", async () => {
    mocks.exportOnboardingForm.mockResolvedValue(null);
    const response = await call();
    expect(response.status).toBe(HttpResponseCode.NotFound);
    expect(await response.json()).toMatchObject({
      error: OnboardingErrorCode.FormNotFound,
    });
  });

  it("answers 401 without a session and 403 without projects.read", async () => {
    mocks.authenticate.mockResolvedValue(unauthenticatedWorkspaceRequest());
    expect((await call()).status).toBe(HttpResponseCode.Unauthorized);

    mocks.authenticate.mockResolvedValue(
      authorizedWorkspaceRequest([Permission.QuestionnaireTemplatesWrite]),
    );
    expect((await call()).status).toBe(HttpResponseCode.Forbidden);
    expect(mocks.exportOnboardingForm).not.toHaveBeenCalled();
  });
});
