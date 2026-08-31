/**
 * The quick-contact channel has no dedicated field for the selected service
 * model, so it is prefixed to the message instead. That keeps the value visible
 * in the notification mail and in the CRM without widening the persisted shape.
 */
export function createScopedContactMessage(
  scopeLine: string,
  message: string,
): string {
  const normalizedScopeLine = scopeLine.trim();
  const normalizedMessage = message.trim();

  if (!normalizedScopeLine) {
    return normalizedMessage;
  }

  return normalizedMessage
    ? `${normalizedScopeLine}\n\n${normalizedMessage}`
    : normalizedScopeLine;
}
