import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import type { Locale } from "@/config/i18n";

import { isEmailAllowed } from "./allowlist";
import { dashboardPathFor, signInPathWithRedirect } from "./routes";

export type DashboardAccess = {
  userId: string;
  email: string;
};

export async function requireDashboardAccess(
  locale: Locale,
): Promise<DashboardAccess> {
  const { userId } = await auth();

  if (!userId) {
    redirect(signInPathWithRedirect(locale, dashboardPathFor(locale)));
  }

  const user = await currentUser();
  const primaryEmail = user?.emailAddresses.find(
    (entry) => entry.id === user.primaryEmailAddressId,
  )?.emailAddress;

  if (!primaryEmail || !isEmailAllowed(primaryEmail)) {
    notFound();
  }

  return { userId, email: primaryEmail };
}
