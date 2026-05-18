import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { OutreachChannel } from "@/common/ai-outreach-generation/outreach-channels";
import { CHANNEL_PROFILES } from "@/common/ai-outreach-generation/channel-profiles";
import { OUTREACH_MAX_IMPROVEMENTS } from "@/common/ai-outreach-generation/outreach-defaults";
import type { LeadDetailDto } from "@/common/contracts/leads/lead-detail.dto";
import { sanitizeLeadFacts } from "@/common/ai-outreach-generation/outreach-lead-facts-utils";

const SKILL_FILE_PATH = path.join(
  process.cwd(),
  "local-skills",
  "invessiv-outreach-skill",
  "SKILL.md",
);

let cachedSkillMarkdown: Promise<string> | null = null;

function trimOrNull(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

async function loadSkillMarkdown(): Promise<string> {
  if (!cachedSkillMarkdown) {
    cachedSkillMarkdown = readFile(SKILL_FILE_PATH, "utf8");
  }

  return cachedSkillMarkdown;
}

function buildStructuredContext(params: {
  lead: LeadDetailDto;
  channel: OutreachChannel;
  contextNote?: string;
}): string {
  const leadFacts = sanitizeLeadFacts(params.lead);
  const websiteUrl = trimOrNull(leadFacts.websiteUrl);
  const websiteExists = websiteUrl !== null;
  const context = {
    lead: {
      id: params.lead.id,
      displayName: trimOrNull(leadFacts.displayName),
      firstName: trimOrNull(leadFacts.firstName),
      companyName: trimOrNull(leadFacts.companyName),
      websiteUrl,
      websiteExists,
      categoryLabel: trimOrNull(leadFacts.categoryLabel),
      notes: trimOrNull(leadFacts.notes),
      owner: trimOrNull(leadFacts.owner),
      improvements: websiteExists
        ? leadFacts.improvements
            .map((item) => item.trim())
            .filter(
              (item, index, items) =>
                item.length > 0 && items.indexOf(item) === index,
            )
            .slice(0, OUTREACH_MAX_IMPROVEMENTS)
        : [],
    },
    channel: {
      value: params.channel,
      ...CHANNEL_PROFILES[params.channel],
    },
    contextNote: trimOrNull(params.contextNote),
  };

  return JSON.stringify(context, null, 2);
}

async function buildSkillPrompts(params: {
  lead: LeadDetailDto;
  channel: OutreachChannel;
  contextNote?: string;
}): Promise<{ systemPrompt: string; userPrompt: string }> {
  const skillMarkdown = await loadSkillMarkdown();
  const structuredContext = buildStructuredContext(params);

  return {
    systemPrompt: skillMarkdown.trim(),
    userPrompt: [
      "Nutze den folgenden strukturierten Kontext als einzige inhaltliche Quelle.",
      "Gib nur die fertige Nachricht im Skill-Format aus.",
      "",
      "```json",
      structuredContext,
      "```",
    ].join("\n"),
  };
}

export const outreachSkillContextService = {
  buildSkillPrompts,
  loadSkillMarkdown,
} as const;
