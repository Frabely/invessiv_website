import { describe, expect, it } from "vitest";
import { MessageErrorCode } from "@invessiv/common/constants/crm/errors/message-error-codes";
import { describeThreadNotice } from "./describe-thread-notice";

const texts = {
  loadError: "load",
  olderError: "older",
  rateLimited: "limit",
  attachmentFailed: "attachment",
};
const calm = { loadFailed: false, olderFailed: false, sendError: null };

describe("describeThreadNotice", () => {
  it("shows nothing while every request succeeded", () => {
    expect(describeThreadNotice(calm, texts)).toBeNull();
  });

  it("ranks a failed reload over the rate limit over older pages", () => {
    const everything = {
      loadFailed: true,
      olderFailed: true,
      sendError: MessageErrorCode.RateLimited,
    };
    expect(describeThreadNotice(everything, texts)).toBe("load");
    expect(
      describeThreadNotice({ ...everything, loadFailed: false }, texts),
    ).toBe("limit");
    expect(describeThreadNotice({ ...calm, olderFailed: true }, texts)).toBe(
      "older",
    );
  });

  it("ignores the rate limit where no text exists for it", () => {
    expect(
      describeThreadNotice(
        { ...calm, sendError: MessageErrorCode.RateLimited },
        { loadError: "load", olderError: "older", attachmentFailed: "a" },
      ),
    ).toBeNull();
  });

  it("explains a refused attachment above a failed older page", () => {
    for (const sendError of [
      MessageErrorCode.AttachmentUnavailable,
      MessageErrorCode.AttachmentReleaseRequired,
    ])
      expect(
        describeThreadNotice({ ...calm, olderFailed: true, sendError }, texts),
      ).toBe("attachment");
    expect(
      describeThreadNotice(
        { ...calm, sendError: MessageErrorCode.NotFound },
        texts,
      ),
    ).toBeNull();
  });
});
