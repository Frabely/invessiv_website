import type { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import type { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
import type { ServiceRequestProjectWish } from "@invessiv/common/constants/crm/service-request-project-wishes";
export interface ServiceRequestRow {
  id: string;
  customer_id: string;
  line_item_template_id: string | null;
  kind: LineItemKind;
  title: string;
  note: string;
  requested_minutes: number | null;
  project_wish: ServiceRequestProjectWish;
  requested_project_id: string | null;
  requested_by_membership_id: string;
  status: ServiceRequestStatus;
  decline_reason: string | null;
  offered_at: Date | null;
  offered_price_cents: number | null;
  offered_minutes: number | null;
  decided_at: Date | null;
  decided_by_member_id: string | null;
  project_id: string | null;
  project_line_item_id: string | null;
  idempotency_key: string;
  version: number;
  created_at: Date;
  updated_at: Date;
}
