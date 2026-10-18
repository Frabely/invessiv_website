import { useState } from "react";
import type { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { RevealedSecretStatus } from "@/common/constants/credentials/revealed-secret-status";
import type { CredentialRevealOutcome } from "@/common/contracts/credentials/credential-reveal-outcome";
import type { CredentialSecretFieldLabels } from "@/common/contracts/credentials/credential-secret-field-labels";
import { useRevealedSecret } from "@/hooks/shared/use-revealed-secret";

/**
 * One secret value with its show, hide and copy actions and the live-region text, so the value
 * and its buttons can sit apart, e.g. in different table cells.
 */
export function useCredentialSecret(options: {
  autoHideSeconds: number;
  labels: CredentialSecretFieldLabels;
  /** Names the value for assistive technology, e.g. "Password of Hosting". */
  name: string;
  reveal: (intent: CredentialRevealIntent) => Promise<CredentialRevealOutcome>;
}) {
  const { autoHideSeconds, labels, name, reveal } = options;
  const secret = useRevealedSecret({
    autoHideSeconds,
    clipboardFailedMessage: labels.clipboardFailed,
    reveal,
  });
  const [wasShown, setWasShown] = useState(false);
  const isVisible = secret.status === RevealedSecretStatus.Visible;
  const isLoading = secret.status === RevealedSecretStatus.Loading;
  const named = { name };

  // Announces the state, never the value. The seconds are the full span, so the text does not
  // change every second and is read exactly once.
  function announce(): string {
    if (secret.copied) return formatMessage(labels.copiedAnnouncement, named);
    if (isVisible)
      return formatMessage(labels.visibleAnnouncement, {
        name,
        seconds: autoHideSeconds,
      });
    if (wasShown && secret.status === RevealedSecretStatus.Hidden)
      return formatMessage(labels.hiddenAnnouncement, named);
    return "";
  }
  const announcement = announce();

  function show() {
    setWasShown(true);
    void secret.show();
  }

  function toggle() {
    if (isVisible) secret.hide();
    else show();
  }

  function copy() {
    if (!isVisible) setWasShown(false);
    void secret.copy();
  }

  return {
    announcement,
    copied: secret.copied,
    isLoading,
    isVisible,
    message: secret.message,
    secondsLeft: secret.secondsLeft,
    value: secret.value,
    copy,
    hide: secret.hide,
    show,
    toggle,
  };
}
