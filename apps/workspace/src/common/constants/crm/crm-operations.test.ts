import { describe, expect, it } from "vitest";

import {
  CRM_OPERATION_VALUES,
  CrmOperation,
} from "@/common/constants/crm/crm-operations";

describe("CrmOperation", () => {
  it("contains the exact operations without duplicates", () => {
    expect(CRM_OPERATION_VALUES).toEqual([
      "leads.convert",
      "customers.list",
      "customers.create",
      "customers.get",
      "customers.update",
      "project-line-items.list",
      "project-line-items.create",
      "project-line-items.update",
      "line-item-templates.list",
      "line-item-templates.create",
      "line-item-templates.update",
      "questionnaire-blocks.list",
      "questionnaire-blocks.get",
      "questionnaire-blocks.create",
      "questionnaire-blocks.update",
      "questionnaire-blocks.delete",
      "questionnaire-blocks.duplicate",
      "questionnaire-fields.create",
      "questionnaire-fields.update",
      "questionnaire-fields.delete",
      "questionnaire-fields.move",
      "questionnaire-templates.list",
      "questionnaire-templates.get",
      "questionnaire-templates.create",
      "questionnaire-templates.update",
      "tasks.list",
      "tasks.create",
      "tasks.update",
      "tasks.change-status",
      "conversations.get",
      "conversations.count-unread",
      "conversations.mark-read",
      "conversations.update-owner",
      "messages.send",
      "messages.redact",
      "portal-conversations.get",
      "portal-conversations.mark-read",
      "portal-messages.send",
      "feedback-rounds.list",
      "feedback-rounds.hand-over",
      "feedback-rounds.get",
      "feedback-rounds.change-status",
      "feedback-items.set-result",
      "feedback-rounds.list-inbox",
      "feedback-rounds.count-unread",
      "feedback-rounds.mark-read",
    ]);
    expect(CRM_OPERATION_VALUES).toEqual(Object.values(CrmOperation));
    expect(new Set(CRM_OPERATION_VALUES).size).toBe(
      CRM_OPERATION_VALUES.length,
    );
  });
});
