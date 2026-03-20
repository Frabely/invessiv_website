import "server-only";
import { COMPANY } from "@/config/company";

export type ContactMailProvider = "disabled" | "resend";

export type ServerEnv = {
  contactMailFrom: string | null;
  contactMailProvider: ContactMailProvider;
  contactMailTo: string;
  resendApiKey: string | null;
};

function readContactMailProvider(): ContactMailProvider {
  const rawValue = process.env.CONTACT_MAIL_PROVIDER?.trim().toLowerCase();
  if (rawValue === "resend") {
    return "resend";
  }

  return "disabled";
}

export function getServerEnv(): ServerEnv {
  return {
    contactMailFrom: process.env.CONTACT_MAIL_FROM?.trim() || null,
    contactMailProvider: readContactMailProvider(),
    contactMailTo: process.env.CONTACT_MAIL_TO?.trim() || COMPANY.contact.email,
    resendApiKey: process.env.RESEND_API_KEY?.trim() || null,
  };
}
