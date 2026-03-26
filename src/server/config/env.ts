import { COMPANY } from "@/config/company";

export type ContactMailProvider = "disabled" | "resend";

export type ServerEnv = {
  contactMailFrom: string | null;
  contactMailProvider: ContactMailProvider;
  contactMailTo: string;
  databaseUrl: string | null;
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
  const databaseUrl =
    process.env.DATABASE_URL?.trim() ||
    process.env.INVESSIV_DATABASE_DATABASE_URL?.trim() ||
    process.env.INVESSIV_DATABASE_POSTGRES_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    null;

  return {
    contactMailFrom: process.env.CONTACT_MAIL_FROM?.trim() || null,
    contactMailProvider: readContactMailProvider(),
    contactMailTo: process.env.CONTACT_MAIL_TO?.trim() || COMPANY.contact.email,
    databaseUrl,
    resendApiKey: process.env.RESEND_API_KEY?.trim() || null,
  };
}
