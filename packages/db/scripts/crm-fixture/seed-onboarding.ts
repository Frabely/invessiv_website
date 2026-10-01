import { randomUUID } from "node:crypto";
import { OnboardingBlockReviewStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-block-review-statuses";
import { QuestionnaireCatalogStatus } from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { QuestionnairePrefillSource } from "@invessiv/common/constants/crm/questionnaire/questionnaire-prefill-sources";
import { QuestionnaireYesNoChoiceKey } from "@invessiv/common/constants/crm/questionnaire/questionnaire-yes-no-choice-keys";
import { Locale } from "@invessiv/common/contracts/i18n/locale";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  onboardingAnswers,
  questionnaireBlocks,
  questionnaireBlockTranslations,
  questionnaireChoiceTranslations,
  questionnaireFieldChoices,
  questionnaireFields,
  questionnaireFieldTranslations,
  onboardingFormBlocks,
  onboardingForms,
  onboardingGroupEntries,
} from "@invessiv/db/record-configuration";

type QuestionnaireFixtureInput = {
  memberId: string;
  customerId: string;
  projectId: string;
  membershipId: string;
};

type FieldSpec = {
  key: string;
  type: (typeof questionnaireFields.$inferInsert)["type"];
  requirement?: (typeof questionnaireFields.$inferInsert)["requirement"];
  labels: Record<Locale, string>;
  prefillSource?: (typeof questionnaireFields.$inferInsert)["prefill_source"];
};

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

type SeededField = {
  row: typeof questionnaireFields.$inferInsert & { id: string };
  labels: Record<Locale, string>;
};

function fieldRow(
  blockId: string,
  spec: FieldSpec,
  position: number,
  extra: Partial<typeof questionnaireFields.$inferInsert> = {},
): SeededField {
  const row = {
    id: randomUUID(),
    block_id: blockId,
    parent_field_id: null,
    key: spec.key,
    position,
    type: spec.type,
    requirement: spec.requirement ?? QuestionnaireFieldRequirement.Required,
    max_length: null,
    min_items: null,
    max_items: null,
    accepted_asset_kinds: null,
    prefill_source: spec.prefillSource ?? null,
    condition_field_id: null,
    condition_choice_id: null,
    version: 1,
    ...extra,
  };
  return { row, labels: spec.labels };
}

function fieldTranslations({ row, labels }: SeededField) {
  return Object.entries(labels).map(([locale, label]) => ({
    field_id: row.id,
    locale: locale as Locale,
    label,
    help: null,
  }));
}

/**
 * One released form on the running project: company block half answered (with a met condition),
 * a team group with one entry, and the service confirmation still open. The form hangs on the
 * project, so the caller's project cleanup removes it through the cascade.
 */
