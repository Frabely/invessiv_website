import { auth } from "@clerk/nextjs/server";
import { PortalInvitationErrorCode } from "@invessiv/common/constants/portal/portal-invitation-error-codes";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortalInvitationActions } from "@/components/portal/portal-invitation-actions/portal-invitation-actions";
import { PortalInvitationCard } from "@/components/portal/portal-invitation-card/portal-invitation-card";
import { PortalInvitationRedeemer } from "@/components/portal/portal-invitation-redeemer/portal-invitation-redeemer";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import { getPortalInvitationDictionary } from "@/i18n/dictionaries/portal";
import {
  portalInvitePathFor,
  signInPathWithRedirect,
  signUpPathWithRedirect,
} from "@/lib/auth/routes";
import { getPortalInvitationState } from "@/server/portal/query-handler/get-portal-invitation-state.query-handler";

export const dynamic = "force-dynamic";
export const revalidate = 0;
type Props = { params: Promise<{ locale: string; token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const meta = getPortalInvitationDictionary(locale).meta;
  return {
    title: meta.title,
    description: meta.description,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function PortalInvitePage({ params }: Props) {
  const { locale, token } = await params;
  if (!isSupportedLocale(locale) || !token) notFound();
  const activeLocale = locale as Locale;
  const content = getPortalInvitationDictionary(activeLocale).page;
  const invitationState = await getPortalInvitationState(token).catch(
    () => PortalInvitationErrorCode.Unavailable,
  );
  const errorMessage =
    invitationState === PortalInvitationErrorCode.Expired
      ? content.expired
      : invitationState === PortalInvitationErrorCode.Redeemed
        ? content.redeemed
        : invitationState === PortalInvitationErrorCode.Unavailable
          ? content.unavailable
          : invitationState
            ? content.invalid
            : null;
  const { userId } = errorMessage ? { userId: null } : await auth();
  const invitePath = portalInvitePathFor(activeLocale, token);
  return (
    <PortalInvitationCard
      body={content.body}
      eyebrow={content.eyebrow}
      title={content.title}
    >
      {errorMessage ? (
        <p role="alert">{errorMessage}</p>
      ) : userId ? (
        <PortalInvitationRedeemer
          labels={content}
          locale={activeLocale}
          token={token}
        />
      ) : (
        <PortalInvitationActions
          ariaLabel={content.eyebrow}
          signInHref={signInPathWithRedirect(activeLocale, invitePath)}
          signInLabel={content.signIn}
          signUpHref={signUpPathWithRedirect(activeLocale, invitePath)}
          signUpLabel={content.signUp}
        />
      )}
    </PortalInvitationCard>
  );
}
