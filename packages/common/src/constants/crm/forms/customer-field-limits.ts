/** Shared by the server schema and the dialog's `maxLength`, so both reject the same input. */
export const CustomerFieldLimits = {
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
} as const;

export type CustomerFieldLimit =
  (typeof CustomerFieldLimits)[keyof typeof CustomerFieldLimits];
