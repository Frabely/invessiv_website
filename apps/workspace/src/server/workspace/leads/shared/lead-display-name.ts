import type { CreateLeadCoreInput } from "@invessiv/common/contracts/leads/create-lead-core-input";
import type { LeadImportRowDto } from "@invessiv/common/contracts/leads/import/lead-import-row.dto";

function trimValue(value: string | null | undefined): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function buildDisplayName(
  companyName: string | undefined,
  firstName: string | undefined,
  lastName: string | undefined,
): string | undefined {
  if (companyName) {
    return companyName;
  }

  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (fullName) {
    return fullName;
  }

  return lastName;
}

export function deriveLeadDisplayName(
  input:
    | Pick<CreateLeadCoreInput, "company_name" | "first_name" | "last_name">
    | Pick<LeadImportRowDto, "companyName" | "firstName" | "lastName">,
): string | undefined {
  if ("company_name" in input) {
    return buildDisplayName(
      trimValue(input.company_name),
      trimValue(input.first_name),
      trimValue(input.last_name),
    );
  }

  const importInput = input as Pick<
    LeadImportRowDto,
    "companyName" | "firstName" | "lastName"
  >;
  return buildDisplayName(
    trimValue(importInput.companyName),
    trimValue(importInput.firstName),
    trimValue(importInput.lastName),
  );
}
