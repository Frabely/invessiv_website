import { LeadImportColumnKey } from "@/common/constants/leads/import/columns/lead-import-column-keys";
import type { LeadImportRowIssueDto } from "@/common/contracts/leads";
import { normalizeLeadProfileUrl } from "@/server/workspace/leads/shared/lead-url-normalization-service";
import { leadUrlSchema } from "@/server/workspace/leads/shared/lead-validation-core";
import { LeadImportRowIssueCode } from "@/common/constants/leads/import/issues/lead-import-row-issue-codes";
import { LeadImportRowIssueSeverity } from "@/common/constants/leads/import/issues/lead-import-row-issue-severities";
import type { RawLeadImportRow } from "@/common/contracts/leads/import/lead-import-raw-row";
import type { ValidatedLeadImportSocialProfile } from "@/common/contracts/leads/import/lead-import-social-profile";

function trimOptionalValue(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function createIssue(
  rowIndex: number,
  code: LeadImportRowIssueCode,
  column: LeadImportColumnKey,
): LeadImportRowIssueDto {
  return {
    rowIndex,
    code,
    severity: LeadImportRowIssueSeverity.Error,
    column,
  };
}

function validateOptionalUrl(
  value: string | undefined,
  rowIndex: number,
  column: LeadImportColumnKey,
): { value?: string; issue?: LeadImportRowIssueDto } {
  const trimmed = trimOptionalValue(value);
  if (trimmed === undefined) {
    return {};
  }

  if (!leadUrlSchema.safeParse(trimmed).success) {
    return {
      issue: createIssue(rowIndex, LeadImportRowIssueCode.InvalidUrl, column),
    };
  }

  return { value: trimmed };
}

function mapProfile(
  value: string | undefined,
  rowIndex: number,
  column: LeadImportColumnKey,
  platform: ValidatedLeadImportSocialProfile["platform"],
): {
  profile?: ValidatedLeadImportSocialProfile;
  issue?: LeadImportRowIssueDto;
} {
  const validated = validateOptionalUrl(value, rowIndex, column);
  if (validated.issue) {
    return { issue: validated.issue };
  }

  if (validated.value === undefined) {
    return {};
  }

  return {
    profile: {
      platform,
      profile_url: validated.value,
      normalized_url: normalizeLeadProfileUrl(validated.value),
    },
  };
}

function mapImportSocialProfiles(
  row: RawLeadImportRow,
  rowIndex: number,
): {
  socialProfiles: ValidatedLeadImportSocialProfile[];
  issues: LeadImportRowIssueDto[];
} {
  const issues: LeadImportRowIssueDto[] = [];
  const socialProfiles: ValidatedLeadImportSocialProfile[] = [];

  const linkedin = mapProfile(
    row.linkedin_url,
    rowIndex,
    LeadImportColumnKey.LinkedinUrl,
    "linkedin",
  );
  if (linkedin.issue) {
    issues.push(linkedin.issue);
  } else if (linkedin.profile) {
    socialProfiles.push(linkedin.profile);
  }

  const instagram = mapProfile(
    row.instagram_url,
    rowIndex,
    LeadImportColumnKey.InstagramUrl,
    "instagram",
  );
  if (instagram.issue) {
    issues.push(instagram.issue);
  } else if (instagram.profile) {
    socialProfiles.push(instagram.profile);
  }

  const youtube = mapProfile(
    row.youtube_url,
    rowIndex,
    LeadImportColumnKey.YoutubeUrl,
    "youtube",
  );
  if (youtube.issue) {
    issues.push(youtube.issue);
  } else if (youtube.profile) {
    socialProfiles.push(youtube.profile);
  }

  return { socialProfiles, issues };
}

export const leadImportSocialProfileMapperService = {
  mapImportSocialProfiles,
};
