import { describe, expect, it } from "vitest";

import {
  GENERATOR_FORM_ID,
  GeneratorAnalyticsEvent,
  GeneratorErrorReason,
  PostDownloadTarget,
} from "./generator-analytics";

describe("generator analytics constants", () => {
  it("exposes the exact analytics event names", () => {
    expect(GeneratorAnalyticsEvent).toEqual({
      FormStart: "generator_form_start",
      SubmitAttempt: "generator_submit_attempt",
      Success: "generator_success",
      Error: "generator_error",
      PostDownload: "post_download",
    });
  });

  it("has no duplicate event values", () => {
    const values = Object.values(GeneratorAnalyticsEvent);
    expect(new Set(values).size).toBe(values.length);
  });

  it("exposes the form id and stable value maps", () => {
    expect(GENERATOR_FORM_ID).toBe("linkedin_post_generator");
    expect(GeneratorErrorReason).toEqual({ Network: "network" });
    expect(PostDownloadTarget).toEqual({ Image: "image", Text: "text" });
  });
});
