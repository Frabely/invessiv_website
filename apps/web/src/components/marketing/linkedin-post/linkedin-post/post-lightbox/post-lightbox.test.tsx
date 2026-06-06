// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PostLightbox } from "./post-lightbox";

describe("PostLightbox", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders nothing while closed", () => {
    render(
      <PostLightbox
        ariaLabel="Vergrößerte Beitragsvorschau"
        closeLabel="Vorschau schließen"
        onClose={vi.fn()}
        open={false}
      >
        <p>Inhalt</p>
      </PostLightbox>,
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders the dialog and focuses the close button when open", () => {
    render(
      <PostLightbox
        ariaLabel="Vergrößerte Beitragsvorschau"
        closeLabel="Vorschau schließen"
        onClose={vi.fn()}
        open
      >
        <p>Inhalt</p>
      </PostLightbox>,
    );

    const dialog = screen.getByRole("dialog", {
      name: "Vergrößerte Beitragsvorschau",
    });
    expect(dialog).toBeTruthy();
    expect(screen.getByText("Inhalt")).toBeTruthy();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Vorschau schließen" }),
    );
  });

  it("calls onClose via close button, Escape and backdrop click", () => {
    const onClose = vi.fn();
    render(
      <PostLightbox
        ariaLabel="Vergrößerte Beitragsvorschau"
        closeLabel="Vorschau schließen"
        onClose={onClose}
        open
      >
        <p>Inhalt</p>
      </PostLightbox>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Vorschau schließen" }));
    fireEvent.keyDown(document, { key: "Escape" });

    const dialog = screen.getByRole("dialog");
    if (!dialog.parentElement) {
      throw new Error("Expected backdrop element");
    }
    fireEvent.click(dialog.parentElement);

    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("does not close when the dialog surface is clicked", () => {
    const onClose = vi.fn();
    render(
      <PostLightbox
        ariaLabel="Vergrößerte Beitragsvorschau"
        closeLabel="Vorschau schließen"
        onClose={onClose}
        open
      >
        <p>Inhalt</p>
      </PostLightbox>,
    );

    fireEvent.click(screen.getByRole("dialog"));

    expect(onClose).not.toHaveBeenCalled();
  });
});
