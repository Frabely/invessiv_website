import type { RefinementCtx } from "zod";
import { CONTACT_OFFER_KEY } from "@/common/constants/contact/contact-offer-keys";
import { CONTACT_VALIDATION_FIELD_ERROR_CODE } from "@/server/contact/validation/shared/contact-validation-field-error-code";

type ProjectRequestValidationShape = {
  customPageNames?: readonly string[];
  goalKey?: string;
  offerKey: string;
  pageKeys?: readonly string[];
  website?: string;
  workflowKey?: string;
};

function hasUniqueValues(values: readonly string[] | undefined) {
  if (!values) {
    return true;
  }

  return new Set(values).size === values.length;
}

export function applyProjectRequestValidationRules(
  value: ProjectRequestValidationShape,
  context: RefinementCtx,
) {
  const requiresWebsite =
    value.offerKey === CONTACT_OFFER_KEY.Upgrade ||
    value.offerKey === CONTACT_OFFER_KEY.Maintenance;

  if (value.offerKey === CONTACT_OFFER_KEY.Landing && !value.goalKey) {
    context.addIssue({
      code: "custom",
      message: CONTACT_VALIDATION_FIELD_ERROR_CODE.GoalRequired,
      path: ["goalKey"],
    });
  }

  if (value.offerKey === CONTACT_OFFER_KEY.Process && !value.workflowKey) {
    context.addIssue({
      code: "custom",
      message: CONTACT_VALIDATION_FIELD_ERROR_CODE.WorkflowRequired,
      path: ["workflowKey"],
    });
  }

  if (value.offerKey === CONTACT_OFFER_KEY.Web) {
    const hasPages = Boolean(
      value.pageKeys?.length || value.customPageNames?.length,
    );
    if (!hasPages) {
      context.addIssue({
        code: "custom",
        message: CONTACT_VALIDATION_FIELD_ERROR_CODE.PagesRequired,
        path: ["pageKeys"],
      });
    }
  }

  if (!hasUniqueValues(value.pageKeys)) {
    context.addIssue({
      code: "custom",
      message: CONTACT_VALIDATION_FIELD_ERROR_CODE.DuplicatePageKeys,
      path: ["pageKeys"],
    });
  }

  if (!hasUniqueValues(value.customPageNames)) {
    context.addIssue({
      code: "custom",
      message: CONTACT_VALIDATION_FIELD_ERROR_CODE.DuplicateCustomPageNames,
      path: ["customPageNames"],
    });
  }

  if (requiresWebsite && !value.website) {
    context.addIssue({
      code: "custom",
      message: CONTACT_VALIDATION_FIELD_ERROR_CODE.WebsiteRequired,
      path: ["website"],
    });
  }
}
