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
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
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

function renderDialog(
  dto: PortalHoursDto = hours(),
  dashboardProjectId: string | null = null,
) {
  const close = vi.fn();
  render(
    <PortalHoursDialog
      content={content}
      customerId={CUSTOMER_ID}
      dashboardProjectId={dashboardProjectId}
      hours={dto}
      locale="de"
      onCloseAction={close}
    />,
  );
  return { close };
}

function projectRow(title: string) {
  return screen.getByRole("button", { name: new RegExp(`^${title}`) });
}

function projectFigures(title: string) {
  return screen.getByRole("group", {
    name: formatMessage(content.figures.projectLabel, { project: title }),
  });
}

function showTab(label: string) {
  fireEvent.click(screen.getByRole("tab", { name: label }));
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
  describe("overview", () => {
    it("shows the company figures, the projects and entries and purchases as tabs", async () => {
      renderDialog();

      const totals = screen.getByRole("group", {
        name: content.figures.label,
      });
      expect(totals).toHaveTextContent("Gekauft10:00");
      expect(totals).toHaveTextContent("Verbraucht8:30");
      // Only Website has time left; the overdrawn Shop adds nothing.
      expect(totals).toHaveTextContent("In Projekten offen2:30");
      expect(totals).toHaveTextContent("Frei0:00");
      expect(projectRow("Website")).toHaveTextContent(
        "2:30 von 5:00 verbraucht",
      );
      expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
        content.tabs.entries,
        content.tabs.purchases,
      ]);
      expect(
        screen.getByRole("tab", { name: content.tabs.entries }),
      ).toHaveAttribute("aria-selected", "true");
      await screen.findByText(content.entries.empty);
    });

    it("says an overdrawn project and an overdrawn company in words", async () => {
      renderDialog(
        hours({
          balance: {
            purchasedMinutes: 600,
            usedMinutes: 660,
            remainingMinutes: -60,
            unassignedMinutes: 0,
          },
        }),
      );

      expect(screen.getByText("1:00 über dem Kontingent")).toBeInTheDocument();
      expect(projectRow("Shop")).toHaveTextContent(
        "Dieses Projekt hat 1:00 mehr verbraucht als zugewiesen.",
      );
      await screen.findByText(content.entries.empty);
    });

    it("counts unassigned hours as free", async () => {
      renderDialog(
        hours({
          balance: {
            purchasedMinutes: 600,
            usedMinutes: 510,
            remainingMinutes: 90,
            unassignedMinutes: 30,
          },
        }),
      );

      expect(
        screen.getByRole("group", { name: content.figures.label }),
      ).toHaveTextContent("Frei0:30");
      await screen.findByText(content.entries.empty);
    });

    it("names the project of each entry in its own column", async () => {
      api.listTimeEntries.mockResolvedValue(page([entry("e-1")]));
      renderDialog();

      const table = await screen.findByRole("table", {
        name: content.entries.tableLabel,
      });
      expect(
        within(table)
          .getAllByRole("columnheader")
          .map((cell) => cell.textContent),
      ).toEqual([
        content.entries.columns.date,
        content.entries.columns.description,
        content.entries.columns.task,
        content.entries.columns.project,
        content.entries.columns.duration,
      ]);
      expect(
        within(table).getByRole("row", { name: /Umbau Hero-Section/ }),
      ).toHaveTextContent("Website");
    });

    it("lists earlier projects as one sum that cannot be opened", async () => {
      renderDialog(
        hours({
          earlierProjects: {
            allocatedMinutes: 120,
            usedMinutes: 120,
            remainingMinutes: 0,
            openMinutes: 0,
            overMinutes: 0,
          },
        }),
      );

      expect(screen.getByText("2:00 von 2:00 verbraucht")).toBeInTheDocument();
      expect(
        screen.getByText(content.projects.earlierHint),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", {
          name: new RegExp(content.projects.earlier),
        }),
      ).toBeNull();
      await screen.findByText(content.entries.empty);
    });

    it("shows earlier overruns in words and in the bar even when the net remainder is zero", async () => {
      renderDialog(
        hours({
          balance: {
            purchasedMinutes: 600,
            usedMinutes: 600,
            remainingMinutes: 0,
            unassignedMinutes: 0,
          },
          projects: [],
          earlierProjects: {
            allocatedMinutes: 600,
            usedMinutes: 600,
            remainingMinutes: 0,
            openMinutes: 60,
            overMinutes: 60,
          },
        }),
      );

      const overText = screen.getByText(
        formatMessage(content.projects.earlierOver, { duration: "1:00" }),
      );
      const earlierRow = overText.closest("li");
      expect(
        earlierRow?.querySelector('rect[data-kind="over"]'),
      ).not.toBeNull();
      expect(
        earlierRow?.querySelector('rect[data-kind="open"]'),
      ).not.toBeNull();
      expect(
        screen.getByRole("group", { name: content.figures.label }),
      ).toHaveTextContent("In Projekten offen1:00");
      expect(
        screen.queryByRole("button", { name: /Frühere Projekte/ }),
      ).toBeNull();
      await screen.findByText(content.entries.empty);
    });

    it("shows purchases with sign, correction mark and note", async () => {
      renderDialog();
      showTab(content.tabs.purchases);

      const purchases = screen.getByRole("tabpanel", {
        name: content.tabs.purchases,
      });
      expect(within(purchases).getByText("+11:00")).toBeInTheDocument();
      expect(
        within(purchases).getByText("Betreuung nach dem Launch"),
      ).toBeInTheDocument();
      expect(within(purchases).getByText("−1:00")).toBeInTheDocument();
      expect(
        within(purchases).getByText(content.purchases.correction),
      ).toBeInTheDocument();
    });

    it("never asks for time entries without the detail right and drops the tabs", () => {
      renderDialog(hours({ canReadEntries: false }));

      expect(api.listTimeEntries).not.toHaveBeenCalled();
      expect(screen.queryByRole("tablist")).toBeNull();
      expect(screen.queryByText(content.entries.empty)).toBeNull();
      expect(
        screen.getByRole("region", { name: content.tabs.purchases }),
      ).toHaveTextContent("Betreuung nach dem Launch");
    });

    it("has no project list without projects", async () => {
      renderDialog(hours({ projects: [] }));

      expect(
        screen.queryByRole("heading", { name: content.projects.title }),
      ).toBeNull();
      await screen.findByText(content.entries.empty);
    });

    it("loads all entries with date, task, goodwill mark and project, without month rows", async () => {
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

      const list = screen.getByRole("tabpanel", {
        name: content.tabs.entries,
      });
      expect(
        await within(list).findByText("Umbau Hero-Section"),
      ).toBeInTheDocument();
      expect(api.listTimeEntries).toHaveBeenCalledWith(CUSTOMER_ID, {
        projectId: undefined,
      });
      expect(within(list).getByText("5. Okt. 2026")).toBeInTheDocument();
      expect(within(list).getByText("30. Sept. 2026")).toBeInTheDocument();
      expect(within(list).queryByRole("heading")).toBeNull();
      expect(
        within(list).getByRole("row", { name: /Umbau Hero-Section/ }),
      ).toHaveTextContent("Startseite");
      expect(
        within(list).getByText(content.entries.goodwill),
      ).toBeInTheDocument();
      expect(within(list).getByText("Website")).toBeInTheDocument();
      expect(
        within(list).getByText(content.entries.earlier),
      ).toBeInTheDocument();
    });
  });

  describe("project", () => {
    it("opens a project without allocations or bookings with zero figures and an empty chart", async () => {
      renderDialog(
        hours({
          projects: [
            {
              projectId: "empty-project",
              title: "New project",
              allocatedMinutes: 0,
              usedMinutes: 0,
              remainingMinutes: 0,
            },
          ],
        }),
      );
      await screen.findByText(content.entries.empty);
      expect(
        projectRow("New project").querySelector('svg[viewBox="0 0 100 1"]'),
      ).toBeInTheDocument();

      fireEvent.click(projectRow("New project"));

      const figures = projectFigures("New project");
      expect(figures).toHaveTextContent("Zugewiesen0:00");
      expect(figures).toHaveTextContent("Verbraucht0:00");
      expect(figures).toHaveTextContent("Übrig0:00");
      const chart = figures.querySelector('svg[viewBox="0 0 100 1"]');
      expect(chart).toBeInTheDocument();
      expect(chart?.querySelector("rect")).toBeNull();
      await screen.findByText(content.entries.emptyFiltered);
      expect(api.listTimeEntries).toHaveBeenLastCalledWith(CUSTOMER_ID, {
        projectId: "empty-project",
      });
    });

    it("opens a project from its row with its own figures and entries only", async () => {
      renderDialog();
      await screen.findByText(content.entries.empty);

      fireEvent.click(projectRow("Shop"));

      const heading = screen.getByRole("heading", { name: "Shop" });
      expect(heading).toHaveFocus();
      const figures = projectFigures("Shop");
      expect(figures).toHaveTextContent("Zugewiesen5:00");
      expect(figures).toHaveTextContent("Verbraucht6:00");
      expect(figures).toHaveTextContent("Übrig−1:00");
      expect(
        screen.getByText(
          "Dieses Projekt hat 1:00 mehr verbraucht als zugewiesen.",
        ),
      ).toBeInTheDocument();
      expect(window.location.search).toBe(
        "?widget=hours&hoursProject=project-b",
      );
      expect(screen.queryByRole("tablist")).toBeNull();
      expect(screen.queryByText("Betreuung nach dem Launch")).toBeNull();
      expect(screen.queryByText(/Über alle Projekte/)).toBeNull();
      expect(
        await screen.findByText(content.entries.emptyFiltered),
      ).toBeInTheDocument();
      expect(api.listTimeEntries).toHaveBeenLastCalledWith(CUSTOMER_ID, {
        projectId: "project-b",
      });
    });

    it("goes back to the overview with `all` and focus on the project row", async () => {
      renderDialog(hours(), "project-a");
      await screen.findByText(content.entries.emptyFiltered);

      fireEvent.click(
        screen.getByRole("button", { name: content.projects.back }),
      );

      expect(window.location.search).toBe("?widget=hours&hoursProject=all");
      expect(
        screen.getByRole("group", { name: content.figures.label }),
      ).toBeInTheDocument();
      expect(projectRow("Website")).toHaveFocus();
      await screen.findByText(content.entries.empty);
    });

    it("leaves the project entries out without the detail right", () => {
      renderDialog(hours({ canReadEntries: false }), "project-a");

      expect(projectFigures("Website")).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: content.tabs.entries }),
      ).toBeNull();
      expect(api.listTimeEntries).not.toHaveBeenCalled();
    });

    it("hides entries of other projects and their project names", async () => {
      const current = entry("current");
      const earlier = entry("earlier", {
        projectId: null,
        description: "Frühere Buchung",
      });
      api.listTimeEntries.mockImplementation(async (_customerId, query) =>
        page(query.projectId ? [current] : [current, earlier]),
      );
      renderDialog(hours(), "project-a");

      expect(await screen.findByText(current.description)).toBeInTheDocument();
      expect(screen.queryByText(earlier.description)).toBeNull();
      expect(screen.queryByText(content.entries.earlier)).toBeNull();
      expect(
        screen.queryByRole("columnheader", {
          name: content.entries.columns.project,
        }),
      ).toBeNull();
    });
  });

  describe("selection", () => {
    it("opens on the dashboard project without moving focus", async () => {
      renderDialog(hours(), "project-b");

      expect(projectFigures("Shop")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Shop" })).not.toHaveFocus();
      await waitFor(() =>
        expect(api.listTimeEntries).toHaveBeenCalledWith(CUSTOMER_ID, {
          projectId: "project-b",
        }),
      );
    });

    it("lets the URL win over the dashboard project, including the overview", async () => {
      window.history.replaceState(
        null,
        "",
        "/de/portal/customer-1?widget=hours&hoursProject=project-a",
      );
      renderDialog(hours(), "project-b");
      expect(projectFigures("Website")).toBeInTheDocument();
      await screen.findByText(content.entries.emptyFiltered);
      cleanup();

      window.history.replaceState(
        null,
        "",
        "/de/portal/customer-1?widget=hours&hoursProject=all",
      );
      renderDialog(hours(), "project-b");
      expect(
        screen.getByRole("group", { name: content.figures.label }),
      ).toBeInTheDocument();
      await screen.findByText(content.entries.empty);
    });

    it("ignores an unknown project in the URL", async () => {
      window.history.replaceState(
        null,
        "",
        "/de/portal/customer-1?widget=hours&hoursProject=foreign",
      );
      renderDialog();

      expect(
        screen.getByRole("group", { name: content.figures.label }),
      ).toBeInTheDocument();
      await waitFor(() =>
        expect(api.listTimeEntries).toHaveBeenCalledWith(CUSTOMER_ID, {
          projectId: undefined,
        }),
      );
    });
  });

  describe("entries", () => {
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
        .mockResolvedValueOnce({
          ok: false,
          code: PortalHoursErrorCode.Internal,
        })
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
});
