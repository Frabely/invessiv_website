import type { CreateLeadRequestDto } from "@/common/contracts/leads/create-lead-request.dto";
import type { LeadDetailDto } from "@/common/contracts/leads/lead-detail.dto";
import type { LeadFormValues } from "@/common/contracts/leads/forms/lead-form-values";
import { LeadRequestField } from "@/common/constants/leads/lead-request-fields";
import type { UpdateLeadRequestDto } from "@/common/contracts/leads/update-lead-request.dto";

type LeadOptionalRequestFields = Omit<CreateLeadRequestDto, LeadRequestField>;

function toOptionalTrimmedString(value: string): string | undefined {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function buildOptionalLeadRequestFields(
  values: LeadFormValues,
): LeadOptionalRequestFields {
  const fields: LeadOptionalRequestFields = {};

  const firstName = toOptionalTrimmedString(values.first_name);
  const lastName = toOptionalTrimmedString(values.last_name);
  const companyName = toOptionalTrimmedString(values.company_name);
  const phone = toOptionalTrimmedString(values.phone);
  const websiteUrl = toOptionalTrimmedString(values.website_url);
  const categoryId = toOptionalTrimmedString(values.category_id);
  const owner = toOptionalTrimmedString(values.owner);
  const notes = toOptionalTrimmedString(values.notes);
  const scoreValue = values.score.trim();

  const improvements = values.improvements
    .map((item) => item.value.trim())
    .filter((item) => item.length > 0);

  const socialProfiles = values.social_profiles.map((profile) => ({
    platform: profile.platform,
    profile_url: profile.profile_url.trim(),
  }));

  if (firstName) fields.first_name = firstName;
  if (lastName) fields.last_name = lastName;
  if (companyName) fields.company_name = companyName;
  if (phone) fields.phone = phone;
  if (websiteUrl) fields.website_url = websiteUrl;
  if (categoryId) fields.category_id = categoryId;
  if (scoreValue.length > 0) fields.score = Number(scoreValue);
  if (owner) fields.owner = owner;
  if (notes) fields.notes = notes;
  if (improvements.length > 0) fields.improvements = improvements;
  if (socialProfiles.length > 0) fields.social_profiles = socialProfiles;

  return fields;
}

function mapAddLeadFormValuesToCreateLeadRequestDto(
  values: LeadFormValues,
): CreateLeadRequestDto {
  return {
    [LeadRequestField.Email]: values.email.trim(),
    [LeadRequestField.LeadStatus]: values.lead_status,
    ...buildOptionalLeadRequestFields(values),
  };
}

function mapLeadFormValuesToUpdateLeadRequestDto(
  values: LeadFormValues,
): UpdateLeadRequestDto {
  const email = toOptionalTrimmedString(values.email);
  return {
    [LeadRequestField.LeadStatus]: values.lead_status,
    ...(email ? { email } : {}),
    ...buildOptionalLeadRequestFields(values),
  };
}

function mapLeadDetailDtoToLeadFormValues(lead: LeadDetailDto): LeadFormValues {
  function toFormString(value: string | null | undefined): string {
    return value ?? "";
  }

  return {
    first_name: toFormString(lead.firstName),
    last_name: toFormString(lead.lastName),
    company_name: toFormString(lead.companyName),
    email: lead.email,
    phone: toFormString(lead.phone),
    website_url: toFormString(lead.websiteUrl),
    category_id: lead.category?.id ?? "",
    score: lead.score === null ? "" : String(lead.score),
    owner: toFormString(lead.owner),
    notes: toFormString(lead.notes),
    lead_status: lead.leadStatus,
    improvements: (lead.improvements ?? []).map((value) => ({ value })),
    social_profiles: lead.socialProfiles.map((profile) => ({
      platform: profile.platform,
      profile_url: profile.profileUrl,
    })),
  };
}

export const leadMapperService = {
  mapAddLeadFormValuesToCreateLeadRequestDto,
  mapLeadDetailDtoToLeadFormValues,
  mapLeadFormValuesToUpdateLeadRequestDto,
};
