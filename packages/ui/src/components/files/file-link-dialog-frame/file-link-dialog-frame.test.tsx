// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FileLinkDialogFrame } from "@invessiv/ui";

const labels = {
  title: "Add link",
  description: "Share a link",
  name: "Name",
  namePlaceholder: "Link name",
  nameRequired: "Name required",
  url: "URL",
  urlPlaceholder: "https://example.com",
  urlHint: "Use HTTPS",
  urlInvalid: "Invalid URL",
  submit: "Save",
  submitting: "Saving",
};

afterEach(cleanup);

describe("FileLinkDialogFrame", () => {
  it("keeps the dialog open after an API error and allows a corrected retry", async () => {
    const submit = vi
      .fn()
      .mockResolvedValueOnce("Could not save")
      .mockResolvedValueOnce(null);
    const close = vi.fn();
    render(
      <FileLinkDialogFrame
        cancelLabel="Cancel"
        closeLabel="Close"
        fields={null}
        labels={labels}
        onCloseAction={close}
        onSubmitAction={submit}
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: /Name/ }), {
      target: { value: "  Example  " },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /URL/ }), {
      target: { value: "  https://example.com  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not save",
    );
    expect(close).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(submit).toHaveBeenCalledWith("Example", "https://example.com");
  });
});
