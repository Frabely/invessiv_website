import { describe, expect, it } from "vitest";

import { OnboardingBlockReviewStatus as S } from "@invessiv/common/constants/crm/onboarding/onboarding-block-review-statuses";
import { OnboardingClarificationMode as M } from "@invessiv/common/constants/crm/onboarding/onboarding-clarification-modes";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import {
  buildOnboardingCallAgenda,
  formatOnboardingCallAgenda,
  isOnboardingCallAgendaEmpty,
} from "./onboarding-call-agenda";

type Step = OnboardingFormDto["blocks"][number];

function step(id: string, title: string, review: Partial<Step> = {}): Step {
  return {
    position: 0,
    reviewStatus: S.Pending,
    clarificationMode: null,
    reviewNote: null,
    reviewedByMemberId: null,
    reviewedAt: null,
    version: 1,
    block: {
      id,
      key: id,
      translations: { de: { title, intro: null } },
    } as Step["block"],
    ...review,
  };
}

function form(overrides: Partial<OnboardingFormDto>): OnboardingFormDto {
  return {
    blocks: [],
    servicesChangedSinceConfirmation: false,
    servicesNote: null,
    ...overrides,
  } as OnboardingFormDto;
}

const TEXTS = {
  textHeading: "Agenda Onboarding-Call: {project}",
  servicesChanged: "Leistungen geändert",
  servicesNote: "Anmerkung des Kunden",
};

describe("buildOnboardingCallAgenda", () => {
  it("takes only the questions for the call, in form order", () => {
    const agenda = buildOnboardingCallAgenda(
      form({
        blocks: [
          step("a", "Unternehmen", {
            reviewStatus: S.Clarification,
            clarificationMode: M.Call,
            reviewNote: "Zielgruppe besprechen",
          }),
          step("b", "Marke", {
            reviewStatus: S.Clarification,
            clarificationMode: M.Customer,
            reviewNote: "Logo fehlt",
          }),
          step("c", "Kontakt", { reviewStatus: S.Complete }),
          step("d", "Technik", {
            reviewStatus: S.Clarification,
            clarificationMode: M.Call,
            reviewNote: "Domain-Umzug",
          }),
        ],
      }),
      "de",
    );

    expect(agenda).toEqual({
      points: [
        { blockId: "a", title: "Unternehmen", note: "Zielgruppe besprechen" },
        { blockId: "d", title: "Technik", note: "Domain-Umzug" },
      ],
      servicesChanged: false,
      servicesNote: null,
    });
    expect(isOnboardingCallAgendaEmpty(agenda)).toBe(false);
  });

  it("adds the service hints and is empty without any of the three", () => {
    expect(
      isOnboardingCallAgendaEmpty(buildOnboardingCallAgenda(form({}), "de")),
    ).toBe(true);

    const agenda = buildOnboardingCallAgenda(
      form({
        servicesChangedSinceConfirmation: true,
        servicesNote: "Bitte ohne Blog",
      }),
      "de",
    );
    expect(agenda).toMatchObject({
      points: [],
      servicesChanged: true,
      servicesNote: "Bitte ohne Blog",
    });
    expect(isOnboardingCallAgendaEmpty(agenda)).toBe(false);
  });
});

describe("formatOnboardingCallAgenda", () => {
  it("yields plain text with one line per item", () => {
    expect(
      formatOnboardingCallAgenda(
        {
          points: [
            {
              blockId: "a",
              title: "Unternehmen",
              note: "Zielgruppe\nbesprechen",
            },
          ],
          servicesChanged: true,
          servicesNote: "Bitte ohne Blog",
        },
        "Website <b>Acme</b>",
        TEXTS,
      ),
    ).toBe(
      [
        "Agenda Onboarding-Call: Website <b>Acme</b>",
        "",
        "- Unternehmen: Zielgruppe besprechen",
        "- Leistungen geändert",
        "- Anmerkung des Kunden: Bitte ohne Blog",
      ].join("\n"),
    );
  });
});
