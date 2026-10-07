export const CustomerCredentialsConstraintName = {
  CustomerForeignKey: "customer_credentials_customer_fkey",
  ProjectCustomerForeignKey: "customer_credentials_project_customer_fkey",
  CreatedByMemberForeignKey: "customer_credentials_created_by_member_fkey",
  CreatedByPortalMembershipForeignKey:
    "customer_credentials_created_by_portal_membership_fkey",
  TitleCheck: "customer_credentials_title_check",
  TypeCheck: "customer_credentials_type_check",
  UrlCheck: "customer_credentials_url_check",
  UsernameCheck: "customer_credentials_username_check",
  SideCheck: "customer_credentials_side_check",
  VersionCheck: "customer_credentials_version_check",
  OriginCheck: "customer_credentials_origin_check",
  CustomerVisibleCheck: "customer_credentials_customer_visible_check",
  CustomerTypeIndex: "customer_credentials_customer_type_idx",
  ProjectIndex: "customer_credentials_project_idx",
} as const;
