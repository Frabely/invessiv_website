"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { portalInvitationApiService } from "@/client/portal/portal-invitation-api-service";
import { PortalInvitationErrorCode } from "@invessiv/common/constants/portal/portal-invitation-error-codes";
import type { Locale } from "@/config/i18n";
import { portalPathFor } from "@/lib/auth/routes";
import styles from "./portal-invitation-redeemer.module.css";

export interface PortalInvitationRedeemerProps {
  token: string;
  locale: Locale;
  labels: {
    redeem: string;
    loading: string;
    invalid: string;
    expired: string;
    redeemed: string;
    unavailable: string;
  };
}

export function PortalInvitationRedeemer({
  token,
  locale,
  labels,
}: PortalInvitationRedeemerProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function redeem() {
    setPending(true);
    setMessage(null);
    try {
      const result = await portalInvitationApiService.redeem(token);
      if (result.ok) {
        router.replace(portalPathFor(locale, result.customerId));
        return;
      }
      const messages: Record<PortalInvitationErrorCode, string> = {
        [PortalInvitationErrorCode.Invalid]: labels.invalid,
        [PortalInvitationErrorCode.Expired]: labels.expired,
        [PortalInvitationErrorCode.Redeemed]: labels.redeemed,
        [PortalInvitationErrorCode.Unauthenticated]: labels.unavailable,
        [PortalInvitationErrorCode.Unavailable]: labels.unavailable,
      };
      setMessage(messages[result.code]);
    } catch {
      setMessage(labels.unavailable);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.action}>
      <button
        className={styles.button}
        type="button"
        onClick={redeem}
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? labels.loading : labels.redeem}
      </button>
      {message ? (
        <p className={styles.error} role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
