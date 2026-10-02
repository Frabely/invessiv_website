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

import { BookingUrlDialog } from "./booking-url-dialog";

const texts = {
  title: "Link",
  description: "Description",
  label: "Booking link",
  placeholder: "https://",
  hint: "Hint",
  submit: "Save",
  submitting: "Saving",
  cancel: "Cancel",
  close: "Close",
  issues: { invalid: "Invalid", not_https: "Not https", too_long: "Too long" },
  conflict: "Changed elsewhere.",
  conflictCurrent: "Stored: {url}",
  conflictCurrentEmpty: "Nothing stored.",
  error: "Failed.",
};

function renderDialog(saveAction = vi.fn()) {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(
    <BookingUrlDialog
      initial={{ bookingUrl: null, version: 1 }}
      onCloseAction={onClose}
      onSavedAction={onSaved}
      saveAction={saveAction}
      texts={texts}
    />,
  );
  return {
    onClose,
    onSaved,
    saveAction,
    type: (value: string) =>
      fireEvent.change(screen.getByLabelText(texts.label), {
        target: { value },
      }),
    save: () =>
      fireEvent.click(screen.getByRole("button", { name: texts.submit })),
  };
}

describe("BookingUrlDialog", () => {
  afterEach(cleanup);

  it.each([
    ["calendly.com/anna", texts.issues.invalid],
    ["http://calendly.com/anna", texts.issues.not_https],
    [`https://cal.com/${"a".repeat(2048)}`, texts.issues.too_long],
  ])(
    "names why %s is not accepted and drops the message on the next input",
    async (value, message) => {
      const { saveAction, save, type } = renderDialog();

      type(value);
      save();
      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(saveAction).not.toHaveBeenCalled();

      type("https://cal.com/anna");
      expect(screen.queryByText(message)).not.toBeInTheDocument();
    },
  );

  it("reports the save before it closes and submits with the Enter key as well", async () => {
    const saveAction = vi.fn().mockResolvedValue({ ok: true });
    const { onClose, onSaved, type } = renderDialog(saveAction);

    type("https://cal.com/anna");
    fireEvent.submit(screen.getByLabelText(texts.label).closest("form")!);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(saveAction).toHaveBeenCalledWith({
      bookingUrl: "https://cal.com/anna",
      version: 1,
    });
  });

  it("closes without saving on cancel", () => {
    const { onClose, saveAction } = renderDialog();

    fireEvent.click(screen.getByRole("button", { name: texts.cancel }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(saveAction).not.toHaveBeenCalled();
  });
});
