import { describe, expect, it } from "vitest";

import {
  CUSTOMER_FORM_VALIDATION_CODE_VALUES,
  CustomerFormValidationCode,
} from "@/common/constants/crm/forms/customer-form-validation-codes";
import formDe from "@/i18n/dictionaries/workspace/crm/form/de.json";
import formEn from "@/i18n/dictionaries/workspace/crm/form/en.json";

describe("CustomerFormValidationCode", () => {
  it("contains the exact codes without duplicates", () => {
    expect(CUSTOMER_FORM_VALIDATION_CODE_VALUES).toEqual([
      "displayNameRequired",
      "contactRequired",
      "emailInvalid",
      "phoneInvalid",
      "urlInvalid",
      "hourlyRateInvalid",
    ]);
    expect(CUSTOMER_FORM_VALIDATION_CODE_VALUES).toEqual(
      Object.values(CustomerFormValidationCode),
    );
    expect(new Set(CUSTOMER_FORM_VALIDATION_CODE_VALUES).size).toBe(
      CUSTOMER_FORM_VALIDATION_CODE_VALUES.length,
    );
  });

  it("has a message in every form dictionary", () => {
    for (const dictionary of [formDe, formEn]) {
      for (const code of CUSTOMER_FORM_VALIDATION_CODE_VALUES) {
        expect(dictionary.validation[code]).toEqual(expect.any(String));
      }
    }
  });
});
