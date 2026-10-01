// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QuestionnaireFieldType as T } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
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
  confirmed: "Confirmed",
  scale: "{step} of {max}",
  entry: "Entry {number}",
  noEntries: "No entries",
  filesLabel: "Files for {field}",
  servicesConfirmed: "Confirmed by the customer",
  servicesNotConfirmed: "Not confirmed yet",
  servicesNote: "Remark",
  servicesEmpty: "No services",
};
const REQUIRED = { requirement: QuestionnaireFieldRequirement.Required };

function renderView(overrides: Partial<OnboardingAnswerReadViewProps>) {
  return render(
    <OnboardingAnswerReadView
      answerFiles={[]}
      answers={[]}
      blocks={[]}
      groupEntries={[]}
      services={[]}
      servicesConfirmed={false}
      servicesNote={null}
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
        services={[]}
        servicesConfirmed={false}
        servicesNote={null}
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

  it("lists the entries of a group with their own answers and marks what an entry lacks", () => {
    renderView({
      blocks: [
        block("Company", [
          field("Team", {
            type: T.Group,
            children: [
              field("Member", { ...REQUIRED, parentFieldId: "Team" }),
              field("Role", { parentFieldId: "Team" }),
            ],
          }),
        ]),
      ],
      groupEntries: [
        { id: "e-2", fieldId: "Team", position: 1 },
        { id: "e-1", fieldId: "Team", position: 0 },
      ],
      answers: [{ ...answer("Member", { value: "Ada" }), groupEntryId: "e-1" }],
    });
    const [first, second] = within(valueOf("Team")).getAllByRole("listitem");

    expect(first).toHaveTextContent("Entry 1");
    expect(first).toHaveTextContent("Ada");
    expect(first).toHaveTextContent("No answer");
    expect(second).toHaveTextContent("Entry 2");
    expect(second).toHaveTextContent("Not answered");
  });

  it("tells a group without entries apart from one that needs some", () => {
    const team = field("Team", { type: T.Group, children: [field("Member")] });
    const { rerender } = renderView({ blocks: [block("Company", [team])] });
    expect(valueOf("Team")).toHaveTextContent("No entries");

    rerender(
      <OnboardingAnswerReadView
        answerFiles={[]}
        answers={[]}
        blocks={[block("Company", [{ ...team, ...REQUIRED }])]}
        groupEntries={[]}
        services={[]}
        servicesConfirmed={false}
        servicesNote={null}
        texts={texts}
      />,
    );
    expect(valueOf("Team")).toHaveTextContent("Not answered");
  });

  it("names attached files where no download is wired up", () => {
    renderView({
      blocks: [block("Company", [field("Logo", { type: T.Files })])],
      answerFiles: [
        {
          id: "link-1",
          fieldId: "Logo",
          groupEntryId: null,
          position: 0,
          file: {
            id: "file-1",
            displayName: "logo.png",
            assetKind: AssetKind.Image,
            source: FileSource.Upload,
            extension: "png",
            sizeBytes: 10,
            url: null,
            note: null,
            createdAt: "2026-10-01T10:00:00.000Z",
          },
        },
      ],
    });

    expect(
      screen.getByRole("list", { name: "Files for Logo" }),
    ).toHaveTextContent("logo.png");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows the booked services with the confirmation and the remark as text", () => {
    const services = field("Services", {
      ...REQUIRED,
      type: T.ProjectServices,
    });
    const { container, rerender } = renderView({
      blocks: [block("Company", [services])],
      services: [
        { title: "Landing page", description: "One page", position: 0 },
      ],
    });
    expect(valueOf("Services")).toHaveTextContent("Landing page");
    expect(valueOf("Services")).toHaveTextContent("One page");
    expect(valueOf("Services")).toHaveTextContent("Not answered");

    rerender(
      <OnboardingAnswerReadView
        answerFiles={[]}
        answers={[]}
        blocks={[block("Company", [services])]}
        groupEntries={[]}
        services={[]}
        servicesConfirmed
        servicesNote="<b>Blog</b> please"
        texts={texts}
      />,
    );
    expect(valueOf("Services")).toHaveTextContent("No services");
    expect(valueOf("Services")).toHaveTextContent("Confirmed by the customer");
    expect(valueOf("Services")).toHaveTextContent("<b>Blog</b> please");
    expect(container.querySelector("b")).toBeNull();
  });

  it("words a confirmation, a colour and a level of a scale", () => {
    renderView({
      blocks: [
        block("Company", [
          field("Rights", { type: T.Confirmation }),
          field("Brand", { type: T.Color }),
          field("Tone", {
            type: T.Scale,
            choices: choices("Tone", "Playful", "Serious"),
          }),
        ]),
      ],
      answers: [
        answer("Rights", { value: "true" }),
        answer("Brand", { value: "#1A2B3C" }),
        answer("Tone", { value: "4" }),
      ],
    });

    expect(valueOf("Rights")).toHaveTextContent("Confirmed");
    expect(valueOf("Brand")).toHaveTextContent("#1A2B3C");
    expect(valueOf("Brand").querySelector("rect")?.getAttribute("fill")).toBe(
      "#1A2B3C",
    );
    expect(valueOf("Tone")).toHaveTextContent("4 of 5 (Playful – Serious)");
  });

  it("explains an empty form instead of showing nothing", () => {
    renderView({ blocks: [], emptyText: "Nothing here" });

    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });
});
