import { CONTACT_REQUEST_KINDS } from "@/common/constants/contact/contact-request-kind";

export type ContactRequestKind = (typeof CONTACT_REQUEST_KINDS)[number];

export type ContactSubmissionChannel = ContactRequestKind;
