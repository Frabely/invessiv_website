// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConsentProvider } from "./consent-provider";
import { CONSENT_STORAGE_KEY } from "@/common/constants/storage/storage-keys";
import type { Locale } from "@/config/i18n";
import { getConsentStaticContent } from "@/i18n/dictionaries/shared/consent";

function renderProvider(locale: Locale = "de") {
  return render(
    <ConsentProvider content={getConsentStaticContent(locale)} locale={locale}>
      <div>page</div>
    </ConsentProvider>,
  );
}

function readStored() {
  const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

describe("ConsentProvider banner", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.gtag = vi.fn();
  });

  afterEach(() => {
    cleanup();
    delete window.gtag;
  });

  it("shows the banner only when no consent is stored", async () => {
    renderProvider();
    expect(await screen.findByRole("dialog")).toBeTruthy();
  });

  it("does not show the banner when a choice is already stored", async () => {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        analytics: true,
        marketing: false,
        updatedAt: "2026-06-12T10:00:00.000Z",
      }),
    );
    renderProvider();
    await waitFor(() => {
      expect(screen.getByText("page")).toBeTruthy();
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("accept all stores granted consent and emits a consent update", async () => {
    renderProvider();
    fireEvent.click(
      await screen.findByRole("button", { name: "Alle akzeptieren" }),
    );

    await waitFor(() => {
      expect(window.gtag).toHaveBeenCalledWith("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      });
    });
    expect(readStored()).toMatchObject({ analytics: true, marketing: true });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("reject stores denied consent and emits a denied consent update", async () => {
    renderProvider();
    fireEvent.click(await screen.findByRole("button", { name: "Ablehnen" }));

    await waitFor(() => {
      expect(window.gtag).toHaveBeenCalledWith("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    });
    expect(readStored()).toMatchObject({ analytics: false, marketing: false });
  });

  it("saves a granular selection from the settings panel", async () => {
    renderProvider();
    fireEvent.click(
      await screen.findByRole("button", { name: "Einstellungen" }),
    );
    fireEvent.click(screen.getByRole("checkbox", { name: /Marketing/ }));
    fireEvent.click(screen.getByRole("button", { name: "Auswahl speichern" }));

    await waitFor(() => {
      expect(window.gtag).toHaveBeenCalledWith("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      });
    });
    expect(readStored()).toMatchObject({ analytics: false, marketing: true });
  });

  it("dismisses the banner on Escape without storing a choice", async () => {
    renderProvider();
    await screen.findByRole("dialog");
    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(readStored()).toBeNull();
  });

  it("renders English copy for the en locale", async () => {
    renderProvider("en");
    expect(
      await screen.findByRole("button", { name: "Accept all" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reject" })).toBeTruthy();
  });
});
