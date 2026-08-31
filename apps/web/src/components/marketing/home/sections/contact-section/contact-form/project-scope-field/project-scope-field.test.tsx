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
  landing_page: "Landingpage",
  compact_website: "Kompakte Website",
  business_website: "Business Website",
};

type HarnessProps = {
  initialScope?: ContactProjectScope;
  onValid: (values: ContactFormValues) => void;
};

function Harness({ initialScope, onValid }: HarnessProps) {
  const { control, handleSubmit, register, setValue } =
    useForm<ContactFormValues>({
      defaultValues: {
        consentAccepted: true,
        displayName: "Mara Kern",
        email: "mara@example.com",
        message: "",
        projectScope: initialScope,
      },
    });
  const selectedScope = useWatch({ control, name: "projectScope" });

  return (
    <form onSubmit={handleSubmit(onValid)}>
      <ProjectScopeField
        label="Leistungsmodell (optional)"
        optionLabels={OPTION_LABELS}
        register={register}
        selectedScope={selectedScope}
        setValue={setValue}
      />
      <button type="submit">Senden</button>
    </form>
  );
}

describe("ProjectScopeField", () => {
  it("lists only the three service models", () => {
    render(<Harness onValid={vi.fn()} />);

    expect(
      screen.getAllByRole("radio").map((radio) => radio.getAttribute("value")),
    ).toEqual(["landing_page", "compact_website", "business_website"]);
    expect(screen.queryByText("Noch unsicher")).toBeNull();
  });

  it("is optional for assistive technology", () => {
    render(<Harness onValid={vi.fn()} />);

    expect(
      screen
        .getByRole("group", { name: /Leistungsmodell/ })
        .getAttribute("aria-required"),
    ).toBeNull();
  });

  it("submits without a selected scope", async () => {
    const onValid = vi.fn();
    render(<Harness onValid={onValid} />);

    fireEvent.click(screen.getByRole("button", { name: "Senden" }));

    await waitFor(() =>
      expect(onValid).toHaveBeenCalledWith(
        expect.objectContaining({ projectScope: null }),
        expect.anything(),
      ),
    );
  });

  it("submits the selected scope", async () => {
    const onValid = vi.fn();
    render(<Harness onValid={onValid} />);

    fireEvent.click(screen.getByRole("radio", { name: "Kompakte Website" }));
    fireEvent.click(screen.getByRole("button", { name: "Senden" }));

    await waitFor(() =>
      expect(onValid).toHaveBeenCalledWith(
        expect.objectContaining({ projectScope: "compact_website" }),
        expect.anything(),
      ),
    );
  });

  it("unchecks the native radio when the scope is cleared", async () => {
    render(<Harness initialScope="compact_website" onValid={vi.fn()} />);

    const chip = screen.getByRole("radio", { name: "Kompakte Website" });
    expect(chip).toHaveProperty("checked", true);

    fireEvent.click(chip);

    // Assistive tech reads the native state, so it has to follow the form value.
    await waitFor(() => expect(chip).toHaveProperty("checked", false));
    expect(document.querySelector("input:checked")).toBeNull();
  });

  it("selects the scope again after it was cleared", async () => {
    const onValid = vi.fn();
    render(<Harness initialScope="compact_website" onValid={onValid} />);

    const chip = screen.getByRole("radio", { name: "Kompakte Website" });
    fireEvent.click(chip);
    await waitFor(() => expect(chip).toHaveProperty("checked", false));

    fireEvent.click(chip);
    await waitFor(() => expect(chip).toHaveProperty("checked", true));

    fireEvent.click(screen.getByRole("button", { name: "Senden" }));

    await waitFor(() =>
      expect(onValid).toHaveBeenCalledWith(
        expect.objectContaining({ projectScope: "compact_website" }),
        expect.anything(),
      ),
    );
  });

  it("clears the selected scope when its chip is selected again", async () => {
    const onValid = vi.fn();
    render(<Harness initialScope="compact_website" onValid={onValid} />);

    fireEvent.click(screen.getByRole("radio", { name: "Kompakte Website" }));
    fireEvent.click(screen.getByRole("button", { name: "Senden" }));

    await waitFor(() =>
      expect(onValid).toHaveBeenCalledWith(
        expect.objectContaining({ projectScope: undefined }),
        expect.anything(),
      ),
    );
  });
});
