import type { z } from "zod";

import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import type { customerSchemas } from "@/server/workspace/crm/services/customer-schemas";

/** Reads run on the pooled client or inside a transaction alike. */
export type CrmDatabaseExecutor = Pick<ContactDatabaseTransaction, "select">;

export type ValidatedCreateCustomerInput = z.output<
  typeof customerSchemas.create
>;

export type ValidatedUpdateCustomerInput = z.output<
  typeof customerSchemas.update
>;

export type ValidatedPrimaryContactInput =
  ValidatedCreateCustomerInput["primaryContact"];
