// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WebApiEndpoint } from "@/common/constants";
import { GENERATOR_COLOR_PAIRS } from "@/common/constants/generator/generator-color-pairs";
import { getLinkedInPostGeneratorContent } from "@/i18n/dictionaries/linkedin-post/generator";
import type {
  LinkedInPostGeneratorResult,
  linkedinPostGeneratorService,
} from "@/client/linkedin-post/services/linkedin-post-generator-service";
import { GeneratorSection } from "./generator-section";

type SubmitGenerator = typeof linkedinPostGeneratorService.submitLinkedInPost;

const content = getLinkedInPostGeneratorContent("de");

const VALID_INPUTS = {
  topic: "Wie ich Kunden von 999 € auf 4.999 € bringe",
  expertise: "Strategieberatung",
} as const;

const GENERATED_POST = {
  bodyVariant: "insight" as const,
  bullets: null,
  authorName: "Moritz Hecht",
  colorPair: {
    accent: "#5BA3D9",
    id: "navy-steel",
    index: 0,
    primary: "#0F1B2D",
    secondary: "#1A3355",
    text: "#E8F1FA",
  },
  expertiseDisplay: "Strategieberatung",
  kicker: "Preisstrategie",
  headlineHtml: "Preise brauchen <em>Kontext</em>",
  headlinePlain: "Preise brauchen Kontext",
  highlight: null,
  insight: "Ein klares Angebot nimmt dem Gespräch den Druck.",
  template: {
    bodyVariant: "insight" as const,
    id: "editorial-center",
    index: 0,
  },
};

const PREVIEW_HTML = "<!doctype html><html><body>preview</body></html>";

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function renderSection(submitMock?: SubmitGenerator) {
  const submit: SubmitGenerator =
    submitMock ??
    (async () => ({
      ok: true,
      caption: "Generierte Caption.",
      downloadFileName: "generierte-caption.png",
      imageDataUrl: "data:image/png;base64,AAAA",
      post: GENERATED_POST,
      previewHtml: PREVIEW_HTML,
    }));
  const { container } = render(
    <GeneratorSection
      content={content}
      id="generator"
      locale="de"
      submitGenerator={submit}
    />,
  );
  return { submit, container };
}

function clickSubmit() {
  fireEvent.click(screen.getByRole("button", { name: content.form.submit }));
}

