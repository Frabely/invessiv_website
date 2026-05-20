import { z } from "zod";
import { CONTACT_LEAD_STATUS_VALUES } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { LeadFieldLimits } from "@invessiv/common/constants/leads/forms/lead-field-limits";
import {
  LeadAddLeadFormFieldPath,
  LeadValidationMessageCode,
  LeadZodIssueCode,
} from "@invessiv/common/constants/leads/forms/lead-form-validation";
import { LEAD_SOCIAL_PLATFORMS_VALUES } from "@invessiv/common/constants/leads/social/lead-social-platforms";
import { isValidContactPhone } from "@invessiv/common/patterns/contact/contact-phone";

const EMAIL_PATTERN = z.string().trim().pipe(z.email());
const URL_PATTERN = z.string().trim().pipe(z.url());
const UUID_PATTERN = z.string().trim().pipe(z.uuid());

const optionalTrimmedString = (max: number) => z.string().trim().max(max);

const socialProfileSchema = z.object({
  platform: z
    .string()
    .trim()
    .pipe(
      z.enum(LEAD_SOCIAL_PLATFORMS_VALUES, {
        message: LeadValidationMessageCode.SocialProfileInvalid,
      }),
    ),
  profile_url: z.string().trim(),
});

export const leadFormSchema = z
  .object({
    displayName: z.string().trim(),
    first_name: optionalTrimmedString(LeadFieldLimits.NameMaxLength),
    last_name: optionalTrimmedString(LeadFieldLimits.NameMaxLength),
    company_name: optionalTrimmedString(LeadFieldLimits.NameMaxLength),
    email: z.string().trim(),
    phone: z
      .string()
      .trim()
      .refine((value) => value.length === 0 || isValidContactPhone(value), {
        message: LeadValidationMessageCode.PhoneInvalid,
      }),
    website_url: optionalTrimmedString(
      LeadFieldLimits.WebsiteUrlMaxLength,
    ).refine(
      (value) => value.length === 0 || URL_PATTERN.safeParse(value).success,
      {
        message: LeadValidationMessageCode.UrlInvalid,
      },
    ),
    category_id: optionalTrimmedString(
      LeadFieldLimits.CategoryIdStringLength,
    ).refine(
      (value) => value.length === 0 || UUID_PATTERN.safeParse(value).success,
      {
        message: LeadValidationMessageCode.CategoryInvalid,
      },
    ),
    score: z
      .string()
      .trim()
      .refine(
        (value) => {
          if (value.length === 0) {
            return true;
          }

          const parsed = Number(value);
          return (
            Number.isInteger(parsed) &&
            parsed >= LeadFieldLimits.ScoreMin &&
            parsed <= LeadFieldLimits.ScoreMax
          );
        },
        {
          message: LeadValidationMessageCode.ScoreInvalid,
        },
      ),
    owner: optionalTrimmedString(LeadFieldLimits.OwnerMaxLength),
    notes: optionalTrimmedString(LeadFieldLimits.NotesMaxLength),
    lead_status: z.enum(CONTACT_LEAD_STATUS_VALUES),
    improvements: z.array(
      z.object({
        value: z
          .string()
          .trim()
          .min(1, {
            message: LeadValidationMessageCode.ImprovementRequired,
          })
          .max(LeadFieldLimits.ImprovementMaxLength),
      }),
    ),
    social_profiles: z.array(socialProfileSchema),
  })
  .superRefine((data, context) => {
    if (!data.displayName.trim()) {
      context.addIssue({
        code: LeadZodIssueCode.Custom,
        message: LeadValidationMessageCode.DisplayNameRequired,
        path: LeadAddLeadFormFieldPath.DisplayName(),
      });
    }

    if (
      data.email.trim().length > 0 &&
      !EMAIL_PATTERN.safeParse(data.email).success
    ) {
      context.addIssue({
        code: LeadZodIssueCode.Custom,
        message: LeadValidationMessageCode.EmailInvalid,
        path: LeadAddLeadFormFieldPath.Email(),
      });
    }

    if (
      data.website_url.trim() &&
      !URL_PATTERN.safeParse(data.website_url).success
    ) {
      context.addIssue({
        code: LeadZodIssueCode.Custom,
        message: LeadValidationMessageCode.UrlInvalid,
        path: LeadAddLeadFormFieldPath.WebsiteUrl(),
      });
    }

    if (
      data.category_id.trim() &&
      !UUID_PATTERN.safeParse(data.category_id).success
    ) {
      context.addIssue({
        code: LeadZodIssueCode.Custom,
        message: LeadValidationMessageCode.CategoryInvalid,
        path: LeadAddLeadFormFieldPath.CategoryId(),
      });
    }

    if (data.score.trim().length > 0) {
      const parsedScore = Number(data.score);

      if (
        !Number.isInteger(parsedScore) ||
        parsedScore < LeadFieldLimits.ScoreMin ||
        parsedScore > LeadFieldLimits.ScoreMax
      ) {
        context.addIssue({
          code: LeadZodIssueCode.Custom,
          message: LeadValidationMessageCode.ScoreInvalid,
          path: LeadAddLeadFormFieldPath.Score(),
        });
      }
    }

    for (const [index, profile] of data.social_profiles.entries()) {
      const profileUrl = profile.profile_url.trim();

      if (!profileUrl) {
        context.addIssue({
          code: LeadZodIssueCode.Custom,
          message: LeadValidationMessageCode.SocialProfileRequired,
          path: LeadAddLeadFormFieldPath.SocialProfileProfileUrl(index),
        });
      } else if (!URL_PATTERN.safeParse(profileUrl).success) {
        context.addIssue({
          code: LeadZodIssueCode.Custom,
          message: LeadValidationMessageCode.UrlInvalid,
          path: LeadAddLeadFormFieldPath.SocialProfileProfileUrl(index),
        });
      }
    }
  });
