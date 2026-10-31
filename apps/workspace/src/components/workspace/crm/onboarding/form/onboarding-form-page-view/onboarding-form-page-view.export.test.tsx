// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ONBOARDING_FORM_STATUS_VALUES,
  OnboardingFormStatus,
} from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import {
  getCrmFilesDictionary,
  getCrmOnboardingDictionary,
  getCrmQuestionnaireDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import { OnboardingFormPageView } from "./onboarding-form-page-view";

const mocks = vi.hoisted(() => ({ downloadUrl: vi.fn() }));

vi.mock("@/lib/files/browser-download", () => ({
  browserDownload: { downloadUrl: mocks.downloadUrl, openUrl: vi.fn() },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/de/crm/onboarding/f-1",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/client/crm/onboarding-form-api-service", () => ({
  onboardingFormApiService: { definitionApi: vi.fn() },
}));

const content = getCrmOnboardingDictionary("de");

function renderPage(status: OnboardingFormStatus, canWrite: boolean) {
  render(
    <OnboardingFormPageView
      backHref="/de/crm?cockpit=c-1&project=p-1"
      canWrite={canWrite}
      catalogBlocks={[]}
      templates={[]}
      content={content}
      context={{
        customerId: "c-1",
        customerName: "Nordlicht Coaching",
        projectId: "p-1",
        projectTitle: "Website-Relaunch",
        projectPhase: "onboarding",
        templateTitle: null,
      }}
      fixedChoiceLabels={{
        de: { yes: "Ja", no: "Nein" },
        en: { yes: "Yes", no: "No" },
      }}
      form={
        {
          id: "f-1",
          status,
          version: 1,
          blocks: [],
          answers: [],
          answerFiles: [],
          hiddenAnswerFiles: [],
          groupEntries: [],
          services: [],
          servicesConfirmedAt: null,
          servicesNote: null,
          submittedAt: null,
          customerId: "c-1",
        } as unknown as OnboardingFormDto
      }
      filesContent={getCrmFilesDictionary("de")}
      locale="de"
      questionnaireContent={getCrmQuestionnaireDictionary("de")}
    />,
  );
}

describe("OnboardingFormPageView export", () => {
  afterEach(() => {
    cleanup();
    mocks.downloadUrl.mockReset();
  });

  it.each(ONBOARDING_FORM_STATUS_VALUES)(
    "offers the export in status %s with read access only",
    (status) => {
      renderPage(status, false);
      expect(
        screen.getByRole("button", { name: content.form.export.action }),
      ).toBeInTheDocument();
    },
  );

  it("downloads the archive in the page locale and names a failure", () => {
    renderPage(OnboardingFormStatus.Open, true);
    fireEvent.click(
      screen.getByRole("button", { name: content.form.export.action }),
    );

    expect(mocks.downloadUrl).toHaveBeenCalledWith(
      "/api/workspace/crm/onboarding/forms/f-1/export?locale=de",
      null,
      expect.any(Function),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    const onError = mocks.downloadUrl.mock.calls[0]![2] as (
      code: string | null,
    ) => void;
    act(() => onError(null));
    expect(screen.getByRole("alert")).toHaveTextContent(
      content.form.export.error,
    );
  });
});
