import type { OutreachPromptKey } from "./outreach-prompt-keys";
import type { OutreachPromptMessages } from "./outreach-prompt-messages";
import type { PromptBuildContext } from "./prompt-build-context";

export interface OutreachPromptEntry {
  key: OutreachPromptKey;
  descriptionDictKey: string;
  build: (ctx: PromptBuildContext) => OutreachPromptMessages;
}
