/**
 * Analytics constants for the LinkedIn-post generator. The dispatch mechanism
 * stays `window.dispatchEvent(new CustomEvent(...))`; these constants just
 * remove the magic strings from the component.
 */

export const GeneratorAnalyticsEvent = {
  FormStart: "generator_form_start",
  SubmitAttempt: "generator_submit_attempt",
  Success: "generator_success",
  Error: "generator_error",
  PostDownload: "post_download",
} as const;

export type GeneratorAnalyticsEvent =
  (typeof GeneratorAnalyticsEvent)[keyof typeof GeneratorAnalyticsEvent];

/** `form_id` payload value shared by every generator analytics event. */
export const GENERATOR_FORM_ID = "linkedin_post_generator";

export const GeneratorErrorReason = {
  Network: "network",
} as const;

export type GeneratorErrorReason =
  (typeof GeneratorErrorReason)[keyof typeof GeneratorErrorReason];

export const PostDownloadTarget = {
  Image: "image",
  Text: "text",
} as const;

export type PostDownloadTarget =
  (typeof PostDownloadTarget)[keyof typeof PostDownloadTarget];
