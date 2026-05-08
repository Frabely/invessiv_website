import type { CreateLeadRequestDto } from "@/common/contracts/leads/create-lead-request.dto";
import type { AddLeadFormValues } from "@/common/contracts/leads/forms/add-lead-form-values";

function toOptionalTrimmedString(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

export function mapAddLeadFormValuesToCreateLeadRequestDto(
  values: AddLeadFormValues,
): CreateLeadRequestDto {
  const scoreValue = values.score.trim();
  const improvements = values.improvements
    .map((item) => item.value.trim())
    .filter((item) => item.length > 0);
  const socialProfiles = values.social_profiles.map((profile) => ({
    platform: profile.platform,
    profile_url: profile.profile_url.trim(),
  }));

  const request: CreateLeadRequestDto = {
    email: values.email.trim(),
  };

  const firstName = toOptionalTrimmedString(values.first_name);
  const lastName = toOptionalTrimmedString(values.last_name);
  const companyName = toOptionalTrimmedString(values.company_name);
  const phone = toOptionalTrimmedString(values.phone);
  const websiteUrl = toOptionalTrimmedString(values.website_url);
  const categoryId = toOptionalTrimmedString(values.category_id);
  const owner = toOptionalTrimmedString(values.owner);
  const notes = toOptionalTrimmedString(values.notes);

  if (firstName) {
    request.first_name = firstName;
  }

  if (lastName) {
    request.last_name = lastName;
  }

  if (companyName) {
    request.company_name = companyName;
  }

  if (phone) {
    request.phone = phone;
  }

  if (websiteUrl) {
    request.website_url = websiteUrl;
  }

  if (categoryId) {
    request.category_id = categoryId;
  }

  if (scoreValue.length > 0) {
    request.score = Number(scoreValue);
  }

  if (owner) {
    request.owner = owner;
  }

  if (notes) {
    request.notes = notes;
  }

  if (improvements.length > 0) {
    request.improvements = improvements;
  }

  if (socialProfiles.length > 0) {
    request.social_profiles = socialProfiles;
  }

  return request;
}
