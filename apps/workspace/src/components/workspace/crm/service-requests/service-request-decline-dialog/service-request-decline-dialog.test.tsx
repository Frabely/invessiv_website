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
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { ServiceRequestStatus as S } from "@invessiv/common/constants/crm/service-request-statuses";
import { serviceRequestFixture } from "@/server/tests/support/service-request-fixtures";
import { getCrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { ServiceRequestDeclineDialog } from "./service-request-decline-dialog";

const mocks = vi.hoisted(() => ({ decline: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/client/crm/service-requests-api-service", () => ({
  serviceRequestsApiService: { changeStatus: mocks.decline },
}));
const content = getCrmServiceRequestsDictionary("en");
const request = serviceRequestFixture();
afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());
describe("ServiceRequestDeclineDialog", () => {
  it("requires a reason, marks it customer-visible and focuses an invalid input", async () => {
    render(
      <ServiceRequestDeclineDialog
        request={request}
        content={content}
        onCloseAction={vi.fn()}
      />,
    );
    expect(screen.getByText(content.form.reasonHint)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: content.form.decline }));
    expect(await screen.findByText(content.form.reasonRequired)).toBeVisible();
    expect(screen.getByRole("textbox")).toHaveFocus();
    expect(mocks.decline).not.toHaveBeenCalled();
  });
  it("keeps a typed reason on conflict and retries against the fresh version", async () => {
    const close = vi.fn();
    mocks.decline
      .mockResolvedValueOnce({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        current: { ...request, status: S.Offered, version: 2 },
      })
      .mockResolvedValueOnce({
        ok: true,
        current: { ...request, status: S.Declined, version: 3 },
      });
    render(
      <ServiceRequestDeclineDialog
        request={request}
        content={content}
        onCloseAction={close}
      />,
    );
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "  We cannot fit this into the schedule.  " },
    });
    fireEvent.click(screen.getByRole("button", { name: content.form.decline }));
    expect(await screen.findByText(content.form.conflict)).toBeVisible();
    expect(screen.getByRole("textbox")).toHaveValue(
      "  We cannot fit this into the schedule.  ",
    );
    expect(close).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: content.form.decline }));
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(mocks.decline).toHaveBeenLastCalledWith(request.id, {
      to: S.Declined,
      version: 2,
      reason: "We cannot fit this into the schedule.",
    });
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });
});
