import "server-only";

import type { ProjectResponsibleContact } from "@/common/contracts/crm/project-responsible-contact";

/** The member whose calendar the customer of a project books the onboarding call in. */
export type ProjectBookingContact = {
  memberId: string;
  displayName: string;
  bookingUrl: string;
};
/** Both contact choices derived from one load of the project's active owners. */
export type ProjectResponsibleContacts = {
  contact: ProjectResponsibleContact | null;
  bookingContact: ProjectBookingContact | null;
};
