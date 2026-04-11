import type { RefinementCtx } from "zod";

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
  const requiresWebsite = ["upgrade", "maintenance"].includes(value.offerKey);

  if (value.offerKey === "landing" && !value.goalKey) {
    context.addIssue({
      code: "custom",
      message: "goal_required",
      path: ["goalKey"],
    });
  }

  if (value.offerKey === "process" && !value.workflowKey) {
    context.addIssue({
      code: "custom",
      message: "workflow_required",
      path: ["workflowKey"],
    });
  }

  if (value.offerKey === "web") {
    const hasPages = Boolean(
      value.pageKeys?.length || value.customPageNames?.length,
    );
    if (!hasPages) {
      context.addIssue({
        code: "custom",
        message: "pages_required",
        path: ["pageKeys"],
      });
    }
  }

  if (!hasUniqueValues(value.pageKeys)) {
    context.addIssue({
      code: "custom",
      message: "duplicate_page_keys",
      path: ["pageKeys"],
    });
  }

  if (!hasUniqueValues(value.customPageNames)) {
    context.addIssue({
      code: "custom",
      message: "duplicate_custom_page_names",
      path: ["customPageNames"],
    });
  }

  if (requiresWebsite && !value.website) {
    context.addIssue({
      code: "custom",
      message: "website_required",
      path: ["website"],
    });
  }
}
