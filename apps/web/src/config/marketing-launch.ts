export function isConsumptionReferenceEnabled(): boolean {
  return (
    process.env.ENABLE_MARKETING_REFERENCE_CONSUMPTION?.trim().toLowerCase() ===
    "true"
  );
}
