"use client";

import { useEffect, useState } from "react";
import type { PortalCredentialListDto } from "@invessiv/common/contracts/portal/portal-credential-list.dto";
import { portalCredentialsApiService } from "@/client/portal/portal-credentials-api-service";
import { CredentialListLoadStatus } from "@/common/constants/credentials/credential-list-load-status";

type PortalCredentialsState = {
  /** The request this list answers; a different key means it is stale. */
  key: string;
  status: CredentialListLoadStatus;
  list: PortalCredentialListDto | null;
};

/**
 * Loads the company's released credentials when the dialog opens, never with the dashboard.
 * `revision` reloads after a save. Only metadata lives here; revealed values stay in their field.
 */
export function usePortalCredentials(customerId: string, revision: number) {
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([customerId, revision, attempt]);
  const [state, setState] = useState<PortalCredentialsState>({
    key,
    status: CredentialListLoadStatus.Loading,
    list: null,
  });

  useEffect(() => {
    let active = true;
    void portalCredentialsApiService.list(customerId).then((result) => {
      if (!active) return;
      setState(
        result.ok
          ? { key, status: CredentialListLoadStatus.Ready, list: result.value }
          : { key, status: CredentialListLoadStatus.Error, list: null },
      );
    });
    return () => {
      active = false;
    };
  }, [customerId, key]);

  // After a save the previous list stays visible until the fresh one arrives, so the dialog does
  // not flash empty; only a failed or first load has nothing to show.
  const pending = state.key !== key;
  return {
    /** The previous list may still be shown while a save reloads its metadata. */
    isRefreshing: pending,
    status:
      pending && !state.list ? CredentialListLoadStatus.Loading : state.status,
    list: state.list,
    reload: () => setAttempt((value) => value + 1),
  };
}
