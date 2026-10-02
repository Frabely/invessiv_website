import type { z } from "zod";

import type { customerSchemas } from "@/server/workspace/crm/services/customer-schemas";

export type ValidatedCreateCustomerInput = z.output<
  typeof customerSchemas.create
>;

export type ValidatedUpdateCustomerInput = z.output<
  typeof customerSchemas.update
>;

export type ValidatedPrimaryContactInput =
  ValidatedCreateCustomerInput["primaryContact"];
