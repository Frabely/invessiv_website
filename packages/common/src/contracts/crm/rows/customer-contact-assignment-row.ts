import type { Locale } from "@invessiv/common/contracts/i18n/locale";

/** Join of `customer_contact_assignments` and `people`. */
export type CustomerContactAssignmentRow = {
  id: string;
  person_id: string;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  business_email: string | null;
  business_phone: string | null;
  role_label: string | null;
  is_primary: boolean;
  preferred_locale: Locale;
  assignment_version: number;
  person_version: number;
  created_at: Date;
  updated_at: Date;
};
