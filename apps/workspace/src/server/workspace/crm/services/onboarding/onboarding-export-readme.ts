import "server-only";

import { ONBOARDING_EXPORT_SCHEMA_VERSION } from "@invessiv/common/constants/crm/onboarding/onboarding-export-format";

/**
 * `README.md` of every export archive: how to read `onboarding.json`, for people and for an AI
 * that turns the answers into a project brief. Keep it in step with `OnboardingExportDto`; a
 * change of the shape raises `ONBOARDING_EXPORT_SCHEMA_VERSION` and is described here.
 */
export const ONBOARDING_EXPORT_README = `# Onboarding export

This archive holds the onboarding questionnaire of one web project: every question the customer
was asked, every answer they gave, and the files they attached. It is meant as the input for a
project brief: design direction, site structure, content, tone of voice, technical and legal
requirements.

Format version: **${ONBOARDING_EXPORT_SCHEMA_VERSION}** (\`schemaVersion\` in \`onboarding.json\`).

## What is in the archive

| Path | Content |
| --- | --- |
| \`onboarding.json\` | All questions and answers. Described below. |
| \`files/<block>/<question>/<file>\` | A file attached to exactly one question. |
| \`files/<block>/<group>/entry-<n>/<question>/<file>\` | A file attached to a question inside a repeated group, e.g. the portrait of team member 2. |
| \`files/shared/<file>\` | A file the customer attached to more than one question. It is stored once; every question that uses it points here. |
| \`README.md\` | This description. |

## Five rules for reading the export

1. **Every question is there.** A question without an answer is not left out. It has
   \`"answered": false\` and an empty answer (\`null\`, \`false\` or an empty list).
   *Unanswered means "not told yet", never "no".*
2. **Hidden questions are there too.** Some questions only show up after a certain answer (e.g.
   "Why classic?" only after picking "classic"). Those carry \`"visible": false\` while their
   condition is not met. Treat them as context, not as missing information.
3. **Keys are stable, labels are for reading.** \`key\` values (\`texts_tone\`,
   \`design_direction\`, ...) are the same in every export of every customer. \`label\`, \`title\`
   and \`help\` are the wording the customer saw, in the language given by \`locale\`.
4. **The status says how final it is.** Before \`"status": "completed"\` the customer may still
   change answers. A \`"draft"\` has not even been sent to the customer yet.
5. **Choices list every option.** For a choice question all options are listed with
   \`"selected": true/false\`. What was not picked can be as telling as what was.

## onboarding.json

### Top level

| Property | Type | Meaning |
| --- | --- | --- |
| \`schemaVersion\` | number | Version of this format. |
| \`exportedAt\` | ISO date-time | When the archive was created. |
| \`locale\` | \`"de"\` \\| \`"en"\` | Language of all labels. A text missing in that language falls back to another one. |
| \`customerName\` | string | Name of the customer. |
| \`projectTitle\` | string | Title of the project. |
| \`projectPhase\` | string | Phase at export time: \`onboarding\`, \`design\`, \`development\`, \`feedback\`, \`launch\`, \`maintenance\`. |
| \`templateTitle\` | string \\| null | Template the questionnaire was built from; null when none. |
| \`status\` | string | \`draft\` (not sent yet), \`open\` (customer is answering), \`submitted\` (sent back, team reviews), \`changes_requested\` (team asked for more), \`completed\` (final). |
| \`releasedAt\` | ISO date-time \\| null | When the customer received the questionnaire. |
| \`submittedAt\` | ISO date-time \\| null | Last time the customer sent it back. |
| \`callHeldOn\` | \`YYYY-MM-DD\` \\| null | Date of the onboarding call; set on completion. |
| \`completedAt\` | ISO date-time \\| null | When the team completed it. |
| \`services\` | object | The booked services, see below. |
| \`blocks\` | list | The steps of the questionnaire in order, see below. |

### services

The services booked for this project, as the customer was asked to confirm them.

| Property | Type | Meaning |
| --- | --- | --- |
| \`confirmedAt\` | ISO date-time \\| null | When the customer confirmed them; null while unconfirmed. |
| \`note\` | string \\| null | Remark of the customer on the services. |
| \`changedSinceConfirmation\` | boolean | A service changed after the customer confirmed. |
| \`items\` | list of \`{ title, description }\` | The services. \`description\` may be null. |

### blocks

One block is one step of the questionnaire, e.g. "Company", "Target audience", "Tone of voice",
"Design direction".

| Property | Type | Meaning |
| --- | --- | --- |
| \`key\` | string | Stable id of the block, e.g. \`company_profile\`, \`texts_tone\`, \`brand_colors_fonts\`. |
| \`title\` | string | Title the customer saw. |
| \`intro\` | string \\| null | Explanation shown above the questions. |
| \`reviewStatus\` | string | Internal review by the team: \`pending\` (not looked at), \`complete\` (fine), \`clarification\` (open question). |
| \`reviewNote\` | string \\| null | The team's question or remark for this block. Internal, not an answer of the customer. |
| \`fields\` | list | The questions of the block in order. |

### fields (questions)

| Property | Type | Meaning |
| --- | --- | --- |
| \`key\` | string | Stable id of the question within its block. |
| \`type\` | string | Kind of question, see the table below. Decides the shape of \`answer\`. |
| \`label\` | string | The question as the customer read it. |
| \`help\` | string \\| null | Explanation shown below the question. |
| \`required\` | boolean | The customer had to answer it (while it was visible). |
| \`visible\` | boolean | Whether the customer sees the question with the answers given so far. |
| \`condition\` | object \\| null | When the question shows up, see below. Null when always shown. |
| \`maxLength\` | number \\| null | Length limit of a text answer. |
| \`minItems\` / \`maxItems\` | number \\| null | Limits for files, group entries or selected options. |
| \`acceptedAssetKinds\` | list \\| null | File kinds a files question accepts (\`document\`, \`image\`, \`video\`, \`font\`, \`link\`); null means all. |
| \`answered\` | boolean | Whether the answer holds anything at all. |
| \`answer\` | object | The answer. Its \`kind\` tells its shape. |

### condition

"Shown when option *optionKey* of question *fieldKey* is selected." The triggering question is in
the same block and, inside a group, in the same entry.

| Property | Meaning |
| --- | --- |
| \`fieldKey\` | Key of the question that triggers this one. |
| \`optionKey\` | Key of the option that must be selected there. |
| \`optionLabel\` | Label of that option, for reading. |

### Question types and their answer

| \`type\` | \`answer.kind\` |
| --- | --- |
| \`short_text\`, \`long_text\`, \`email\`, \`phone\`, \`url\`, \`color\` | \`text\` |
| \`choice\`, \`multi_choice\`, \`yes_no\` | \`choice\` |
| \`scale\` | \`scale\` |
| \`confirmation\`, \`project_services\` | \`confirmation\` |
| \`files\` | \`files\` |
| \`group\` | \`group\` |

#### text

\`\`\`json
{ "kind": "text", "value": "Friendly and direct, we say \\"du\\"." }
\`\`\`

\`value\` is the text as typed, a color as hex code (\`"#1d4ed8"\`), or \`null\` when empty.

#### choice

\`\`\`json
{
  "kind": "choice",
  "multiple": true,
  "options": [
    { "key": "modern", "label": "Modern", "selected": true },
    { "key": "classic", "label": "Classic", "selected": false }
  ]
}
\`\`\`

| Property | Meaning |
| --- | --- |
| \`multiple\` | True when several options could be picked. |
| \`options\` | Every option in the order the customer saw them. |
| \`options[].key\` | Stable id of the option. A yes/no question has \`yes\` and \`no\`. |
| \`options[].label\` | Wording of the option. |
| \`options[].selected\` | Whether the customer picked it. No option selected means unanswered. |

#### scale

\`\`\`json
{ "kind": "scale", "value": 4, "steps": 5, "lowLabel": "Casual", "highLabel": "Formal" }
\`\`\`

\`value\` runs from 1 (= \`lowLabel\`) to \`steps\` (= \`highLabel\`); \`null\` when unanswered.

#### confirmation

\`\`\`json
{ "kind": "confirmation", "confirmed": true }
\`\`\`

\`confirmed\` is true when the customer ticked the checkbox. For \`project_services\` it means the
customer confirmed the services listed under \`services\`.

#### files

\`\`\`json
{
  "kind": "files",
  "files": [
    {
      "fileId": "7c1e...",
      "name": "logo.svg",
      "kind": "image",
      "status": "included",
      "path": "files/shared/logo.svg",
      "url": null,
      "note": "Main logo, please use the dark version",
      "usedIn": [
        { "blockKey": "brand_assets", "groupKey": null, "entryNumber": null, "fieldKey": "logo" },
        { "blockKey": "media_assets", "groupKey": null, "entryNumber": null, "fieldKey": "photos" }
      ]
    }
  ]
}
\`\`\`

| Property | Meaning |
| --- | --- |
| \`fileId\` | Id of the file. The same file in several questions has the same id. Null without access. |
| \`name\` | Original filename or link title. |
| \`kind\` | \`document\`, \`image\`, \`video\`, \`font\` or \`link\`. |
| \`status\` | Whether the file is in this archive, see below. |
| \`path\` | Where the file lies in this archive; only set when \`status\` is \`included\`. |
| \`url\` | Target of a link (e.g. a shared drive or an existing website); null for uploads. |
| \`note\` | Comment the customer added to the file. |
| \`usedIn\` | Every question the file is attached to, in questionnaire order, this one included. More than one entry means the customer reused the same file. Empty without access. |

Each \`usedIn\` entry names one question:

| Property | Meaning |
| --- | --- |
| \`blockKey\` | Key of the block. |
| \`groupKey\` | Key of the group the question sits in; null outside a group. |
| \`entryNumber\` | Which group entry, starting at 1 (e.g. team member 2); null outside a group. |
| \`fieldKey\` | Key of the files question itself. |

| \`status\` | Meaning |
| --- | --- |
| \`included\` | The file is in this archive at \`path\`. |
| \`link\` | Not a file but a link; see \`url\`. |
| \`video\` | A video. Videos are not packed into the archive. |
| \`size_limit\` | Left out because the archive reached its size limit. |
| \`timeout\` | Left out because packing ran out of time. |
| \`unreadable\` | The storage could not deliver the file. |
| \`no_access\` | A file exists, but the person who exported may not open it. Nothing else is known. |

Anything other than \`included\` still means: *the customer provided this*, it is only missing
from the archive.

File reading stops 96 seconds after the export request starts, including preparation time.
The archive then finishes with the answers and this README. A file interrupted while reading,
and any upload not started before the deadline, has \`status: "timeout"\` and \`path: null\`.
An interrupted file may leave partial bytes in the ZIP. Use only files marked \`included\`;
ignore any other file entries in the ZIP.

#### group

A group repeats a set of questions, e.g. one entry per team member or per reference project.

\`\`\`json
{
  "kind": "group",
  "questions": [ { "key": "member_name", "type": "short_text", "answered": false, "...": "..." } ],
  "entries": [
    { "number": 1, "fields": [ { "key": "member_name", "answer": { "kind": "text", "value": "Anna" } } ] }
  ]
}
\`\`\`

| Property | Meaning |
| --- | --- |
| \`questions\` | The sub-questions once, without answers, so they are known even when the group has no entry. |
| \`entries\` | One item per repetition. No entries means the customer added none. |
| \`entries[].number\` | Position of the entry, starting at 1; also the \`entry-<n>\` folder of its files. |
| \`entries[].fields\` | The sub-questions answered for this entry, shaped like any other question. |

## Turning the export into a project brief

- Go block by block; the block keys tell the topic (company, audience, offers, tone, brand,
  design, references, media, existing website, SEO, domain, contact, legal).
- Quote the customer's own words where it matters (tone, values, claims).
- Mark unanswered required questions and blocks with \`reviewStatus: "clarification"\` as open
  points instead of guessing.
- Look at the files in \`files/\` for logos, brand guides, photos and fonts; use \`usedIn\` to see
  which question a file answers.
- Treat \`reviewNote\` as the agency's internal remark, not as a customer requirement.
`;
