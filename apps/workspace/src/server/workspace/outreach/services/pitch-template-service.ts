import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  PITCH_AUDIENCE_VALUES,
  type PitchAudience,
} from "@invessiv/common/constants/leads/outreach/lead-pitch-audiences";
import { PITCH_CHANNEL_LIMITS } from "@invessiv/common/constants/leads/outreach/lead-pitch-channel-limits";
import type { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import { LeadPitchErrorCode } from "@invessiv/common/constants/leads/outreach/lead-pitch-error-codes";
import {
  PITCH_ICEBREAKER_TARGET_CHARS,
  PITCH_SALUTATION_NAME_RESERVE_CHARS,
} from "@invessiv/common/defaults/leads/outreach/lead-pitch-defaults";

const TEMPLATE_DIRECTORY = path.join(
  process.cwd(),
  "local-skills",
  "invessiv-pitch-skill",
  "templates",
);

const NAME_PLACEHOLDER = "{{Name}}";
const ICEBREAKER_PLACEHOLDER = "{{Icebreaker}}";

const templateCache = new Map<string, Promise<string>>();

function getTemplateFileName(
  channel: PitchChannel,
  audience: PitchAudience,
): string {
  return `${channel}.${audience}.txt`;
}

async function readTemplateFile(fileName: string): Promise<string> {
  const raw = await readFile(path.join(TEMPLATE_DIRECTORY, fileName), "utf8");
  const template = raw.replace(/\r\n/g, "\n").trimEnd();

  if (
    !template.includes(NAME_PLACEHOLDER) ||
    !template.includes(ICEBREAKER_PLACEHOLDER)
  ) {
    throw new Error(LeadPitchErrorCode.TemplateInvalid);
  }

  return template;
}

async function loadTemplate(
  channel: PitchChannel,
  audience: PitchAudience,
): Promise<string> {
  const fileName = getTemplateFileName(channel, audience);
  let pending = templateCache.get(fileName);

  if (!pending) {
    pending = readTemplateFile(fileName);
    templateCache.set(fileName, pending);
  }

  try {
    return await pending;
  } catch {
    templateCache.delete(fileName);
    throw new Error(LeadPitchErrorCode.TemplateInvalid);
  }
}

async function getBaseLength(
  channel: PitchChannel,
  audience: PitchAudience,
): Promise<number> {
  const template = await loadTemplate(channel, audience);

  return template
    .replace(NAME_PLACEHOLDER, "")
    .replace(ICEBREAKER_PLACEHOLDER, "").length;
}

async function getIcebreakerBudget(params: {
  channel: PitchChannel;
  audience: PitchAudience;
  salutationName?: string;
}): Promise<number> {
  const baseLength = await getBaseLength(params.channel, params.audience);
  const nameLength =
    params.salutationName === undefined
      ? PITCH_SALUTATION_NAME_RESERVE_CHARS
      : params.salutationName.length;
  const available =
    PITCH_CHANNEL_LIMITS[params.channel] - baseLength - nameLength;

  return Math.max(0, Math.min(available, PITCH_ICEBREAKER_TARGET_CHARS));
}

async function getInitialIcebreakerBudget(
  channel: PitchChannel,
): Promise<number> {
  const budgets = await Promise.all(
    PITCH_AUDIENCE_VALUES.map((audience) =>
      getIcebreakerBudget({ channel, audience }),
    ),
  );

  return Math.min(...budgets);
}

async function render(params: {
  channel: PitchChannel;
  audience: PitchAudience;
  salutationName: string;
  icebreaker: string;
}): Promise<string> {
  const template = await loadTemplate(params.channel, params.audience);

  return template
    .replace(NAME_PLACEHOLDER, () => params.salutationName)
    .replace(ICEBREAKER_PLACEHOLDER, () => params.icebreaker);
}

function getCharLimit(channel: PitchChannel): number {
  return PITCH_CHANNEL_LIMITS[channel];
}

export const pitchTemplateService = {
  getCharLimit,
  getIcebreakerBudget,
  getInitialIcebreakerBudget,
  loadTemplate,
  render,
} as const;
