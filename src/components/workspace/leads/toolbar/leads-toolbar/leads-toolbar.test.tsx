// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getLeadsSharedDictionary,
  getLeadsToolbarDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import { LeadsToolbar } from "./leads-toolbar";

const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

beforeEach(() => {
  pushMock.mockReset();
  replaceMock.mockReset();
  vi.useFakeTimers();
});

describe("LeadsToolbar", () => {
  it("renders active filters and updates the URL for immediate filter changes", async () => {
    render(
      <LeadsToolbar
        basePath="/de/workspace/leads"
        categories={[
          { id: "cat-1", label: "Coaches", labelKey: "coaches" },
          { id: "cat-2", label: "Berater", labelKey: "consultants" },
          {
            id: "cat-3",
            label: "Lokale Dienstleister",
            labelKey: "local-service-providers",
          },
          {
            id: "cat-4",
            label: "Fotografen",
            labelKey: "photographers",
          },
          {
            id: "cat-5",
            label: "Andere",
            labelKey: "other",
          },
        ]}
        content={getLeadsToolbarDictionary("de")}
        currentQueryString="status=qualified&source=manual&category=cat-1&search=acme&score_min=70&date_from=2024-01-01&date_to=2024-01-31&page=2&sort=created_desc"
        sharedContent={getLeadsSharedDictionary("de")}
      />,
    );

    expect(screen.getByLabelText("Suche")).toHaveValue("acme");
    expect(screen.getByRole("toolbar", { name: "Quelle" })).toBeInTheDocument();
    expect(
      screen.getByRole("toolbar", { name: "Kategorie" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("toolbar", { name: "Status" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter zurücksetzen" }),
    ).toBeEnabled();
    expect(
      screen
        .getByRole("button", { name: "Filter zurücksetzen" })
        .closest("footer"),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Qualifiziert" }),
    ).toHaveAttribute("data-active", "true");
    expect(
      screen
        .getByText("Alle")
        .closest("[data-kind='status'][data-tone='neutral']"),
    ).toBeTruthy();
    expect(
      screen.getByText("Neu").closest("[data-kind='status'][data-tone='info']"),
    ).toBeTruthy();
    expect(
      screen
        .getByText("Kontaktiert")
        .closest("[data-kind='status'][data-tone='primary']"),
    ).toBeTruthy();
    expect(
      screen
        .getByText("Qualifiziert")
        .closest("[data-kind='status'][data-tone='orange']"),
    ).toBeTruthy();
    expect(
      screen
        .getByText("Pausiert")
        .closest("[data-kind='status'][data-tone='neutral']"),
    ).toBeTruthy();
    expect(
      screen
        .getByText("Angebot")
        .closest("[data-kind='status'][data-tone='purple']"),
    ).toBeTruthy();
    expect(
      screen
        .getByText("Verloren")
        .closest("[data-kind='status'][data-tone='danger']"),
    ).toBeTruthy();
    expect(
      screen
        .getByText("Archiviert")
        .closest("[data-kind='status'][data-tone='neutral']"),
    ).toBeTruthy();
    expect(
      screen
        .getByText("Alle Quellen")
        .closest("[data-kind='source'][data-tone='neutral']"),
    ).toBeTruthy();
    expect(
      screen
        .getByText("Manuell")
        .closest("[data-kind='source'][data-tone='warning']"),
    ).toBeTruthy();
    expect(
      screen
        .getByText("Coaches")
        .closest("[data-kind='category'][data-tone='primary']"),
    ).toBeTruthy();
    expect(
      screen
        .getByText("Lokale Dienstleister")
        .closest("[data-kind='category'][data-tone='success']"),
    ).toBeTruthy();
    expect(
      screen
        .getByText("Fotografen")
        .closest("[data-kind='category'][data-tone='info']"),
    ).toBeTruthy();
    expect(
      screen
        .getByText("Andere")
        .closest("[data-kind='category'][data-tone='orange']"),
    ).toBeTruthy();
    expect(
      screen.getByText("Coaches").closest("button[data-active='true']"),
    ).toBeTruthy();
    expect(
      screen.getByText("Coaches").closest("[data-category-key='coaches']"),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Webformular" }));
    expect(pushMock).toHaveBeenCalledWith(
      expect.stringContaining("source=webform"),
      { scroll: false },
    );

    fireEvent.click(screen.getByRole("button", { name: "Berater" }));
    expect(pushMock).toHaveBeenCalledWith(
      expect.stringContaining("category=cat-2"),
      { scroll: false },
    );

    fireEvent.change(screen.getByLabelText("Suche"), {
      target: { value: "" },
    });
    act(() => {
      vi.runAllTimers();
    });
    const lastCall = replaceMock.mock.calls.at(-1);
    expect(lastCall?.[1]).toEqual({ scroll: false });
    const href = String(lastCall?.[0] ?? "");
    expect(new URLSearchParams(href.split("?")[1] ?? "").has("search")).toBe(
      false,
    );
  });

  it("can collapse and expand the filter area", () => {
    render(
      <LeadsToolbar
        basePath="/de/workspace/leads"
        categories={[]}
        content={getLeadsToolbarDictionary("de")}
        currentQueryString=""
        sharedContent={getLeadsSharedDictionary("de")}
      />,
    );

    const toggleButton = screen.getByRole("button", {
      name: "Filterbereich einklappen",
    });

    expect(toggleButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("Suche")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter zurücksetzen" }),
    ).toBeDisabled();

    fireEvent.click(toggleButton);

    expect(
      screen.getByRole("button", { name: "Filterbereich ausklappen" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("searchbox", { name: "Suche" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Filter zurücksetzen" }),
    ).toBeDisabled();

    fireEvent.click(
      screen.getByRole("button", { name: "Filterbereich ausklappen" }),
    );

    expect(
      screen.getByRole("button", { name: "Filterbereich einklappen" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("searchbox", { name: "Suche" }),
    ).toBeInTheDocument();
  });

  it("keeps reset disabled when no filters are active", () => {
    render(
      <LeadsToolbar
        basePath="/de/workspace/leads"
        categories={[]}
        content={getLeadsToolbarDictionary("de")}
        currentQueryString=""
        sharedContent={getLeadsSharedDictionary("de")}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Filter zurücksetzen" }),
    ).toBeDisabled();
  });
});
