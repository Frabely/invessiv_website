// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useForm, useWatch } from "react-hook-form";

import type { ContactProjectScope } from "@invessiv/common/constants/contact/contact-project-scopes";
import type { ContactFormValues } from "@invessiv/common/contracts/contact/forms/contact-form-values";
import { ProjectScopeField } from "./project-scope-field";

afterEach(() => {
  cleanup();
});

const OPTION_LABELS: Record<ContactProjectScope, string> = {
  unsure: "Noch unsicher",
  landing_page: "Landingpage",
  compact_website: "Kompakte Website",
  business_website: "Business Website",
};

type HarnessProps = {
  initialScope: ContactProjectScope | "";
  onValid: () => void;
};

function Harness({ initialScope, onValid }: HarnessProps) {
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<ContactFormValues>({
    defaultValues: {
      consentAccepted: true,
      displayName: "Mara Kern",
      email: "mara@example.com",
      message: "",
      projectScope: initialScope as ContactProjectScope,
    },
  });
  const selectedScope = useWatch({ control, name: "projectScope" });

  return (
    <form onSubmit={handleSubmit(onValid)}>
      <ProjectScopeField
        errorMessage={errors.projectScope ? "Pflichtfeld" : undefined}
        label="Leistungsmodell"
        optionLabels={OPTION_LABELS}
        register={register}
        selectedScope={selectedScope}
      />
      <button type="submit">Senden</button>
    </form>
  );
}

describe("ProjectScopeField", () => {
  it("lists the fallback option first", () => {
    render(<Harness initialScope="unsure" onValid={vi.fn()} />);

    const labels = screen
      .getAllByRole("radio")
      .map((radio) => radio.closest("label")?.textContent?.trim());

    expect(labels).toEqual([
      "Noch unsicher",
      "Landingpage",
      "Kompakte Website",
      "Business Website",
    ]);
  });

  it("marks the group as required for assistive technology", () => {
    render(<Harness initialScope="unsure" onValid={vi.fn()} />);

    expect(
      screen
        .getByRole("group", { name: /Leistungsmodell/ })
        .getAttribute("aria-required"),
    ).toBe("true");
  });

  it("renders a scope-specific service icon for every service scope", () => {
    const { container } = render(
      <Harness initialScope="unsure" onValid={vi.fn()} />,
    );

    const maskedIcons = [...container.querySelectorAll("[data-scope]")].map(
      (icon) => icon.getAttribute("data-scope"),
    );

    expect(maskedIcons).toEqual([
      "landing_page",
      "compact_website",
      "business_website",
    ]);
  });

  it("draws the fallback scope from the icon library instead of a service file", () => {
    const { container } = render(
      <Harness initialScope="unsure" onValid={vi.fn()} />,
    );

    const unsureChip = screen
      .getByRole("radio", { name: "Noch unsicher" })
      .closest("label");

    expect(unsureChip?.querySelector("[data-scope]")).toBeNull();
    expect(unsureChip?.querySelector("svg[data-icon]")).not.toBeNull();
    expect(container.innerHTML).not.toContain("unsure.svg");
  });

  it("blocks submitting when no scope is set", async () => {
    const onValid = vi.fn();
    render(<Harness initialScope="" onValid={onValid} />);

    fireEvent.click(screen.getByRole("button", { name: "Senden" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveProperty(
        "textContent",
        "Pflichtfeld",
      );
    });
    expect(onValid).not.toHaveBeenCalled();
  });

  it("submits once a scope is chosen", async () => {
    const onValid = vi.fn();
    render(<Harness initialScope="" onValid={onValid} />);

    fireEvent.click(screen.getByRole("radio", { name: "Kompakte Website" }));
    fireEvent.click(screen.getByRole("button", { name: "Senden" }));

    await waitFor(() => {
      expect(onValid).toHaveBeenCalledTimes(1);
    });
  });
});
