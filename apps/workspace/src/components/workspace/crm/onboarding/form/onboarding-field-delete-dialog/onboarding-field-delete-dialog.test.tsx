// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { getCrmOnboardingDictionary } from "@/i18n/dictionaries/workspace/crm";
import { fieldFixture } from "@/server/tests/workspace/crm/support/questionnaire-definition-fixtures";
import { OnboardingFieldDeleteDialog } from "./onboarding-field-delete-dialog";

const api = vi.hoisted(() => ({ getFieldUsage: vi.fn() }));
vi.mock("@/client/crm/onboarding-form-api-service", () => ({
  onboardingFormApiService: api,
}));

const text = getCrmOnboardingDictionary("de").structure.fieldDeleteDialog;

function renderDialog(
  type: QuestionnaireFieldType = QuestionnaireFieldType.ShortText,
) {
  const onConfirmAction = vi.fn();
  render(
    <OnboardingFieldDeleteDialog
      content={text}
      dialog={{
        field: fieldFixture("logo", type),
        name: "Logo",
        busy: false,
        onCancelAction: vi.fn(),
        onConfirmAction,
      }}
      formId="f-1"
    />,
  );
  return onConfirmAction;
}

describe("OnboardingFieldDeleteDialog", () => {
  beforeEach(() => api.getFieldUsage.mockReset());
  afterEach(cleanup);

  it("names the answers and files that go with the field", async () => {
    api.getFieldUsage.mockResolvedValue({
      ok: true,
      value: { answers: 3, files: 1 },
    });
    const onConfirm = renderDialog();

    expect(
      screen.getByText("„Logo“ wird aus diesem Bogen gelöscht."),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Betroffen sind 3 Antworten und 1 Datei\./),
    ).toBeInTheDocument();
    expect(api.getFieldUsage).toHaveBeenCalledWith("f-1", "f-logo");

    fireEvent.click(screen.getByRole("button", { name: text.confirm }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("says so when nothing is lost and words a group as a group", async () => {
    api.getFieldUsage.mockResolvedValue({
      ok: true,
      value: { answers: 0, files: 0 },
    });
    renderDialog(QuestionnaireFieldType.Group);

    expect(
      screen.getByText(
        "„Logo“ wird mit allen Unterfeldern aus diesem Bogen gelöscht.",
      ),
    ).toBeInTheDocument();
    expect(await screen.findByText(text.usageNone)).toBeInTheDocument();
  });

  it("warns instead of guessing when the usage cannot be loaded", async () => {
    api.getFieldUsage.mockResolvedValue({
      ok: false,
      code: OnboardingErrorCode.Internal,
    });
    renderDialog();

    expect(await screen.findByText(text.usageFailed)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: text.confirm })).toBeEnabled();
  });
});
