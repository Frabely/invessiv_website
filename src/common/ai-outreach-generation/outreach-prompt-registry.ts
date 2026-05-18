import { OutreachPromptKey } from "./outreach-prompt-keys";
import {
  aiOutreachGenerationService,
  FIRST_TOUCH_PROMPT_TEMPLATE,
} from "./prompts/first-touch-prompt";
import type { OutreachPromptEntry } from "./outreach-prompt-entry";

export const OUTREACH_PROMPT_REGISTRY: Record<
  OutreachPromptKey,
  OutreachPromptEntry
> = {
  [OutreachPromptKey.FirstTouch]: {
    key: OutreachPromptKey.FirstTouch,
    descriptionDictKey: "promptFirstTouchDescription",
    ...FIRST_TOUCH_PROMPT_TEMPLATE,
    build: aiOutreachGenerationService.firstTouchPrompt,
  },
};
