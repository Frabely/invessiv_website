import { afterEach, describe, expect, it, vi } from "vitest";

const mockTrack = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@vercel/analytics/server", () => ({
  track: (...args: unknown[]) => mockTrack(...args),
}));

const { serverAnalyticsService } = await import("./server-analytics-service");

describe("serverAnalyticsService.sendLeadCreated", () => {
  afterEach(() => {
    mockTrack.mockReset();
    vi.restoreAllMocks();
  });

  it("sends lead_created with form and origin", async () => {
    mockTrack.mockResolvedValue(undefined);

    await serverAnalyticsService.sendLeadCreated({
      form: "discovery_call",
      origin: "landing_page",
    });

    expect(mockTrack).toHaveBeenCalledWith(
      "lead_created",
      { form: "discovery_call", origin: "landing_page" },
      undefined,
    );
  });

  it("forwards only visitor headers and a sanitized referer, never cookies", async () => {
    mockTrack.mockResolvedValue(undefined);

    await serverAnalyticsService.sendLeadCreated(
      { form: "quick_contact", origin: "website" },
      new Headers({
        cookie: "theme=dark",
        referer:
          "https://invessiv.com/de?utm_source=linkedin&ref=newsletter#contact",
        "user-agent": "Mozilla/5.0",
        "x-forwarded-for": "203.0.113.7",
      }),
    );

    expect(mockTrack).toHaveBeenCalledWith(
      "lead_created",
      { form: "quick_contact", origin: "website" },
      {
        headers: {
          referer: "https://invessiv.com/de?utm_source=linkedin",
          "user-agent": "Mozilla/5.0",
          "x-forwarded-for": "203.0.113.7",
        },
      },
    );
  });

  it("drops a referer that carries sensitive query keys", async () => {
    mockTrack.mockResolvedValue(undefined);

    await serverAnalyticsService.sendLeadCreated(
      { form: "quick_contact", origin: "website" },
      new Headers({ referer: "https://invessiv.com/de?email=max@example.com" }),
    );

    expect(mockTrack).toHaveBeenCalledWith(
      "lead_created",
      { form: "quick_contact", origin: "website" },
      { headers: {} },
    );
  });

  it("swallows tracking failures so the lead flow is never affected", async () => {
    mockTrack.mockRejectedValue(new Error("intake down"));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(
      serverAnalyticsService.sendLeadCreated({
        form: "quick_contact",
        origin: "website",
      }),
    ).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalled();
  });
});
