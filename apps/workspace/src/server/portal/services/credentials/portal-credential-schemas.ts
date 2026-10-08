import "server-only";
import { z } from "zod";
import { credentialRequestSchemas as shared } from "@/server/shared/services/credential/credential-request-schemas";

/**
 * Strict on purpose: `projectId` on an update, `visibleToCustomer` or a `customerId` anywhere are
 * unknown fields and fail validation instead of being ignored.
 */
export const portalCredentialSchemas = {
  id: shared.id,
  create: z.strictObject({ projectId: shared.projectId, ...shared.fields }),
  update: z
    .strictObject({ ...shared.editableFields, version: shared.version })
    .refine((input) =>
      Object.keys(shared.editableFields).some((key) => key in input),
    ),
  reveal: shared.reveal,
};