function fillValidValues() {
  fireEvent.change(
    screen.getByLabelText(content.form.topic.label, { selector: "textarea" }),
    { target: { value: VALID_INPUTS.topic } },
  );
  fireEvent.change(screen.getByLabelText(content.form.expertise.label), {
    target: { value: VALID_INPUTS.expertise },
  });
  fireEvent.click(screen.getByLabelText(content.form.tone.label));
  fireEvent.click(
    screen.getByRole("option", {
      name: new RegExp(content.form.tone.options[0].label),
    }),
  );
}

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
  mockMatchMedia(false);
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  // PostFramePreview uses ResizeObserver, which jsdom does not implement.
  window.ResizeObserver = class {
    observe() {}

    unobserve() {}

    disconnect() {}
  };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("GeneratorSection", () => {
  it("renders only the form and no preview in the initial state", () => {
    const { container } = renderSection();
    expect(
      container.querySelector(
        '[data-state="loading"], [data-state="success"], [data-state="error"], [data-state="limit-reached"]',
      ),
    ).toBeNull();
    expect(container.querySelector('[data-layout="initial"]')).toBeTruthy();
  });

  it("shows the idle usage hint before the first run", () => {
    renderSection();
    expect(screen.getByText(content.usageMeter.idle)).toBeTruthy();
  });

  it("shows required errors for the creative fields only", async () => {
    const submit = vi.fn() as unknown as SubmitGenerator;
    renderSection(submit);
    clickSubmit();

    await waitFor(() => {
      expect(screen.getByText(content.form.topic.requiredError)).toBeTruthy();
    });
    expect(screen.getByText(content.form.expertise.requiredError)).toBeTruthy();
    expect(submit).not.toHaveBeenCalled();
  });

  it("does not render any identity field in the generation step", () => {
    renderSection();
    expect(screen.queryByLabelText(content.leadCapture.email.label)).toBeNull();
    expect(
      screen.queryByRole("checkbox", {
        name: content.leadCapture.consentDelivery.label,
      }),
    ).toBeNull();
  });

  it("selects a tone with the custom select", () => {
    renderSection();
    fireEvent.click(screen.getByLabelText(content.form.tone.label));
    fireEvent.click(
      screen.getByRole("option", {
        name: new RegExp(content.form.tone.options[2].label),
      }),
    );
    expect(
      screen.getByLabelText(content.form.tone.label).textContent,
    ).toContain(content.form.tone.options[2].label);
  });

  it("selects a predefined background color pair with the custom select", () => {
    renderSection();
    const firstPair = GENERATOR_COLOR_PAIRS[0];
    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(content.form.color.autoLabel),
      }),
    );
    fireEvent.click(
      screen.getByRole("option", {
        name: `${content.form.color.swatchLabel} ${firstPair.name}`,
      }),
    );
    expect(
      screen.getByRole("button", { name: new RegExp(firstPair.name) }),
    ).toBeTruthy();
  });

  it("transitions through loading and shows the gated lead step on success", async () => {
    let resolveSubmit:
      | ((value: LinkedInPostGeneratorResult) => void)
      | undefined;
    const submit = vi.fn<SubmitGenerator>(
      () =>
        new Promise<LinkedInPostGeneratorResult>((resolve) => {
          resolveSubmit = resolve;
        }),
    );

    renderSection(submit);
    fillValidValues();
    clickSubmit();

    // Loading is now visualised in-generator (the right preview falls away):
    // the form is replaced by the compact generating panel, so there is no
    // submit button while a post is being built.
    await waitFor(() => {
      expect(screen.getByText(content.preview.loading.headline)).toBeTruthy();
    });
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText(content.preview.loading.body)).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: content.form.submit }),
    ).toBeNull();

    resolveSubmit!({
      ok: true,
      caption: "Erfolgs-Caption.",
      downloadFileName: "erfolgs-caption.png",
      imageDataUrl: "data:image/png;base64,AAAA",
      post: GENERATED_POST,
      previewHtml: PREVIEW_HTML,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: content.preview.success.copyCaption,
        }),
      ).toBeTruthy();
    });
    // The lead-capture step appears only after success.
    expect(screen.getByText(content.leadCapture.headline)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: content.leadCapture.emailAction }),
    ).toBeTruthy();
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("renders the generated post and action rail in the success state", async () => {
    const { container } = renderSection();
    fillValidValues();
    clickSubmit();

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: content.preview.success.copyCaption,
        }),
      ).toBeTruthy();
    });

    const postPane = container.querySelector('[data-slot="success-post"]');
    const actionRail = container.querySelector('[data-slot="success-actions"]');

    expect(postPane).toBeTruthy();
    expect(actionRail).toBeTruthy();
    expect(postPane?.textContent).toContain("Generierte Caption.");
    expect(actionRail?.textContent).toContain(content.leadCapture.headline);
    expect(actionRail?.textContent).toContain(
      content.preview.success.followUp.headline,
    );
    expect(
      postPane?.querySelector(
        '[data-caption-fit="line-clamp"][data-caption-clamp="result"]',
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: content.preview.success.captionMore }),
    ).toBeTruthy();
  });

  it("scrolls the generated post to the top on mobile success", async () => {
    mockMatchMedia(true);
    renderSection();
    fillValidValues();
    clickSubmit();

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: content.preview.success.copyCaption,
        }),
      ).toBeTruthy();
    });

    await waitFor(() => {
      expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      });
    });
  });

  it("returns to the generator form when the new-post action is used", async () => {
    renderSection();
    fillValidValues();
    clickSubmit();

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: content.preview.success.copyCaption,
        }),
      ).toBeTruthy();
    });

    fireEvent.click(
      screen.getByRole("button", { name: content.leadCapture.newPostAction }),
    );

    // The success preview is replaced by the form again.
    expect(
      screen.queryByRole("button", {
        name: content.preview.success.copyCaption,
      }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: content.form.submit }),
    ).toBeTruthy();
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });

  it("threads the delivery token from the success result into the deliver request", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const submit: SubmitGenerator = async () => ({
      ok: true,
      caption: "Erfolgs-Caption.",
      deliveryToken: "signed-token-123",
      downloadFileName: "erfolgs-caption.png",
      imageDataUrl: "data:image/png;base64,AAAA",
      post: GENERATED_POST,
      previewHtml: PREVIEW_HTML,
    });

    renderSection(submit);
    fillValidValues();
    clickSubmit();

    await waitFor(() => {
      expect(screen.getByText(content.leadCapture.headline)).toBeTruthy();
    });

    fireEvent.change(
      screen.getByLabelText(content.leadCapture.displayName.label),
      { target: { value: "Moritz Hecht" } },
    );
    fireEvent.change(screen.getByLabelText(content.leadCapture.email.label), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: content.leadCapture.consentDelivery.label,
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.leadCapture.emailAction }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(WebApiEndpoint.LinkedInPostDeliver);
    const body = JSON.parse(String(init.body)) as { deliveryToken: string };
    expect(body.deliveryToken).toBe("signed-token-123");

    vi.unstubAllGlobals();
  });

  it("shows the remaining usage in the meter after returning to the generator", async () => {
    const submit = vi.fn<SubmitGenerator>(async () => ({
      ok: true,
      caption: "Kurz-Caption.",
      downloadFileName: "kurz-caption.png",
      imageDataUrl: null,
      post: GENERATED_POST,
      previewHtml: PREVIEW_HTML,
      usageLimit: {
        limit: 2,
        remaining: 1,
        resetAt: "2026-07-01T00:00:00.000Z",
      },
    }));

    renderSection(submit);
    fillValidValues();
    clickSubmit();

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: content.preview.success.copyCaption,
        }),
      ).toBeTruthy();
    });

    // The meter lives in the form, which is hidden during success — it returns
    // (with the consumed test reflected) after "Neuen Post generieren".
    fireEvent.click(
      screen.getByRole("button", { name: content.leadCapture.newPostAction }),
    );

    expect(screen.getByText("Noch 1 von 2 Tests")).toBeTruthy();
  });

  it("keeps submit enabled at the local limit and opens the limit preview", async () => {
    const submit = vi.fn<SubmitGenerator>(async () => ({
      ok: true,
      caption: "Letzte Caption.",
      downloadFileName: "letzte-caption.png",
      imageDataUrl: null,
      post: GENERATED_POST,
      previewHtml: PREVIEW_HTML,
      usageLimit: {
        limit: 2,
        remaining: 0,
        resetAt: "2026-07-01T00:00:00.000Z",
      },
    }));

    renderSection(submit);
    fillValidValues();
    clickSubmit();

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: content.preview.success.copyCaption,
        }),
      ).toBeTruthy();
    });

    fireEvent.click(
      screen.getByRole("button", { name: content.leadCapture.newPostAction }),
    );

    const submitButton = screen.getByRole("button", {
      name: content.form.submit,
    }) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(false);

    clickSubmit();

    await waitFor(() => {
      expect(
        screen.getByText(content.preview.limitReached.headline),
      ).toBeTruthy();
    });
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("renders the conversion-oriented limit preview on a 429, not an error", async () => {
    const submit: SubmitGenerator = async () => ({
      ok: false as const,
      code: "usage_limit_reached",
      usageLimit: {
        limit: 2,
        remaining: 0,
        resetAt: "2026-07-01T00:00:00.000Z",
      },
    });

    const { container } = renderSection(submit);
    fillValidValues();
    clickSubmit();

    await waitFor(() => {
      expect(
        screen.getByText(content.preview.limitReached.headline),
      ).toBeTruthy();
    });
    expect(
      screen.getByRole("link", {
        name: content.preview.limitReached.ctaAriaLabel,
      }),
    ).toBeTruthy();
    // It must not reuse the error alert styling.
    expect(container.querySelector('[data-state="error"]')).toBeNull();
  });

  it("hides the form once no free tests remain", async () => {
    const submit: SubmitGenerator = async () => ({
      ok: false as const,
      code: "usage_limit_reached",
      usageLimit: {
        limit: 2,
        remaining: 0,
        resetAt: "2026-07-01T00:00:00.000Z",
      },
    });

    renderSection(submit);
    fillValidValues();
    clickSubmit();

    await waitFor(() => {
      expect(
        screen.getByText(content.preview.limitReached.headline),
      ).toBeTruthy();
    });
    // The generator form (and its submit button) is removed entirely — there is
    // nothing left to generate, only the conversion-oriented limit panel.
    expect(
      screen.queryByRole("button", { name: content.form.submit }),
    ).toBeNull();
  });

  it("renders the error state when submit returns ok:false", async () => {
    const submit: SubmitGenerator = async () => ({
      ok: false as const,
      code: "INTERNAL",
    });
    renderSection(submit);
    fillValidValues();
    clickSubmit();

    await waitFor(() => {
      expect(screen.getByText(content.preview.error.headline)).toBeTruthy();
    });
    expect(screen.getByText(content.preview.error.body)).toBeTruthy();
  });

  it("does not submit when the honeypot is filled", async () => {
    const submit = vi.fn() as unknown as SubmitGenerator;
    renderSection(submit);
    fillValidValues();
    const honeypot = screen.getByLabelText(content.form.honeypot.label);
    fireEvent.change(honeypot, { target: { value: "bot" } });
    clickSubmit();

    await waitFor(() => {
      expect(submit).not.toHaveBeenCalled();
    });
  });

  it("copies the caption from the free copy action", async () => {
    renderSection();
    fillValidValues();
    clickSubmit();

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: content.preview.success.copyCaption,
        }),
      ).toBeTruthy();
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: content.preview.success.copyCaption,
      }),
    );
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });
});
