export const ServiceRequestsConstraintName = {
  CustomerForeignKey: "service_requests_customer_id_fkey",
  TemplateForeignKey: "service_requests_line_item_template_id_fkey",
  RequestedProjectForeignKey:
    "service_requests_requested_project_customer_fkey",
  MembershipForeignKey: "service_requests_membership_customer_fkey",
  MemberForeignKey: "service_requests_decided_by_member_id_fkey",
  ProjectForeignKey: "service_requests_project_customer_fkey",
  LineItemForeignKey: "service_requests_project_line_item_id_fkey",
  KindCheck: "service_requests_kind_check",
  TitleCheck: "service_requests_title_check",
  NoteCheck: "service_requests_note_check",
  MinutesCheck: "service_requests_minutes_check",
  KindMinutesCheck: "service_requests_kind_minutes_check",
  WishCheck: "service_requests_project_wish_check",
  WishProjectCheck: "service_requests_wish_project_check",
  StatusCheck: "service_requests_status_check",
  DeclineReasonCheck: "service_requests_decline_reason_check",
  AcceptedCheck: "service_requests_accepted_check",
  DeclinedCheck: "service_requests_declined_check",
  VersionCheck: "service_requests_version_check",
  IdempotencyUnique: "service_requests_idempotency_key_uidx",
  CustomerCreatedIndex: "service_requests_customer_created_idx",
  StatusCreatedIndex: "service_requests_status_created_idx",
} as const;
export type ServiceRequestsConstraintName =
  (typeof ServiceRequestsConstraintName)[keyof typeof ServiceRequestsConstraintName];
export const SERVICE_REQUESTS_CONSTRAINT_NAME_VALUES = Object.values(
  ServiceRequestsConstraintName,
);
