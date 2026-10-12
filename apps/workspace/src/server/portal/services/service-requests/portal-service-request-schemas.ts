import "server-only";
import { z } from "zod";
import { ServiceRequestFieldLimits } from "@invessiv/common/constants/crm/forms/service-request-field-limits";
import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";
import {
  SERVICE_REQUEST_PROJECT_WISH_VALUES,
  ServiceRequestProjectWish,
} from "@invessiv/common/constants/crm/service-request-project-wishes";
import { PortalServiceRequestLimits } from "@invessiv/common/constants/portal/portal-service-request-limits";

/**
 * Strict on purpose: a `customerId`, a price or a `kind` are unknown fields and fail validation
 * instead of being ignored. What the chosen service allows on top is decided by the command.
 */
export const portalServiceRequestSchemas = {
  id: z.uuid(),
  create: z
    .strictObject({
      idempotencyKey: z.uuid(),
      lineItemTemplateId: z.uuid().nullable(),
      title: z
        .string()
        .trim()
        .min(1)
        .max(ServiceRequestFieldLimits.TitleMaxLength)
        .nullable(),
      note: z.string().trim().max(ServiceRequestFieldLimits.NoteMaxLength),
      requestedMinutes: z
        .int()
        .min(PortalServiceRequestLimits.MinRequestedMinutes)
        .max(PortalServiceRequestLimits.MaxRequestedMinutes)
        .multipleOf(HoursLimits.StepMinutes)
        .nullable(),
      projectWish: z.enum(SERVICE_REQUEST_PROJECT_WISH_VALUES),
      projectId: z.uuid().nullable(),
    })
    .refine(
      (input) =>
        (input.projectWish === ServiceRequestProjectWish.Existing) ===
        (input.projectId !== null),
    ),
};
