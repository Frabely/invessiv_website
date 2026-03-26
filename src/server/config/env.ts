import { COMPANY } from "@/config/company";
import { loadLocalEnvFiles } from "@/server/config/load-env";

export type ContactMailProvider = "disabled" | "resend";
export type DeploymentEnvironment = "development" | "preview" | "production";

export type ServerEnv = {
  contactMailFrom: string | null;
  contactMailProvider: ContactMailProvider;
  contactMailTo: string;
  databaseUrl: string | null;
  deploymentEnvironment: DeploymentEnvironment;
  resendApiKey: string | null;
};

function readDeploymentEnvironment(): DeploymentEnvironment {
  const rawEnvironment =
    process.env.VERCEL_TARGET_ENV?.trim().toLowerCase() ||
    process.env.VERCEL_ENV?.trim().toLowerCase() ||
    "";

  if (rawEnvironment === "preview") {
    return "preview";
  }

  if (rawEnvironment === "production") {
    return "production";
  }

  return "development";
}

function readContactMailProvider(): ContactMailProvider {
  if (!process.env.VITEST) {
    loadLocalEnvFiles();
  }

  const rawValue = process.env.CONTACT_MAIL_PROVIDER?.trim().toLowerCase();
  if (rawValue === "resend") {
    return "resend";
  }

  return "disabled";
}

export function getServerEnv(): ServerEnv {
  if (!process.env.VITEST) {
    loadLocalEnvFiles();
  }

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
    deploymentEnvironment: readDeploymentEnvironment(),
    resendApiKey: process.env.RESEND_API_KEY?.trim() || null,
  };
}
