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
import { ServiceRequestErrorCode as E } from "@invessiv/common/constants/crm/errors/service-request-error-codes";
import { ServiceRequestStatus as S } from "@invessiv/common/constants/crm/service-request-statuses";
import { serviceRequestFixture } from "@/server/tests/support/service-request-fixtures";
import { getCrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { ServiceRequestWithdrawDialog } from "./service-request-withdraw-dialog";

const mocks = vi.hoisted(() => ({ changeStatus: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/client/crm/service-requests-api-service", () => ({
  serviceRequestsApiService: { changeStatus: mocks.changeStatus },
}));
const content = getCrmServiceRequestsDictionary("en");
const request = serviceRequestFixture({ status: S.Offered, version: 2 });
afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

describe("ServiceRequestWithdrawDialog", () => {
  it("says what happens and closes the request only after the confirmation", async () => {
    const close = vi.fn();
    mocks.changeStatus.mockResolvedValue({
      ok: true,
      current: { ...request, status: S.Withdrawn, version: 3 },
    });
    render(
      <ServiceRequestWithdrawDialog
        request={request}
        content={content}
        onCloseAction={close}
      />,
    );
    expect(screen.getByText(content.form.withdrawNotice)).toBeVisible();
    expect(mocks.changeStatus).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: content.form.withdraw }),
    );
    await waitFor(() => expect(close).toHaveBeenCalled());
    expect(mocks.changeStatus).toHaveBeenCalledWith(request.id, {
      to: S.Withdrawn,
      version: 2,
    });
  });
  it("shows why a request that was decided meanwhile cannot be closed again", async () => {
    mocks.changeStatus.mockResolvedValue({
      ok: false,
      code: E.InvalidTransition,
    });
    render(
      <ServiceRequestWithdrawDialog
        request={request}
        content={content}
        onCloseAction={vi.fn()}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.form.withdraw }),
    );
    expect(
      await screen.findByText(content.errors.INVALID_TRANSITION),
    ).toBeVisible();
  });
});
