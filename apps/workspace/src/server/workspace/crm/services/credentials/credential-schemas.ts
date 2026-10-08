import { z } from "zod";
import { credentialRequestSchemas as shared } from "@/server/shared/services/credential/credential-request-schemas";

const { version, projectId } = shared;
const editable = {
  projectId: projectId.optional(),
  ...shared.editableFields,
  visibleToCustomer: z.boolean().optional(),
};

export const credentialSchemas = {
  id: shared.id,
  list: z.strictObject({ projectId: projectId.optional() }),
  create: z.strictObject({
    projectId,
    ...shared.fields,
    visibleToCustomer: z.boolean().optional(),
  }),
  update: z
    .strictObject({ ...editable, version })
    .refine((input) => Object.keys(editable).some((key) => key in input)),
  delete: z.strictObject({ version }),
  portalVisibility: z.strictObject({
    version,
    visibleToCustomer: z.boolean(),
  }),
  reveal: shared.reveal,
};
