// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LeadImportReportDto } from "@/common/contracts/leads/import/lead-import-report.dto";
import { getLeadsImportDictionary } from "@/i18n/dictionaries/workspace/leads";
import { ImportLeadsDialog } from "./import-leads-dialog";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const { mockSubmitLeadImport } = vi.hoisted(() => ({
  mockSubmitLeadImport: vi.fn(),
}));

vi.mock("./import-leads-service", () => ({
  submitLeadImport: mockSubmitLeadImport,
}));

const STUB_REPORT: LeadImportReportDto = {
  totalRows: 3,
  importedCount: 3,
  skippedCount: 0,
  errorCount: 0,
  warningCount: 0,
  ignoredColumns: ["category"],
  rowIssues: [],
  importBatchId: "batch-uuid-1",
};

function makeValidCsvFile(): File {
  return new File(["email;last_name\ntest@test.com;Test"], "leads.csv", {
    type: "text/csv",
  });
}

function makeOversizedFile(): File {
  const file = new File(["x"], "big.csv", { type: "text/csv" });
  Object.defineProperty(file, "size", {
    value: 3 * 1024 * 1024,
    configurable: true,
  });
  return file;
}

function triggerFileChange(file: File): void {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error("file input not found");
  Object.defineProperty(input, "files", {
    value: [file],
    configurable: true,
  });
  fireEvent.change(input);
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  refreshMock.mockReset();
  mockSubmitLeadImport.mockReset();
  vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => {
    fn(0);
    return 0;
  });
});

describe("ImportLeadsDialog", () => {
  describe("DE dictionary", () => {
    it("renders the trigger button", () => {
      render(<ImportLeadsDialog content={getLeadsImportDictionary("de")} />);

      expect(
        screen.getByRole("button", { name: "CSV-Import" }),
      ).toBeInTheDocument();
    });

    it("opens the dialog on trigger click", async () => {
      render(<ImportLeadsDialog content={getLeadsImportDictionary("de")} />);

      fireEvent.click(screen.getByRole("button", { name: "CSV-Import" }));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });
  });

  describe("EN dictionary", () => {
    it("renders the trigger button", () => {
      render(<ImportLeadsDialog content={getLeadsImportDictionary("en")} />);

      expect(
        screen.getByRole("button", { name: "CSV Import" }),
      ).toBeInTheDocument();
    });
  });

  describe("file size validation", () => {
    it("shows inline error for oversized file and does not proceed to preview", async () => {
      const content = getLeadsImportDictionary("de");
      render(<ImportLeadsDialog content={content} />);

      fireEvent.click(screen.getByRole("button", { name: "CSV-Import" }));
      await waitFor(() => screen.getByRole("dialog"));

      triggerFileChange(makeOversizedFile());

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          content.errors.client_too_large,
        );
      });

      expect(mockSubmitLeadImport).not.toHaveBeenCalled();
      expect(screen.queryByText(content.dialog.submit)).not.toBeInTheDocument();
    });
  });

  describe("submit success", () => {
    it("shows counters and ignored columns from the report", async () => {
      const content = getLeadsImportDictionary("de");
      mockSubmitLeadImport.mockResolvedValue({ ok: true, report: STUB_REPORT });

      render(<ImportLeadsDialog content={content} />);
      fireEvent.click(screen.getByRole("button", { name: "CSV-Import" }));
      await waitFor(() => screen.getByRole("dialog"));

      triggerFileChange(makeValidCsvFile());

      await waitFor(() =>
        screen.getByRole("button", { name: content.dialog.submit }),
      );

      fireEvent.click(
        screen.getByRole("button", { name: content.dialog.submit }),
      );

      await waitFor(() => {
        expect(screen.getByText(content.summary.title)).toBeInTheDocument();
      });

      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText(content.summary.imported)).toBeInTheDocument();
      expect(screen.getByText("category")).toBeInTheDocument();
    });

    it("calls router.refresh() when importedCount > 0", async () => {
      mockSubmitLeadImport.mockResolvedValue({ ok: true, report: STUB_REPORT });

      render(<ImportLeadsDialog content={getLeadsImportDictionary("de")} />);
      fireEvent.click(screen.getByRole("button", { name: "CSV-Import" }));
      await waitFor(() => screen.getByRole("dialog"));

      triggerFileChange(makeValidCsvFile());
      await waitFor(() =>
        screen.getByRole("button", {
          name: getLeadsImportDictionary("de").dialog.submit,
        }),
      );
      fireEvent.click(
        screen.getByRole("button", {
          name: getLeadsImportDictionary("de").dialog.submit,
        }),
      );

      await waitFor(() => {
        expect(refreshMock).toHaveBeenCalledOnce();
      });
    });
  });

  describe("submit error", () => {
    it("shows the localized error message from the API error code", async () => {
      const content = getLeadsImportDictionary("de");
      mockSubmitLeadImport.mockResolvedValue({
        ok: false,
        error: "invalid_csv",
      });

      render(<ImportLeadsDialog content={content} />);
      fireEvent.click(screen.getByRole("button", { name: "CSV-Import" }));
      await waitFor(() => screen.getByRole("dialog"));

      triggerFileChange(makeValidCsvFile());
      await waitFor(() =>
        screen.getByRole("button", { name: content.dialog.submit }),
      );
      fireEvent.click(
        screen.getByRole("button", { name: content.dialog.submit }),
      );

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          content.errors.invalid_csv,
        );
      });
    });
  });

  describe("keyboard navigation", () => {
    it("closes the dialog when Escape is pressed", async () => {
      render(<ImportLeadsDialog content={getLeadsImportDictionary("de")} />);
      fireEvent.click(screen.getByRole("button", { name: "CSV-Import" }));

      const dialog = await waitFor(() => screen.getByRole("dialog"));

      fireEvent.keyDown(dialog, { key: "Escape" });

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });
  });
});
