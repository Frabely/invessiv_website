// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PortalHoursErrorCode } from "@invessiv/common/constants/portal/portal-hours-error-codes";
import type { PortalHoursDto } from "@invessiv/common/contracts/portal/portal-hours.dto";
import type { PortalTimeEntryDto } from "@invessiv/common/contracts/portal/portal-time-entry.dto";
import { getPortalHoursDictionary } from "@/i18n/dictionaries/portal";
import { PortalHoursDialog } from "./portal-hours-dialog";

const api = vi.hoisted(() => ({ listTimeEntries: vi.fn() }));

vi.mock("next/navigation", async () => {
  const { useSyncExternalStore } = await import("react");
  function subscribe(onChange: () => void) {
    window.addEventListener("popstate", onChange);
    return () => window.removeEventListener("popstate", onChange);
  }
  return {
    useSearchParams: () =>
      new URLSearchParams(
        useSyncExternalStore(subscribe, () => window.location.search),
      ),
  };
});
vi.mock("@/client/portal/portal-hours-api-service", () => ({
  portalHoursApiService: { listTimeEntries: api.listTimeEntries },
}));

const content = getPortalHoursDictionary("de");
const CUSTOMER_ID = "customer-1";

function hours(overrides: Partial<PortalHoursDto> = {}): PortalHoursDto {
  return {
    balance: {
      purchasedMinutes: 600,
      usedMinutes: 510,
      remainingMinutes: 90,
      unassignedMinutes: 0,
    },
    projects: [
      {
        projectId: "project-b",
        title: "Shop",
        allocatedMinutes: 300,
        usedMinutes: 360,
        remainingMinutes: -60,
      },
      {
        projectId: "project-a",
        title: "Website",
        allocatedMinutes: 300,
        usedMinutes: 150,
        remainingMinutes: 150,
      },
    ],
    earlierProjects: null,
    purchases: [
      {
        purchasedOn: "2026-10-02",
        minutes: -60,
        isCorrection: true,
        note: "",
      },
      {
        purchasedOn: "2026-10-01",
        minutes: 660,
        isCorrection: false,
        note: "Betreuung nach dem Launch",
      },
    ],
    canReadEntries: true,
    ...overrides,
  };
}

function entry(
  id: string,
  overrides: Partial<PortalTimeEntryDto> = {},
): PortalTimeEntryDto {
  return {
    id,
    projectId: "project-a",
    performedOn: "2026-10-05",
    durationMinutes: 60,
    description: "Umbau Hero-Section",
    billable: true,
    taskTitle: null,
    ...overrides,
  };
}

function page(entries: PortalTimeEntryDto[], nextCursor: string | null = null) {
  return { ok: true, value: { entries, nextCursor } };
}

function renderDialog(dto: PortalHoursDto = hours()) {
  const close = vi.fn();
  render(
    <PortalHoursDialog
      content={content}
      customerId={CUSTOMER_ID}
      hours={dto}
      locale="de"
      onCloseAction={close}
    />,
  );
  return { close };
}

