// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { SITE_ROUTES } from "@/config/routes";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import { WorkflowShowcaseSection } from "./workflow-showcase-section";

vi.mock("next/image", () => ({
  default: (props: { alt?: string }) => (
    <span aria-label={props.alt} data-testid="next-image" role="img" />
  ),
}));

vi.mock(
  "@/components/marketing/linkedin-post/linkedin-post/linkedin-post",
  () => ({
    LinkedinPost: ({ caption }: { caption: ReactNode }) => (
      <article data-testid="linkedin-post">{caption}</article>
    ),
  }),
);

const baseProps = {
  badge: "Workflow",
  context: "Context",
  headline: "Custom post",
  id: "workflow",
  post: {
    authorImageAlt: "Author portrait",
    authorName: "Moritz Hecht",
    authorRole: "Web strategy",
    caption: "Read the landing page: {{link}}",
    captionLess: "Less",
    captionMore: "More",
    command: "Create a page",
    commandLabel: "Prompt",
    imageAlt: "Generated post preview",
    imageSrc: "/linkedin-post/custom-post-seo.png",
    lightboxAriaLabel: "Open post preview",
    lightboxCloseLabel: "Close preview",
    linkUrl: "invessiv.com/services/landing-page",
    maximizeLabel: "Enlarge",
  },
} as const;

describe("WorkflowShowcaseSection", () => {
  it("uses the central locale path helper for the landing page link", () => {
    render(<WorkflowShowcaseSection {...baseProps} locale="de" />);

    expect(
      screen
        .getByRole("link", { name: baseProps.post.linkUrl })
        .getAttribute("href"),
    ).toBe(createLocalePathname(SITE_ROUTES.LANDING_PAGE_SERVICE, "de"));
  });
});
