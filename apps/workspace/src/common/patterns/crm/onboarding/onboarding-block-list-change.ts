import { OnboardingBlockListChangeKind } from "@/common/constants/crm/onboarding/onboarding-block-list-change-kinds";
import type { OnboardingBlockListChange } from "@/common/contracts/crm/onboarding/onboarding-block-list-change";

/**
 * The ordered list editor reports a change as the new order of ids. A form applies each change
 * with one server command, so the new order is read back as that command: one removed block, or
 * two neighbours that swapped. Anything else is not a single step and answers null.
 */
export function detectOnboardingBlockListChange(
  before: readonly string[],
  after: readonly string[],
): OnboardingBlockListChange {
  if (after.length === before.length - 1) {
    const index = before.findIndex((id, position) => after[position] !== id);
    const removed = before[index];
    const rest = before.filter((_, position) => position !== index);
    return removed !== undefined &&
      rest.every((id, position) => after[position] === id)
      ? { kind: OnboardingBlockListChangeKind.Remove, blockId: removed }
      : null;
  }
  if (after.length !== before.length) return null;

  const changed = before.flatMap((id, position) =>
    after[position] === id ? [] : [position],
  );
  const [first, second] = changed;
  if (
    changed.length !== 2 ||
    second !== first + 1 ||
    after[first] !== before[second] ||
    after[second] !== before[first]
  )
    return null;
  return {
    kind: OnboardingBlockListChangeKind.Move,
    blockId: before[first],
    direction: 1,
  };
}
