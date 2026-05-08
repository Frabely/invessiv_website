export const LeadImportColumnKey = {
  Email: "email",
  FirstName: "first_name",
  LastName: "last_name",
  CompanyName: "company_name",
  Phone: "phone",
  Owner: "owner",
  Notes: "notes",
  ExternalGuid: "external_guid",
  WebsiteUrl: "website_url",
  LinkedinUrl: "linkedin_url",
  InstagramUrl: "instagram_url",
  YoutubeUrl: "youtube_url",
  CategoryId: "category_id",
  Score: "score",
  Status: "status",
  Improvements: "improvements",
} as const;

export type LeadImportColumnKey =
  (typeof LeadImportColumnKey)[keyof typeof LeadImportColumnKey];

export const LEAD_IMPORT_COLUMN_KEY_VALUES = [
  LeadImportColumnKey.Email,
  LeadImportColumnKey.FirstName,
  LeadImportColumnKey.LastName,
  LeadImportColumnKey.CompanyName,
  LeadImportColumnKey.Phone,
  LeadImportColumnKey.Owner,
  LeadImportColumnKey.Notes,
  LeadImportColumnKey.ExternalGuid,
  LeadImportColumnKey.WebsiteUrl,
  LeadImportColumnKey.LinkedinUrl,
  LeadImportColumnKey.InstagramUrl,
  LeadImportColumnKey.YoutubeUrl,
  LeadImportColumnKey.CategoryId,
  LeadImportColumnKey.Score,
  LeadImportColumnKey.Status,
  LeadImportColumnKey.Improvements,
] as const;