beforeEach(() => {
  window.history.replaceState(null, "", "/de/portal/customer-1?widget=hours");
  // Next.js notifies useSearchParams subscribers after native history writes.
  const replaceState = window.history.replaceState.bind(window.history);
  vi.spyOn(window.history, "replaceState").mockImplementation(
    (data, unused, url) => {
      replaceState(data, unused, url);
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
  );
  api.listTimeEntries.mockResolvedValue(page([]));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("PortalHoursDialog", () => {
  it("shows the balance and each project with its remaining time", async () => {
    renderDialog();

    const totals = screen.getByRole("group", { name: content.summary.title });
    expect(totals).toHaveTextContent("Gekauft10:00");
    expect(totals).toHaveTextContent("Verbraucht8:30");
    expect(totals).toHaveTextContent("Übrig1:30");

    const website = screen.getByRole("row", { name: /Website/ });
    expect(within(website).getByText("5:00")).toBeInTheDocument();
    expect(within(website).getAllByText("2:30")).toHaveLength(2);
    await screen.findByText(content.entries.empty);
  });

  it("says in words when a project used more than it was assigned", async () => {
    renderDialog();

    const shop = screen.getByRole("row", { name: /Shop/ });
    expect(within(shop).getByText("−1:00")).toBeInTheDocument();
    expect(
      within(shop).getByText(
        "Dieses Projekt hat 1:00 mehr verbraucht als zugewiesen.",
      ),
    ).toBeInTheDocument();
    await screen.findByText(content.entries.empty);
  });

  it("says in words when the company is over its hours and what is unassigned", async () => {
    renderDialog(
      hours({
        balance: {
          purchasedMinutes: 600,
          usedMinutes: 660,
          remainingMinutes: -60,
          unassignedMinutes: 30,
        },
      }),
    );

    expect(screen.getByText("1:00 über dem Kontingent")).toBeInTheDocument();
    expect(
      screen.getByText("0:30 davon sind noch keinem Projekt zugewiesen."),
    ).toBeInTheDocument();
    await screen.findByText(content.entries.empty);
  });

  it("leaves out the unassigned note when everything is assigned", async () => {
    renderDialog();

    expect(screen.queryByText(/keinem Projekt zugewiesen/)).toBeNull();
    await screen.findByText(content.entries.empty);
  });

  it("lists earlier projects as one row without a title of their own", async () => {
    renderDialog(
      hours({
        earlierProjects: {
          allocatedMinutes: 120,
          usedMinutes: 120,
          remainingMinutes: 0,
        },
      }),
    );

    const earlier = screen.getByRole("row", {
      name: new RegExp(content.summary.earlier),
    });
    expect(within(earlier).getAllByText("2:00")).toHaveLength(2);
    await screen.findByText(content.entries.empty);
  });

  it("shows purchases with sign, correction mark and note", async () => {
    renderDialog();

    const purchases = screen.getByRole("region", {
      name: content.purchases.title,
    });
    expect(within(purchases).getByText("+11:00")).toBeInTheDocument();
    expect(
      within(purchases).getByText("Betreuung nach dem Launch"),
    ).toBeInTheDocument();
    expect(within(purchases).getByText("−1:00")).toBeInTheDocument();
    expect(
      within(purchases).getByText(content.purchases.correction),
    ).toBeInTheDocument();
    await screen.findByText(content.entries.empty);
  });

  it("never asks for time entries without the detail right and shows no trace of them", () => {
    renderDialog(hours({ canReadEntries: false }));

    expect(api.listTimeEntries).not.toHaveBeenCalled();
    expect(screen.queryByText(content.entries.title)).toBeNull();
    expect(screen.queryByText(content.entries.empty)).toBeNull();
  });

  it("loads the entries when it opens, grouped by month, with task and goodwill mark", async () => {
    api.listTimeEntries.mockResolvedValue(
      page([
        entry("e-1", { taskTitle: "Startseite" }),
        entry("e-2", {
          performedOn: "2026-09-30",
          durationMinutes: 30,
          description: "Kleine Korrektur",
          billable: false,
          projectId: null,
        }),
      ]),
    );
    renderDialog();

    const list = screen.getByRole("region", { name: content.entries.title });
    expect(
      await within(list).findByText("Umbau Hero-Section"),
    ).toBeInTheDocument();
    expect(api.listTimeEntries).toHaveBeenCalledWith(CUSTOMER_ID, {
      projectId: undefined,
    });
    expect(
      within(list).getByRole("heading", { name: "Oktober 2026" }),
    ).toBeInTheDocument();
    expect(
      within(list).getByRole("heading", { name: "September 2026" }),
    ).toBeInTheDocument();
    expect(within(list).getByText("Aufgabe: Startseite")).toBeInTheDocument();
    expect(
      within(list).getByText(content.entries.goodwill),
    ).toBeInTheDocument();
    expect(within(list).getByText(content.entries.earlier)).toBeInTheDocument();
  });

  it("filters by project in the URL and tells an empty filter from an empty list", async () => {
    renderDialog();
    expect(await screen.findByText(content.entries.empty)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Website" }));

    expect(
      await screen.findByText(content.entries.emptyFiltered),
    ).toBeInTheDocument();
    expect(api.listTimeEntries).toHaveBeenLastCalledWith(CUSTOMER_ID, {
      projectId: "project-a",
    });
    expect(window.location.search).toBe("?widget=hours&hoursProject=project-a");
    expect(screen.getByRole("button", { name: "Website" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(
      screen.getByRole("button", { name: content.entries.allProjects }),
    );
    await waitFor(() => expect(window.location.search).toBe("?widget=hours"));
  });

  it("starts with the project filter named in the URL and ignores an unknown one", async () => {
    window.history.replaceState(
      null,
      "",
      "/de/portal/customer-1?widget=hours&hoursProject=project-b",
    );
    renderDialog();
    await waitFor(() =>
      expect(api.listTimeEntries).toHaveBeenCalledWith(CUSTOMER_ID, {
        projectId: "project-b",
      }),
    );
    cleanup();
    api.listTimeEntries.mockClear();

    window.history.replaceState(
      null,
      "",
      "/de/portal/customer-1?widget=hours&hoursProject=foreign",
    );
    renderDialog();
    await waitFor(() =>
      expect(api.listTimeEntries).toHaveBeenCalledWith(CUSTOMER_ID, {
        projectId: undefined,
      }),
    );
  });

  it.each([false, true])(
    "lets a single visible project be selected and reset with earlier entries (prefiltered: %s)",
    async (prefiltered) => {
      if (prefiltered)
        window.history.replaceState(
          null,
          "",
          "?widget=hours&hoursProject=project-a",
        );
      const current = entry("current");
      const earlier = entry("earlier", {
        projectId: null,
        description: "Frühere Buchung",
      });
      api.listTimeEntries.mockImplementation(async (_customerId, query) =>
        page(query.projectId ? [current] : [current, earlier]),
      );
      renderDialog(
        hours({
          projects: hours().projects.filter(
            (project) => project.projectId === "project-a",
          ),
          earlierProjects: {
            allocatedMinutes: 60,
            usedMinutes: 60,
            remainingMinutes: 0,
          },
        }),
      );
      const project = screen.getByRole("button", { name: "Website" });
      const all = screen.getByRole("button", {
        name: content.entries.allProjects,
      });
      await screen.findByText(current.description);
      if (!prefiltered) {
        expect(screen.getByText(earlier.description)).toBeInTheDocument();
        fireEvent.click(project);
      }
      await waitFor(() => {
        expect(project).toHaveAttribute("aria-pressed", "true");
        expect(screen.queryByText(earlier.description)).toBeNull();
      });
      expect(api.listTimeEntries).toHaveBeenLastCalledWith(CUSTOMER_ID, {
        projectId: "project-a",
      });
      fireEvent.click(all);
      expect(await screen.findByText(earlier.description)).toBeInTheDocument();
      expect(all).toHaveAttribute("aria-pressed", "true");
      expect(window.location.search).toBe("?widget=hours");
    },
  );

  it("loads more entries and announces how many arrived", async () => {
    api.listTimeEntries
      .mockResolvedValueOnce(page([entry("e-1")], "cursor-1"))
      .mockResolvedValueOnce(
        page([
          entry("e-2", { description: "Zweite Buchung" }),
          entry("e-3", { description: "Dritte Buchung" }),
        ]),
      );
    renderDialog();

    fireEvent.click(
      await screen.findByRole("button", { name: content.entries.more }),
    );

    expect(await screen.findByText("Dritte Buchung")).toBeInTheDocument();
    expect(api.listTimeEntries).toHaveBeenLastCalledWith(CUSTOMER_ID, {
      projectId: undefined,
      cursor: "cursor-1",
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "2 weitere Buchungen geladen.",
    );
    expect(
      screen.queryByRole("button", { name: content.entries.more }),
    ).toBeNull();
  });

  it("offers a retry when the entries cannot be loaded", async () => {
    api.listTimeEntries
      .mockResolvedValueOnce({ ok: false, code: PortalHoursErrorCode.Internal })
      .mockResolvedValueOnce(page([entry("e-1")]));
    renderDialog();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.entries.loadError,
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.entries.retry }),
    );

    expect(await screen.findByText("Umbau Hero-Section")).toBeInTheDocument();
  });
});
