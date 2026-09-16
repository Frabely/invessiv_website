import { describe, expect, it } from "vitest";

import {
  CUSTOMER_FORM_DIALOG_MODE_VALUES,
  CustomerFormDialogMode,
} from "@/common/constants/crm/forms/customer-form-dialog-modes";

describe("CustomerFormDialogMode", () => {
  it("contains the exact modes without duplicates", () => {
    expect(CUSTOMER_FORM_DIALOG_MODE_VALUES).toEqual(["create", "edit"]);
    expect(CUSTOMER_FORM_DIALOG_MODE_VALUES).toEqual(
      Object.values(CustomerFormDialogMode),
    );
    expect(new Set(CUSTOMER_FORM_DIALOG_MODE_VALUES).size).toBe(
      CUSTOMER_FORM_DIALOG_MODE_VALUES.length,
    );
  });
});
