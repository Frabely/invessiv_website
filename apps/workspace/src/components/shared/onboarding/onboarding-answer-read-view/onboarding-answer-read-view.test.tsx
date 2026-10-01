// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QuestionnaireFieldType as T } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import {
  portalOnboardingAnswer as answer,
  portalOnboardingBlock as block,
  portalOnboardingChoices as choices,
  portalOnboardingField as field,
} from "@/components/shared/onboarding/testing/portal-onboarding-form-fixture";
import {
  OnboardingAnswerReadView,
  type OnboardingAnswerReadViewProps,
} from "./onboarding-answer-read-view";

const texts = {
  unanswered: "Not answered",
  empty: "No answer",
  required: "Required",
};
const REQUIRED = { requirement: QuestionnaireFieldRequirement.Required };

function renderView(overrides: Partial<OnboardingAnswerReadViewProps>) {
  return render(
    <OnboardingAnswerReadView
      answerFiles={[]}
      answers={[]}
      blocks={[]}
      groupEntries={[]}
      servicesConfirmed={false}
      texts={texts}
      {...overrides}
    />,
  );
}

/** The description of the term with this label. */
function valueOf(label: string) {
  const term = screen.getByText(label).closest("dt");
  return term!.nextElementSibling as HTMLElement;
}

describe("OnboardingAnswerReadView", () => {
  afterEach(cleanup);

  it("shows every block with its fields and their answers", () => {
    renderView({
      blocks: [
        block("Company", [
          field("Name"),
          field("Shop", {
            type: T.YesNo,
            choices: choices("Shop", "Yes", "No"),
          }),
          field("Channels", {
            type: T.MultiChoice,
            choices: choices("Channels", "Mail", "Phone", "Chat"),
          }),
        ]),
        block("Brand", [field("Claim")]),
      ],
      answers: [
        answer("Name", { value: "Acme GmbH" }),
        answer("Shop", { choiceId: "Shop-Yes" }),
        answer("Channels", { choiceId: "Channels-Chat" }, 1),
        answer("Channels", { choiceId: "Channels-Mail" }, 0),
      ],
    });

    expect(
      screen.getAllByRole("heading").map((heading) => heading.textContent),
    ).toEqual(["Company", "Brand"]);
    expect(valueOf("Name")).toHaveTextContent("Acme GmbH");
    expect(valueOf("Shop")).toHaveTextContent("Yes");
    expect(
      within(valueOf("Channels"))
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Mail", "Chat"]);
  });

  it("tells an unanswered required field from an empty optional one", () => {
    renderView({
      blocks: [block("Company", [field("Name", REQUIRED), field("Claim")])],
    });

    expect(valueOf("Name")).toHaveTextContent("Not answered");
    expect(valueOf("Name").firstElementChild).toHaveAttribute(
      "data-state",
      "missing",
    );
    expect(valueOf("Claim")).toHaveTextContent("No answer");
    expect(valueOf("Claim").firstElementChild).toHaveAttribute(
      "data-state",
      "empty",
    );
  });

  it("leaves out a field whose condition is not met", () => {
    const fields = [
      field("Shop", { type: T.YesNo, choices: choices("Shop", "Yes", "No") }),
      field("Shop link", {
        ...REQUIRED,
        type: T.Url,
        conditionFieldId: "Shop",
        conditionChoiceId: "Shop-Yes",
      }),
    ];

    const { rerender } = renderView({
      blocks: [block("Company", fields)],
      answers: [answer("Shop", { choiceId: "Shop-No" })],
    });
    expect(screen.queryByText("Shop link")).toBeNull();

    rerender(
      <OnboardingAnswerReadView
        answerFiles={[]}
        answers={[answer("Shop", { choiceId: "Shop-Yes" })]}
        blocks={[block("Company", fields)]}
        groupEntries={[]}
        servicesConfirmed={false}
        texts={texts}
      />,
    );
    expect(valueOf("Shop link")).toHaveTextContent("Not answered");
  });

  it("renders answer text as text, never as markup", () => {
    const { container } = renderView({
      blocks: [block("Company", [field("Note", { type: T.LongText })])],
      answers: [
        answer("Note", {
          value: '<script>alert("x")</script><b>bold</b> https://example.com',
        }),
      ],
    });

    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
    expect(valueOf("Note")).toHaveTextContent(
      '<script>alert("x")</script><b>bold</b>',
    );
    expect(
      screen.getByRole("link", { name: "https://example.com" }),
    ).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("explains an empty form instead of showing nothing", () => {
    renderView({ blocks: [], emptyText: "Nothing here" });

    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });
});
