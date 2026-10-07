import { z } from "zod";
import { CREDENTIAL_LIMITS as L } from "@invessiv/common/constants/credentials/credential-limits";
import { CREDENTIAL_REVEAL_INTENT_VALUES } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import { CREDENTIAL_SECRET_FIELD_VALUES } from "@invessiv/common/constants/credentials/credential-secret-fields";
import { CREDENTIAL_TYPE_VALUES } from "@invessiv/common/constants/credentials/credential-types";

/** Optional plaintext column: trimmed, and an empty input means "no value". */
function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((value) => (value === "" ? null : value));
}

const version = z.int().positive();
const projectId = z.uuid().nullable();
const title = z.string().trim().min(1).max(L.titleMax);
const credentialType = z.enum(CREDENTIAL_TYPE_VALUES);
const url = optionalText(L.urlMax);
const username = optionalText(L.usernameMax);
// Not trimmed: leading or trailing spaces can be part of a password.
const secret = z.string().min(1).max(L.secretMax);
const note = optionalText(L.noteMax);

const editable = {
  projectId: projectId.optional(),
  title: title.optional(),
  credentialType: credentialType.optional(),
  url: url.optional(),
  username: username.optional(),
  secret: secret.optional(),
  note: note.optional(),
};

export const credentialSchemas = {
  id: z.uuid(),
  list: z.strictObject({ projectId: projectId.optional() }),
  create: z.strictObject({
    projectId,
    title,
    credentialType,
    url,
    username,
    secret,
    note,
  }),
  update: z
    .strictObject({ ...editable, version })
    .refine((input) => Object.keys(editable).some((key) => key in input)),
  delete: z.strictObject({ version }),
  reveal: z.strictObject({
    field: z.enum(CREDENTIAL_SECRET_FIELD_VALUES),
    intent: z.enum(CREDENTIAL_REVEAL_INTENT_VALUES),
  }),
};
