import type { z } from "zod";

export function flattenContactFieldErrors(issues: z.core.$ZodIssue[]) {
  return issues.reduce<Record<string, string[]>>((fieldErrors, issue) => {
    const field = issue.path[0];
    if (typeof field !== "string") {
      return fieldErrors;
    }

    fieldErrors[field] ??= [];
    fieldErrors[field].push(issue.message);
    return fieldErrors;
  }, {});
}
