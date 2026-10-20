import type { getDatabaseClient } from "@invessiv/db/core";

export type CrmSmokeContext = {
  sql: ReturnType<typeof getDatabaseClient>;
  memberId: string;
  name: (suffix: string) => string;
  insertCustomer: (displayName: string) => Promise<string>;
  expectRejected: (
    name: string,
    run: () => Promise<unknown>,
    constraint?: string,
  ) => Promise<void>;
  expectAccepted: (name: string, run: () => Promise<unknown>) => Promise<void>;
};
