import { describe, expect, it, vi } from "vitest";

import { OnboardingBlockReviewStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-block-review-statuses";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import type { FileRow } from "@/server/shared/files/file-object-service-types";
import { onboardingFormMappingService } from "@/server/shared/services/onboarding/onboarding-form-mapping-service";
import type {
  OnboardingFormParts,
  OnboardingFormRow,
} from "@/server/shared/services/onboarding/onboarding-form-types";
import { blockFixture } from "@/server/tests/workspace/crm/support/questionnaire-definition-fixtures";

vi.mock("server-only", () => ({}));

const NOW = new Date("2026-10-01T08:00:00.000Z");

function formRow(
  overrides: Partial<OnboardingFormRow> = {},
): OnboardingFormRow {
  return {
    id: "form-1",
    customer_id: "customer-1",
    project_id: "project-1",
    source_template_id: null,
    status: OnboardingFormStatus.Draft,
    created_by_member_id: "member-1",
    released_at: null,
    released_by_member_id: null,
    submitted_at: null,
    submitted_by_portal_membership_id: null,
    services_confirmed_at: null,
    services_confirmed_by_portal_membership_id: null,
    services_note: null,
    call_held_on: null,
    completed_at: null,
    completed_by_member_id: null,
    version: 3,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function parts(
  overrides: Partial<OnboardingFormParts> = {},
): OnboardingFormParts {
  return {
    form: formRow(),
    steps: [],
    blocks: [],
    answers: [],
    groupEntries: [],
    answerFiles: [],
    services: [],
    ...overrides,
  };
}

describe("onboardingFormMappingService.toFormDto", () => {
  it("maps an empty draft with null for everything that has not happened yet", () => {
    expect(onboardingFormMappingService.toFormDto(parts())).toEqual({
      id: "form-1",
      customerId: "customer-1",
      projectId: "project-1",
      sourceTemplateId: null,
      status: OnboardingFormStatus.Draft,
      createdByMemberId: "member-1",
      releasedAt: null,
      releasedByMemberId: null,
      submittedAt: null,
      submittedByPortalMembershipId: null,
      servicesConfirmedAt: null,
      servicesConfirmedByPortalMembershipId: null,
      servicesNote: null,
      callHeldOn: null,
      completedAt: null,
      completedByMemberId: null,
      blocks: [],
      answers: [],
      answerFiles: [],
      groupEntries: [],
      services: [],
      version: 3,
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    });
  });

  it("maps every head column of a completed form", () => {
    const dto = onboardingFormMappingService.toFormDto(
      parts({
        form: formRow({
          source_template_id: "template-1",
          status: OnboardingFormStatus.Completed,
          released_at: NOW,
          released_by_member_id: "member-2",
          submitted_at: NOW,
          submitted_by_portal_membership_id: "membership-1",
          services_confirmed_at: NOW,
          services_confirmed_by_portal_membership_id: "membership-1",
          services_note: "Bitte ohne Blog",
          call_held_on: "2026-09-30",
          completed_at: NOW,
          completed_by_member_id: "member-3",
        }),
      }),
    );
    expect(dto).toMatchObject({
      sourceTemplateId: "template-1",
      releasedAt: NOW.toISOString(),
      releasedByMemberId: "member-2",
      submittedAt: NOW.toISOString(),
      submittedByPortalMembershipId: "membership-1",
      servicesConfirmedAt: NOW.toISOString(),
      servicesConfirmedByPortalMembershipId: "membership-1",
      servicesNote: "Bitte ohne Blog",
      callHeldOn: "2026-09-30",
      completedAt: NOW.toISOString(),
      completedByMemberId: "member-3",
    });
  });

  it("orders the steps by position and joins each with its block copy", () => {
    const first = blockFixture([], { id: "block-a", key: "first" });
    const second = blockFixture([], { id: "block-b", key: "second" });
    const step = (blockId: string, position: number) => ({
      form_id: "form-1",
      block_id: blockId,
      position,
      review_status: OnboardingBlockReviewStatus.Pending,
      clarification_mode: null,
      review_note: null,
      reviewed_by_member_id: null,
      reviewed_at: null,
      version: 1,
    });

    const dto = onboardingFormMappingService.toFormDto(
      parts({
        steps: [step("block-b", 1), step("block-a", 0)],
        blocks: [second, first],
      }),
    );

    expect(dto.blocks).toEqual([
      {
        position: 0,
        reviewStatus: OnboardingBlockReviewStatus.Pending,
        clarificationMode: null,
        reviewNote: null,
        reviewedByMemberId: null,
        reviewedAt: null,
        version: 1,
        block: first,
      },
      expect.objectContaining({ position: 1, block: second }),
    ]);
  });

  it("maps answers, group entries, file links and services", () => {
    const file = {
      id: "file-1",
      display_name: "Logo",
      asset_kind: AssetKind.Link,
      source: FileSource.Link,
      extension: null,
      size_bytes: null,
      url: "https://example.com/logo",
      note: null,
      created_at: NOW,
    } as FileRow;

    const dto = onboardingFormMappingService.toFormDto(
      parts({
        answers: [
          {
            id: "answer-1",
            form_id: "form-1",
            field_id: "field-1",
            group_entry_id: "entry-1",
            choice_id: null,
            value: "Anna",
            sort_order: 0,
            updated_by_portal_membership_id: null,
            updated_by_member_id: "member-1",
            created_at: NOW,
            updated_at: NOW,
          },
        ],
        groupEntries: [
          {
            id: "entry-1",
            form_id: "form-1",
            field_id: "field-group",
            position: 2,
            created_at: NOW,
            updated_at: NOW,
          },
        ],
        answerFiles: [
          {
            link: {
              id: "link-1",
              form_id: "form-1",
              field_id: "field-files",
              group_entry_id: null,
              file_id: "file-1",
              position: 1,
              created_at: NOW,
            },
            file,
          },
        ],
        services: [
          {
            projectLineItemId: "item-1",
            title: "Landingpage",
            description: null,
            position: 0,
          },
        ],
      }),
    );

    expect(dto.answers).toEqual([
      {
        fieldId: "field-1",
        groupEntryId: "entry-1",
        sortOrder: 0,
        value: "Anna",
        choiceId: null,
      },
    ]);
    expect(dto.groupEntries).toEqual([
      { id: "entry-1", fieldId: "field-group", position: 2 },
    ]);
    expect(dto.answerFiles).toEqual([
      {
        fieldId: "field-files",
        groupEntryId: null,
        position: 1,
        file: {
          id: "file-1",
          displayName: "Logo",
          assetKind: AssetKind.Link,
          source: FileSource.Link,
          extension: null,
          sizeBytes: null,
          url: "https://example.com/logo",
          note: null,
          createdAt: NOW.toISOString(),
        },
      },
    ]);
    expect(dto.services).toEqual([
      {
        projectLineItemId: "item-1",
        title: "Landingpage",
        description: null,
        position: 0,
      },
    ]);
  });
});

describe("onboardingFormMappingService.toServiceDto", () => {
  it("turns an empty description into null and takes the given position", () => {
    expect(
      onboardingFormMappingService.toServiceDto(
        { projectLineItemId: "item-1", title: "SEO", description: "  " },
        4,
      ),
    ).toEqual({
      projectLineItemId: "item-1",
      title: "SEO",
      description: null,
      position: 4,
    });
  });
});

describe("onboardingFormMappingService.toSummaryDto", () => {
  it("carries the progress and the status timestamps", () => {
    const progress = { answeredRequired: 2, totalRequired: 4, ratio: 0.5 };
    expect(
      onboardingFormMappingService.toSummaryDto(
        formRow({
          status: OnboardingFormStatus.Submitted,
          released_at: NOW,
          released_by_member_id: "member-1",
          submitted_at: NOW,
        }),
        progress,
      ),
    ).toEqual({
      id: "form-1",
      status: OnboardingFormStatus.Submitted,
      progress,
      submittedAt: NOW.toISOString(),
      completedAt: null,
    });
  });
});
