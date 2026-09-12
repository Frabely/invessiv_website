/**
 * Origin page of a lead submission. Orthogonal to `channel` (= what was submitted):
 * marks which surface the lead came from. That keeps, for example, project requests
 * from the LinkedIn post page distinguishable from those on the home page without
 * overloading the channel. Default for existing flows is `Website`.
 */
export const ContactSubmissionOrigin = {
  Website: "website",
  LandingPage: "landing_page",
  LinkedInPost: "linkedin_post",
} as const;

export type ContactSubmissionOrigin =
  (typeof ContactSubmissionOrigin)[keyof typeof ContactSubmissionOrigin];

export const CONTACT_SUBMISSION_ORIGIN_VALUES = [
  ContactSubmissionOrigin.Website,
  ContactSubmissionOrigin.LandingPage,
  ContactSubmissionOrigin.LinkedInPost,
] as const;
