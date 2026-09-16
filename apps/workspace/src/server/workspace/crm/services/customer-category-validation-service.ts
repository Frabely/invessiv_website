import "server-only";

import type { z } from "zod";

const CATEGORY_ID_PATH = ["categoryId"] as const;
const UNKNOWN_OR_INACTIVE_CATEGORY_MESSAGE = "Unknown or inactive category";

function createUnknownOrInactiveCategoryIssue(
  categoryId: string,
): z.core.$ZodIssueCustom {
  return {
    code: "custom",
    input: categoryId,
    message: UNKNOWN_OR_INACTIVE_CATEGORY_MESSAGE,
    path: [...CATEGORY_ID_PATH],
  };
}

export const customerCategoryValidationService = {
  createUnknownOrInactiveCategoryIssue,
} as const;
