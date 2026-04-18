import "server-only";
import type { DeploymentEnvironment } from "@/server/config/env";

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function sanitizeLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export function getEnvironmentSubjectPrefix(
  environment: DeploymentEnvironment,
) {
  if (environment === "development") {
    return "[DEV] ";
  }

  if (environment === "preview") {
    return "[PREVIEW] ";
  }

  return "";
}
