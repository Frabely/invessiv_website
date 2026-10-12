import type { Permission } from "@invessiv/common/constants/auth/permissions";
import type { PortalConversationDto } from "@invessiv/common/contracts/portal/portal-conversation.dto";
import type { PortalCredentialsSummaryDto } from "@invessiv/common/contracts/portal/portal-credentials-summary.dto";
import type { PortalDashboardDto } from "@invessiv/common/contracts/portal/portal-dashboard.dto";
import type { PortalFilesOverviewDto } from "@invessiv/common/contracts/portal/portal-files-overview.dto";
import type { PortalHoursDto } from "@invessiv/common/contracts/portal/portal-hours.dto";
import type { PortalOnboardingFormSummaryDto } from "@invessiv/common/contracts/portal/portal-onboarding-form-summary.dto";
import type { PortalServicesDto } from "@invessiv/common/contracts/portal/portal-services.dto";

export type PortalDashboardTestOptions = {
  dashboard?: PortalDashboardDto;
  permissions?: ReadonlySet<Permission>;
  cockpitHref?: string | null;
  conversation?: PortalConversationDto | null;
  filesOverview?: PortalFilesOverviewDto | null;
  onboarding?: PortalOnboardingFormSummaryDto | null;
  credentials?: PortalCredentialsSummaryDto | null;
  hours?: PortalHoursDto | null;
  services?: PortalServicesDto | null;
};
