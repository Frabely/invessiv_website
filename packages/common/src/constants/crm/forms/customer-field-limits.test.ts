import { describe, expect, it } from "vitest";

import { CustomerFieldLimits } from "@invessiv/common/constants/crm/forms/customer-field-limits";

describe("CustomerFieldLimits", () => {
  it("contains the exact limits", () => {
    expect(CustomerFieldLimits).toEqual({
      DisplayNameMaxLength: 200,
      CompanyNameMaxLength: 200,
      StreetMaxLength: 200,
      PostalCodeMaxLength: 20,
      CityMaxLength: 120,
      CountryMaxLength: 120,
      WebsiteUrlMaxLength: 2048,
      VatIdMaxLength: 64,
      NotesMaxLength: 20_000,
      HourlyRateCentsMax: 10_000_000,
      PersonNameMaxLength: 120,
      EmailMaxLength: 254,
      PhoneMaxLength: 40,
      RoleLabelMaxLength: 120,
    });
  });

  it("keeps the hourly rate within a signed 32-bit integer column", () => {
    expect(CustomerFieldLimits.HourlyRateCentsMax).toBeLessThan(2 ** 31);
  });
});
