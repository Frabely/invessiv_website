export function isMarketingProofEnabled(): boolean {
  return process.env.ENABLE_MARKETING_PROOF?.trim().toLowerCase() === "true";
}