export async function seedOnboarding(
  tx: ContactDatabaseTransaction,
  { memberId, customerId, projectId, membershipId }: QuestionnaireFixtureInput,
) {
  const formId = randomUUID();
  await tx.insert(onboardingForms).values({
    id: formId,
    customer_id: customerId,
    project_id: projectId,
    source_template_id: null,
    status: OnboardingFormStatus.Open,
    created_by_member_id: memberId,
    released_at: daysAgo(4),
    released_by_member_id: memberId,
    submitted_at: null,
    submitted_by_portal_membership_id: null,
    services_confirmed_at: null,
    services_confirmed_by_portal_membership_id: null,
    services_note: null,
    call_held_on: null,
    completed_at: null,
    completed_by_member_id: null,
    version: 1,
  });

  const blocks = [
    {
      key: "company_profile",
      carryOver: true,
      titles: { de: "Unternehmen", en: "Company" },
    },
    { key: "team", carryOver: true, titles: { de: "Team", en: "Team" } },
    {
      key: "booked_services",
      carryOver: false,
      titles: { de: "Gebuchte Leistungen", en: "Booked services" },
    },
  ].map((block) => ({ ...block, id: randomUUID() }));
  await tx.insert(questionnaireBlocks).values(
    blocks.map((block) => ({
      id: block.id,
      owner_form_id: formId,
      source_block_id: null,
      key: block.key,
      carry_over: block.carryOver,
      status: QuestionnaireCatalogStatus.Active,
      version: 1,
    })),
  );
  await tx.insert(questionnaireBlockTranslations).values(
    blocks.flatMap((block) =>
      Object.entries(block.titles).map(([locale, title]) => ({
        block_id: block.id,
        locale: locale as Locale,
        title,
        intro: null,
      })),
    ),
  );
  await tx.insert(onboardingFormBlocks).values(
    blocks.map((block, position) => ({
      form_id: formId,
      block_id: block.id,
      position,
      review_status: OnboardingBlockReviewStatus.Pending,
      clarification_mode: null,
      review_note: null,
      reviewed_by_member_id: null,
      reviewed_at: null,
      version: 1,
    })),
  );
  const [company, team, services] = blocks as [
    (typeof blocks)[number],
    (typeof blocks)[number],
    (typeof blocks)[number],
  ];

  const companyName = fieldRow(
    company.id,
    {
      key: "company_name",
      type: QuestionnaireFieldType.ShortText,
      labels: { de: "Firmenname", en: "Company name" },
      prefillSource: QuestionnairePrefillSource.CustomerCompanyName,
    },
    0,
  );
  const hasShop = fieldRow(
    company.id,
    {
      key: "has_shop",
      type: QuestionnaireFieldType.YesNo,
      labels: {
        de: "Betreibt ihr einen Onlineshop?",
        en: "Do you run an online shop?",
      },
    },
    1,
  );
  const yesChoiceId = randomUUID();
  const noChoiceId = randomUUID();
  const shopUrl = fieldRow(
    company.id,
    {
      key: "shop_url",
      type: QuestionnaireFieldType.Url,
      labels: { de: "Adresse des Shops", en: "Shop address" },
    },
    2,
    { condition_field_id: hasShop.row.id, condition_choice_id: yesChoiceId },
  );
  const teamGroup = fieldRow(
    team.id,
    {
      key: "team_members",
      type: QuestionnaireFieldType.Group,
      requirement: QuestionnaireFieldRequirement.Optional,
      labels: { de: "Teammitglieder", en: "Team members" },
    },
    0,
    { max_items: 20 },
  );
  const memberName = fieldRow(
    team.id,
    {
      key: "member_name",
      type: QuestionnaireFieldType.ShortText,
      labels: { de: "Name", en: "Name" },
    },
    0,
    { parent_field_id: teamGroup.row.id },
  );
  const memberRole = fieldRow(
    team.id,
    {
      key: "member_role",
      type: QuestionnaireFieldType.ShortText,
      requirement: QuestionnaireFieldRequirement.Optional,
      labels: { de: "Funktion", en: "Role" },
    },
    1,
    { parent_field_id: teamGroup.row.id },
  );
  const servicesField = fieldRow(
    services.id,
    {
      key: "services_confirmation",
      type: QuestionnaireFieldType.ProjectServices,
      labels: {
        de: "Passen die gebuchten Leistungen?",
        en: "Do the booked services fit?",
      },
    },
    0,
  );

  // The condition references a choice of has_shop, so the fields go in before their choices and
  // the dependent field only after both exist.
  await tx
    .insert(questionnaireFields)
    .values([companyName, hasShop, teamGroup, servicesField].map((f) => f.row));
  await tx.insert(questionnaireFieldChoices).values([
    {
      id: yesChoiceId,
      field_id: hasShop.row.id,
      key: QuestionnaireYesNoChoiceKey.Yes,
      position: 0,
      version: 1,
    },
    {
      id: noChoiceId,
      field_id: hasShop.row.id,
      key: QuestionnaireYesNoChoiceKey.No,
      position: 1,
      version: 1,
    },
  ]);
  await tx
    .insert(questionnaireFields)
    .values([shopUrl, memberName, memberRole].map((f) => f.row));
  await tx.insert(questionnaireChoiceTranslations).values([
    { choice_id: yesChoiceId, locale: Locale.De, label: "Ja" },
    { choice_id: yesChoiceId, locale: Locale.En, label: "Yes" },
    { choice_id: noChoiceId, locale: Locale.De, label: "Nein" },
    { choice_id: noChoiceId, locale: Locale.En, label: "No" },
  ]);
  await tx
    .insert(questionnaireFieldTranslations)
    .values(
      [
        companyName,
        hasShop,
        shopUrl,
        teamGroup,
        memberName,
        memberRole,
        servicesField,
      ].flatMap(fieldTranslations),
    );

  const entryId = randomUUID();
  await tx.insert(onboardingGroupEntries).values({
    id: entryId,
    form_id: formId,
    field_id: teamGroup.row.id,
    position: 0,
  });
  const answerBase = {
    form_id: formId,
    sort_order: 0,
    updated_by_portal_membership_id: membershipId,
    updated_by_member_id: null,
  };
  await tx.insert(onboardingAnswers).values([
    {
      ...answerBase,
      id: randomUUID(),
      field_id: companyName.row.id,
      group_entry_id: null,
      choice_id: null,
      value: "Nordlicht Design GmbH",
    },
    {
      ...answerBase,
      id: randomUUID(),
      field_id: hasShop.row.id,
      group_entry_id: null,
      choice_id: yesChoiceId,
      value: null,
    },
    {
      ...answerBase,
      id: randomUUID(),
      field_id: memberName.row.id,
      group_entry_id: entryId,
      choice_id: null,
      value: "Jana Nordmann",
    },
  ]);
}
