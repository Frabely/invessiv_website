/**
 * What a secret field gets back from its owner. The failure is already a sentence: the field knows
 * neither endpoints nor error codes, so CRM and portal can share it.
 */
export type CredentialRevealOutcome =
  { ok: true; value: string } | { ok: false; message: string };
