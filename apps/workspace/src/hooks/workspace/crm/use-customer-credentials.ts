"use client";

import { useEffect, useState } from "react";
import type { CredentialDto } from "@invessiv/common/contracts/credentials/credential.dto";
import { credentialsApiService } from "@/client/crm/credentials-api-service";
import { CredentialListLoadStatus } from "@/common/constants/credentials/credential-list-load-status";

type CredentialListState = {
  /** The request these entries answer; a different key means they are stale. */
  key: string;
  status: CredentialListLoadStatus;
  credentials: CredentialDto[];
};

/**
 * Loads the credential metadata of one customer through the API. `revision` reloads after a
 * write. Only metadata ever lives here; revealed values stay inside their field.
 */
export function useCustomerCredentials(
  customerId: string,
  projectId: string | null | undefined,
  revision: number,
) {
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([
    customerId,
    projectId ?? null,
    projectId === undefined,
    revision,
    attempt,
  ]);
  const [state, setState] = useState<CredentialListState>({
    key,
    status: CredentialListLoadStatus.Loading,
    credentials: [],
  });

  useEffect(() => {
    let active = true;
    void credentialsApiService.list(customerId, projectId).then((result) => {
      if (!active) return;
      setState(
        result.ok
          ? {
              key,
              status: CredentialListLoadStatus.Ready,
              credentials: result.value,
            }
          : { key, status: CredentialListLoadStatus.Error, credentials: [] },
      );
    });
    return () => {
      active = false;
    };
  }, [customerId, projectId, key, revision, attempt]);

  // Stale entries are never shown while a filter change or reload is pending.
  const current: CredentialListState =
    state.key === key
      ? state
      : { key, status: CredentialListLoadStatus.Loading, credentials: [] };

  /** A reveal moves only this timestamp; the entry is patched instead of reloading the list. */
  function markRevealed(credentialId: string) {
    const lastRevealedAt = new Date().toISOString();
    setState((previous) => ({
      ...previous,
      credentials: previous.credentials.map((entry) =>
        entry.id === credentialId ? { ...entry, lastRevealedAt } : entry,
      ),
    }));
  }

  /** Swaps in the fresh entry a write or a conflict handed back. */
  function replace(credential: CredentialDto) {
    setState((previous) => ({
      ...previous,
      credentials: previous.credentials.map((entry) =>
        entry.id === credential.id ? credential : entry,
      ),
    }));
  }

  return {
    status: current.status,
    credentials: current.credentials,
    replace,
    markRevealed,
    reload: () => setAttempt((value) => value + 1),
  };
}
