import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import { ScaleControl } from "@invessiv/ui";

const STEPS = Array.from(
  { length: QUESTIONNAIRE_LIMITS.scaleSteps },
  (_, index) => String(index + 1),
);

export type OnboardingScaleTrackProps = {
  /** A size down, for an answer that is read rather than given. */
  compact?: boolean;
  /** Label of the upper pole; null when the field names none. */
  high: string | null;
  /** DOM id of the first level and name of the radio group; only read while the track takes input. */
  id?: string;
  /** Label of the lower pole; null when the field names none. */
  low: string | null;
  /** Turns the levels into radios. Without it the track only shows the level. */
  onChangeAction?: (step: string) => void;
  /** Accessible name of one level; only read while the track takes input. */
  stepLabel?: (step: string) => string;
  /** The level, `"1"` to `"5"`; empty while unanswered. */
  value: string;
};

/**
 * A level between two poles as one track of segments, the same picture while it is chosen and
 * while it is read. As input, native radios carry the keyboard: arrows move along the track. Read
 * only, the track is a picture; the caller says the level in words for screen readers.
 */
export function OnboardingScaleTrack({
  compact = false,
  high,
  id,
  low,
  onChangeAction,
  stepLabel,
  value,
}: OnboardingScaleTrackProps) {
  return (
    <ScaleControl
      compact={compact}
      high={high}
      id={id}
      low={low}
      onChangeAction={onChangeAction}
      options={STEPS.map((step) => ({
        value: step,
        label: step,
        accessibleLabel: stepLabel?.(step),
      }))}
      value={value}
    />
  );
}
