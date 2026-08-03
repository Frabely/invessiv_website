import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileBridgeErrorCode } from "@invessiv/common/constants/leads/outreach/profile-bridge-error-codes";
import {
  captureInstagramProfile,
  extractInstagramHandle,
} from "./instagram-client";

vi.mock("./rate-limiter", () => ({
  throttle: vi.fn().mockResolvedValue(undefined),
}));

const fetchMock = vi.fn();

function response(status: number, payload: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

function validPayload(): unknown {
  return {
    data: {
      user: {
        username: "kanzlei",
        full_name: "Kanzlei Beispiel",
        biography: "Digitale Steuerberatung für Handwerksbetriebe.",
        is_private: false,
        is_verified: false,
        edge_owner_to_timeline_media: { edges: [] },
      },
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
});

describe("extractInstagramHandle", () => {
  it("prefers and normalizes the explicit handle", () => {
    expect(
      extractInstagramHandle(
        " @kanzlei ",
        "https://www.instagram.com/anderes/",
      ),
    ).toBe("kanzlei");
  });

  it("extracts the handle from a profile URL", () => {
    expect(
      extractInstagramHandle(null, "https://www.instagram.com/kanzlei/"),
    ).toBe("kanzlei");
  });
});

describe("captureInstagramProfile", () => {
  it("returns a normalized snapshot for a valid response", async () => {
    fetchMock.mockResolvedValue(response(200, validPayload()));

    const result = await captureInstagramProfile("kanzlei", null);

    expect(result).toMatchObject({
      ok: true,
      snapshot: {
        handle: "kanzlei",
        biography: "Digitale Steuerberatung für Handwerksbetriebe.",
      },
    });
  });

  it("distinguishes network failures", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(captureInstagramProfile("kanzlei", null)).resolves.toEqual({
      ok: false,
      code: ProfileBridgeErrorCode.NetworkError,
    });
  });

  it("distinguishes upstream outages", async () => {
    fetchMock.mockResolvedValue(response(503, null));

    await expect(captureInstagramProfile("kanzlei", null)).resolves.toEqual({
      ok: false,
      code: ProfileBridgeErrorCode.UpstreamUnavailable,
    });
  });

  it("distinguishes unexpected response statuses", async () => {
    fetchMock.mockResolvedValue(response(418, null));

    await expect(captureInstagramProfile("kanzlei", null)).resolves.toEqual({
      ok: false,
      code: ProfileBridgeErrorCode.InvalidResponse,
    });
  });

  it("distinguishes invalid JSON", async () => {
    const invalidJsonResponse = response(200, null);
    vi.mocked(invalidJsonResponse.json).mockRejectedValue(new SyntaxError());
    fetchMock.mockResolvedValue(invalidJsonResponse);

    await expect(captureInstagramProfile("kanzlei", null)).resolves.toEqual({
      ok: false,
      code: ProfileBridgeErrorCode.InvalidResponse,
    });
  });
});
