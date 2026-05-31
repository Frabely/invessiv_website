// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  email: "test@example.com",
} as const;

const GENERATED_POST = {
  bodyVariant: "insight" as const,
  bullets: null,
  colorPair: {
    accent: "#5BA3D9",
    id: "navy-steel",
    index: 0,
    primary: "#0F1B2D",
    secondary: "#1A3355",
    text: "#E8F1FA",
  },
  expertiseDisplay: "Strategieberatung",
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
  fireEvent.click(
    screen.getByLabelText(content.form.tone.options[0].label, {
      exact: false,
    }),
  );
  fireEvent.change(screen.getByLabelText(content.form.email.label), {
    target: { value: VALID_INPUTS.email },
  });
  fireEvent.click(screen.getByLabelText(content.form.consent.label));
}

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
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
  it("renders the idle preview skeleton by default", () => {
    const { container } = renderSection();
    expect(container.querySelector('[data-state="idle"]')).toBeTruthy();
  });

  it("shows required errors when submitting an empty form", async () => {
    const submit = vi.fn() as unknown as SubmitGenerator;
    renderSection(submit);
    clickSubmit();

    await waitFor(() => {
      expect(screen.getByText(content.form.topic.requiredError)).toBeTruthy();
    });
    expect(screen.getByText(content.form.expertise.requiredError)).toBeTruthy();
    expect(screen.getByText(content.form.email.requiredError)).toBeTruthy();
    expect(screen.getByText(content.form.consent.requiredError)).toBeTruthy();
    expect(submit).not.toHaveBeenCalled();
  });

  it("shows the email format error for an invalid email", async () => {
    const submit = vi.fn() as unknown as SubmitGenerator;
    renderSection(submit);
    fillValidValues();
    fireEvent.change(screen.getByLabelText(content.form.email.label), {
      target: { value: "not-an-email" },
    });

    clickSubmit();

    await waitFor(() => {
      expect(screen.getByText(content.form.email.invalidError!)).toBeTruthy();
    });
    expect(submit).not.toHaveBeenCalled();
  });

  it("selects a tone and toggles the selected state", () => {
    renderSection();
    const provocative = screen.getByLabelText(
      content.form.tone.options[2].label,
      { exact: false },
    );
    fireEvent.click(provocative);
    expect((provocative as HTMLInputElement).checked).toBe(true);
  });

  it("selects a predefined background color pair", () => {
    renderSection();
    const firstPair = GENERATOR_COLOR_PAIRS[0];
    const swatch = screen.getByLabelText(
      `${content.form.color.swatchLabel} ${firstPair.name}`,
    ) as HTMLInputElement;
    fireEvent.click(swatch);
    expect(swatch.checked).toBe(true);
  });

  it("transitions through loading and success when submit succeeds", async () => {
    let resolveSubmit:
      | ((value: LinkedInPostGeneratorResult) => void)
      | undefined;
    const submit = vi.fn<SubmitGenerator>(
      () =>
        new Promise<LinkedInPostGeneratorResult>((resolve) => {
          resolveSubmit = resolve;
        }),
    );

    const { container } = renderSection(submit);
    fillValidValues();
    clickSubmit();

    await waitFor(() => {
      expect(screen.getByText(content.preview.loading.headline)).toBeTruthy();
    });
    expect(
      screen.getByRole("button", { name: content.form.submitLoading }),
    ).toBeTruthy();
    expect(screen.getByText(content.form.loadingHelp)).toBeTruthy();

    resolveSubmit!({
      ok: true,
      caption: "Erfolgs-Caption.",
      downloadFileName: "erfolgs-caption.png",
      imageDataUrl: "data:image/png;base64,AAAA",
      post: GENERATED_POST,
      previewHtml: PREVIEW_HTML,
    });

    await waitFor(() => {
      expect(screen.getByText(content.preview.success.headline)).toBeTruthy();
    });
    const captionBlock = screen.getByText("Erfolgs-Caption.");
    expect(captionBlock).toBeTruthy();
    const form = container.querySelector("form");
    expect(form).toBeTruthy();
    expect(
      within(form as HTMLFormElement).getByRole("button", {
        name: content.preview.success.downloadImage,
      }),
    ).toBeTruthy();
    expect(submit).toHaveBeenCalledTimes(1);
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

  it("copies the caption when pressing the copy button", async () => {
    renderSection();
    fillValidValues();
    clickSubmit();

    await waitFor(
      () => {
        const form = screen.getByRole("form", {
          name: content.title,
        });
        expect(
          within(form).getByRole("button", {
            name: content.preview.success.copyCaption,
          }),
        ).toBeTruthy();
      },
      { timeout: 3000 },
    );
    const copyButton = within(
      screen.getByRole("form", { name: content.title }),
    ).getByRole("button", {
      name: content.preview.success.copyCaption,
    });
    fireEvent.click(copyButton);
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  it("links the consent label to a checkbox input", () => {
    renderSection();
    const checkbox = screen.getByRole("checkbox", {
      name: content.form.consent.label,
    }) as HTMLInputElement;
    expect(checkbox).toBeTruthy();
    expect(checkbox.type).toBe("checkbox");
  });
});
