// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getPortalFeedbackDictionary } from "@/i18n/dictionaries/portal";
import { FeedbackQuotaNotice } from "./feedback-quota-notice";

const content = getPortalFeedbackDictionary("de").states.exhausted;
const CHAT = "/de/portal/customer-1?chat=open";
const REQUEST =
  "/de/portal/customer-1?widget=serviceRequest&project=project-1&service=service-round";

describe("FeedbackQuotaNotice", () => {
  afterEach(cleanup);

  it("offers the further round when it can be requested for this project", () => {
    render(
      <FeedbackQuotaNotice
        content={content}
        messagesHref={CHAT}
        requestHref={REQUEST}
      />,
    );

    expect(
      screen.getByRole("link", { name: content.requestLink }),
    ).toHaveAttribute("href", REQUEST);
    expect(screen.getByText(content.requestDescription)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: content.chatLink })).toBeNull();
  });

  it("keeps the chat link without a requestable round", () => {
    render(<FeedbackQuotaNotice content={content} messagesHref={CHAT} />);

    expect(
      screen.getByRole("link", { name: content.chatLink }),
    ).toHaveAttribute("href", CHAT);
    expect(screen.getByText(content.description)).toBeInTheDocument();
  });

  it("only explains without chat access and without a requestable round", () => {
    render(<FeedbackQuotaNotice content={content} messagesHref={null} />);

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText(content.title)).toBeInTheDocument();
  });
});
