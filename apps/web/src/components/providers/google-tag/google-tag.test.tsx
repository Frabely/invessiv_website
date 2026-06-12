// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GoogleTag } from "./google-tag";

let mockPathname = "/de/services/landing-page";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

vi.mock("next/script", () => ({
  default: ({
    id,
    src,
    dangerouslySetInnerHTML,
  }: {
    id?: string;
    src?: string;
    dangerouslySetInnerHTML?: { __html: string };
  }) => (
    <script
      data-testid={id}
      data-src={src}
      dangerouslySetInnerHTML={dangerouslySetInnerHTML}
    />
  ),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  delete window.gtag;
  mockPathname = "/de/services/landing-page";
});

describe("GoogleTag", () => {
  describe("without configured env vars", () => {
    beforeEach(() => {
      window.gtag = vi.fn();
    });

    it("renders nothing and never sends a page_view", () => {
      const { container } = render(<GoogleTag />);
      expect(container.querySelector("script")).toBeNull();
      expect(window.gtag).not.toHaveBeenCalled();
    });
  });

  describe("with GA4 and ads ids configured", () => {
    beforeEach(() => {
      vi.stubEnv("NEXT_PUBLIC_GA4_MEASUREMENT_ID", "G-5T4BC28Z0F");
      vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID", "AW-123456789");
      window.gtag = vi.fn();
    });

    it("renders the bootstrap and loader scripts", () => {
      const { getByTestId } = render(<GoogleTag />);
      expect(
        getByTestId("invessiv-google-consent-bootstrap").innerHTML,
      ).toContain("gtag('consent', 'default'");
      expect(getByTestId("invessiv-google-tag-loader").dataset.src).toBe(
        "https://www.googletagmanager.com/gtag/js?id=G-5T4BC28Z0F",
      );
    });

    it("sends a GA4 page_view on mount", () => {
      render(<GoogleTag />);
      expect(window.gtag).toHaveBeenCalledWith(
        "event",
        "page_view",
        expect.objectContaining({
          send_to: "G-5T4BC28Z0F",
          page_path: "/de/services/landing-page",
        }),
      );
    });

    it("sends another page_view when the pathname changes", () => {
      const { rerender } = render(<GoogleTag />);
      expect(window.gtag).toHaveBeenCalledTimes(1);

      mockPathname = "/de/services/landing-page/success";
      rerender(<GoogleTag />);

      expect(window.gtag).toHaveBeenCalledTimes(2);
      expect(window.gtag).toHaveBeenLastCalledWith(
        "event",
        "page_view",
        expect.objectContaining({
          page_path: "/de/services/landing-page/success",
        }),
      );
    });
  });

  describe("with only the ads id configured", () => {
    beforeEach(() => {
      vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID", "AW-123456789");
      window.gtag = vi.fn();
    });

    it("loads via the ads id and does not send a GA4 page_view", () => {
      const { getByTestId } = render(<GoogleTag />);
      expect(getByTestId("invessiv-google-tag-loader").dataset.src).toBe(
        "https://www.googletagmanager.com/gtag/js?id=AW-123456789",
      );
      expect(window.gtag).not.toHaveBeenCalled();
    });
  });
});
