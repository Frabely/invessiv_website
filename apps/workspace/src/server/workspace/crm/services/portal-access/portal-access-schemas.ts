import "server-only";

import { z } from "zod";

const version = z.number().int().positive();

export const portalAccessSchemas = {
  invite: z.object({
    assignmentId: z.uuid(),
    roleIds: z.array(z.uuid()).min(1),
    emailNotificationsEnabled: z.boolean(),
  }),
  preview: z.object({ version }),
  membershipRoles: z.object({ version, roleIds: z.array(z.uuid()).min(1) }),
  membershipNotifications: z.object({
    version,
    emailNotificationsEnabled: z.boolean(),
  }),
} as const;
