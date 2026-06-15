// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getLeadsSharedDictionary,
  getLeadsToolbarDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import { LeadFilterSelectId } from "@/common/constants/leads/list/lead-filter-select-ids";
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
        basePath="/de/leads"
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
    const sourceGroup = screen.getByRole("toolbar", { name: "Quelle" });
    const categoryGroup = screen.getByRole("toolbar", { name: "Kategorie" });
    const statusGroup = screen.getByRole("toolbar", { name: "Status" });
    expect(sourceGroup).toBeInTheDocument();
    expect(categoryGroup).toBeInTheDocument();
    expect(statusGroup).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter zurücksetzen" }),
    ).toBeEnabled();
    expect(
      screen
        .getByRole("button", { name: "Filter zurücksetzen" })
        .closest("footer"),
    ).toBeTruthy();
    expect(
      within(statusGroup).getByRole("button", { name: "Qualifiziert" }),
    ).toHaveAttribute("data-active", "true");
    expect(
      within(statusGroup)
        .getByText("Alle")
        .closest("[data-kind='status'][data-tone='neutral']"),
    ).toBeTruthy();
    expect(
      within(statusGroup)
        .getByText("Neu")
        .closest("[data-kind='status'][data-tone='info']"),
    ).toBeTruthy();
    expect(
      within(statusGroup)
        .getByText("Kontaktiert")
        .closest("[data-kind='status'][data-tone='primary']"),
    ).toBeTruthy();
    expect(
      within(statusGroup)
        .getByText("Qualifiziert")
        .closest("[data-kind='status'][data-tone='orange']"),
    ).toBeTruthy();
    expect(
      within(statusGroup)
        .getByText("Pausiert")
        .closest("[data-kind='status'][data-tone='neutral']"),
    ).toBeTruthy();
    expect(
      within(statusGroup)
        .getByText("Angebot")
        .closest("[data-kind='status'][data-tone='purple']"),
    ).toBeTruthy();
    expect(
      within(statusGroup)
        .getByText("Verloren")
        .closest("[data-kind='status'][data-tone='danger']"),
    ).toBeTruthy();
    expect(
      within(statusGroup)
        .getByText("Archiviert")
        .closest("[data-kind='status'][data-tone='neutral']"),
    ).toBeTruthy();
    expect(
      within(sourceGroup)
        .getByText("Alle Quellen")
        .closest("[data-kind='source'][data-tone='neutral']"),
    ).toBeTruthy();
    expect(
      within(sourceGroup)
        .getByText("Manuell")
        .closest("[data-kind='source'][data-tone='warning']"),
    ).toBeTruthy();
    expect(
      within(categoryGroup)
        .getByText("Coaches")
        .closest("[data-kind='category'][data-tone='primary']"),
    ).toBeTruthy();
    expect(
      within(categoryGroup)
        .getByText("Lokale Dienstleister")
        .closest("[data-kind='category'][data-tone='success']"),
    ).toBeTruthy();
    expect(
      within(categoryGroup)
        .getByText("Fotografen")
        .closest("[data-kind='category'][data-tone='info']"),
    ).toBeTruthy();
    expect(
      within(categoryGroup)
        .getByText("Andere")
        .closest("[data-kind='category'][data-tone='orange']"),
    ).toBeTruthy();
    expect(
      within(categoryGroup)
        .getByText("Coaches")
        .closest("button[data-active='true']"),
    ).toBeTruthy();
    expect(
      within(categoryGroup)
        .getByText("Coaches")
        .closest("[data-category-key='coaches']"),
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
        basePath="/de/leads"
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

  function renderToolbar(currentQueryString: string) {
    return render(
      <LeadsToolbar
        basePath="/de/leads"
        categories={[]}
        content={getLeadsToolbarDictionary("de")}
        currentQueryString={currentQueryString}
        sharedContent={getLeadsSharedDictionary("de")}
      />,
    );
  }

  function lastPushedParams() {
    const href = String(pushMock.mock.calls.at(-1)?.[0] ?? "");
    return new URLSearchParams(href.split("?")[1] ?? "");
  }

  describe("profile filter", () => {
    it("renders the profile filter group with all profile types", () => {
      renderToolbar("");

      const group = screen.getByRole("toolbar", { name: "Profile" });
      expect(group).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Website" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Telefon" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "LinkedIn" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Instagram" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "YouTube" }),
      ).toBeInTheDocument();
    });

    it("includes a profile type on first click", () => {
      renderToolbar("");

      fireEvent.click(screen.getByRole("button", { name: "Website" }));

      const params = lastPushedParams();
      expect(params.get("profile_include")).toBe("website");
      expect(params.has("profile_exclude")).toBe(false);
    });

    it("switches an included type to excluded on second click", () => {
      renderToolbar("profile_include=website");

      const chip = screen.getByRole("button", {
        name: "Website: eingeschlossen",
      });
      expect(chip).toHaveAttribute("data-state", "include");

      fireEvent.click(chip);

      const params = lastPushedParams();
      expect(params.has("profile_include")).toBe(false);
      expect(params.get("profile_exclude")).toBe("website");
    });

    it("clears an excluded type on third click", () => {
      renderToolbar("profile_exclude=website");

      const chip = screen.getByRole("button", {
        name: "Website: ausgeschlossen",
      });
      expect(chip).toHaveAttribute("data-state", "exclude");

      fireEvent.click(chip);

      const params = lastPushedParams();
      expect(params.has("profile_include")).toBe(false);
      expect(params.has("profile_exclude")).toBe(false);
    });

    it("supports selecting multiple include types", () => {
      renderToolbar("profile_include=website");

      fireEvent.click(screen.getByRole("button", { name: "LinkedIn" }));

      expect(lastPushedParams().get("profile_include")).toBe(
        "website,linkedin",
      );
    });

    it("enables reset and clears the profile params", () => {
      renderToolbar("profile_include=website&profile_exclude=youtube");

      const resetButton = screen.getByRole("button", {
        name: "Filter zurücksetzen",
      });
      expect(resetButton).toBeEnabled();

      fireEvent.click(resetButton);

      const params = lastPushedParams();
      expect(params.has("profile_include")).toBe(false);
      expect(params.has("profile_exclude")).toBe(false);
    });
  });

  describe("mobile filters", () => {
    it("commits the status filter from the mobile single select", () => {
      renderToolbar("");

      fireEvent.click(screen.getByRole("button", { name: "Status" }));
      const listbox = document.getElementById(
        `${LeadFilterSelectId.Status}-listbox`,
      );
      expect(listbox).not.toBeNull();

      fireEvent.click(
        within(listbox as HTMLElement).getByRole("option", {
          name: "Qualifiziert",
        }),
      );

      expect(lastPushedParams().get("status")).toBe("qualified");
    });

    it("commits the source filter from the mobile single select", () => {
      renderToolbar("");

      fireEvent.click(screen.getByRole("button", { name: "Quelle" }));
      const listbox = document.getElementById(
        `${LeadFilterSelectId.Source}-listbox`,
      );
      expect(listbox).not.toBeNull();

      fireEvent.click(
        within(listbox as HTMLElement).getByRole("option", {
          name: "Manuell",
        }),
      );

      expect(lastPushedParams().get("source")).toBe("manual");
    });

    it("clears an active filter via the inline clear button on the select", () => {
      renderToolbar("status=qualified");

      fireEvent.click(screen.getByRole("button", { name: "Zurücksetzen" }));

      expect(lastPushedParams().has("status")).toBe(false);
    });

    it("cycles a profile type from the mobile multi select", () => {
      renderToolbar("");

      fireEvent.click(screen.getByRole("button", { name: "Profile" }));
      const listbox = document.getElementById(
        `${LeadFilterSelectId.Profile}-listbox`,
      );
      expect(listbox).not.toBeNull();

      fireEvent.click(
        within(listbox as HTMLElement).getByRole("button", {
          name: "Website",
        }),
      );

      expect(lastPushedParams().get("profile_include")).toBe("website");
    });
  });

  it("keeps reset disabled when no filters are active", () => {
    render(
      <LeadsToolbar
        basePath="/de/leads"
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
