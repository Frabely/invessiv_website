/**
 * Credential part of `db:smoke:crm`: what Postgres itself must enforce for `customer_credentials`,
 * plus the "missing business value is rejected" guard. The ciphertext columns hold placeholders;
 * the format is the cipher's concern and covered by its unit tests.
 */
import { randomUUID } from "node:crypto";

import type { getDatabaseClient } from "@invessiv/db/core";
import { CustomerCredentialsConstraintName as C } from "@invessiv/db/constraint-names/crm/customer-credentials-constraint-names";

type Sql = ReturnType<typeof getDatabaseClient>;

export type CredentialSmokeContext = {
  sql: Sql;
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

const PLACEHOLDER_CIPHERTEXT = "v1.1.smoke.smoke";

type CredentialArgs = {
  customerId: string;
  projectId?: string | null;
  title?: string;
  credentialType?: string;
  visibleToCustomer?: boolean;
  createdBySide?: string;
  memberId?: string | null;
  portalMembershipId?: string | null;
  version?: number;
};

export async function runCredentialChecks(context: CredentialSmokeContext) {
  const { sql, memberId, name, expectRejected, expectAccepted } = context;
  const customerId = await context.insertCustomer(name("Credential customer"));
  const otherCustomerId = await context.insertCustomer(
    name("Credential other customer"),
  );
  const insertProject = async (ownerCustomerId: string) => {
    const id = randomUUID();
    await sql`
      INSERT INTO projects (id, customer_id, owner_member_id, title, status, phase, process_steps,
                            current_process_step, workflow_key, billing_model, included_feedback_rounds,
                            feedback_round_positions, version)
      VALUES (${id}, ${ownerCustomerId}, ${memberId}, ${name("Credential project")}, 'active', 'onboarding',
              ARRAY ['Design', 'Launch'], 'Design', 'standard_web_v1', 'fixed_price', 2, ARRAY [1, 1], 1)
    `;
    return id;
  };
  const projectId = await insertProject(customerId);
  const foreignProjectId = await insertProject(otherCustomerId);

  const insertCredential = (args: CredentialArgs) => sql`
    INSERT INTO customer_credentials (id, customer_id, project_id, title, credential_type, secret_ciphertext,
                                      visible_to_customer, created_by_side, created_by_member_id,
                                      created_by_portal_membership_id, secret_changed_at, version)
    VALUES (${randomUUID()}, ${args.customerId}, ${args.projectId ?? null}, ${args.title ?? name("Credential")},
            ${args.credentialType ?? "hosting"}, ${PLACEHOLDER_CIPHERTEXT}, ${args.visibleToCustomer ?? false},
            ${args.createdBySide ?? "internal"}, ${args.memberId === undefined ? memberId : args.memberId},
            ${args.portalMembershipId ?? null}, NOW(), ${args.version ?? 1})
  `;

  await expectAccepted("customer-wide credential is accepted", () =>
    insertCredential({ customerId }),
  );
  await expectAccepted("project credential is accepted", () =>
    insertCredential({ customerId, projectId }),
  );

  await expectRejected(
    "credential with a project of another customer is rejected",
    () => insertCredential({ customerId, projectId: foreignProjectId }),
    C.ProjectCustomerForeignKey,
  );
  // CHECKs run before the foreign keys, so a random membership id is enough to reach them.
  await expectRejected(
    "customer credential that is not visible to the customer is rejected",
    () =>
      insertCredential({
        customerId,
        createdBySide: "customer",
        memberId: null,
        portalMembershipId: randomUUID(),
        visibleToCustomer: false,
      }),
    C.CustomerVisibleCheck,
  );
  await expectRejected(
    "credential with two origins is rejected",
    () => insertCredential({ customerId, portalMembershipId: randomUUID() }),
    C.OriginCheck,
  );
  await expectRejected(
    "credential without an origin is rejected",
    () => insertCredential({ customerId, memberId: null }),
    C.OriginCheck,
  );
  await expectRejected(
    "internal credential that names only a portal membership is rejected",
    () =>
      insertCredential({
        customerId,
        memberId: null,
        portalMembershipId: randomUUID(),
      }),
    C.OriginCheck,
  );
  await expectRejected(
    "credential with a blank title is rejected",
    () => insertCredential({ customerId, title: "   " }),
    C.TitleCheck,
  );
  await expectRejected(
    "credential with a title above the limit is rejected",
    () => insertCredential({ customerId, title: name("x".repeat(121)) }),
    C.TitleCheck,
  );
  await expectRejected(
    "credential with version 0 is rejected",
    () => insertCredential({ customerId, version: 0 }),
    C.VersionCheck,
  );
  await expectRejected(
    "credential with an unknown type is rejected",
    () => insertCredential({ customerId, credentialType: "ftp" }),
    C.TypeCheck,
  );

  await expectRejected(
    "credential without visible_to_customer is rejected",
    () => sql`
      INSERT INTO customer_credentials (id, customer_id, title, credential_type, secret_ciphertext, created_by_side,
                                        created_by_member_id, secret_changed_at, version)
      VALUES (${randomUUID()}, ${customerId}, ${name("No visibility")}, 'hosting', ${PLACEHOLDER_CIPHERTEXT},
              'internal', ${memberId}, NOW(), 1)
    `,
  );
  await expectRejected(
    "credential without version is rejected",
    () => sql`
      INSERT INTO customer_credentials (id, customer_id, title, credential_type, secret_ciphertext,
                                        visible_to_customer, created_by_side, created_by_member_id, secret_changed_at)
      VALUES (${randomUUID()}, ${customerId}, ${name("No version")}, 'hosting', ${PLACEHOLDER_CIPHERTEXT}, FALSE,
              'internal', ${memberId}, NOW())
    `,
  );
  await expectRejected(
    "credential without secret_changed_at is rejected",
    () => sql`
      INSERT INTO customer_credentials (id, customer_id, title, credential_type, secret_ciphertext,
                                        visible_to_customer, created_by_side, created_by_member_id, version)
      VALUES (${randomUUID()}, ${customerId}, ${name("No secret date")}, 'hosting', ${PLACEHOLDER_CIPHERTEXT}, FALSE,
              'internal', ${memberId}, 1)
    `,
  );
}

/** Credentials reference projects without a cascade, so they go before the projects. */
export async function cleanupCredentialFixtures(sql: Sql, pattern: string) {
  await sql`DELETE
            FROM customer_credentials
            WHERE customer_id IN (SELECT id FROM customers WHERE display_name LIKE ${pattern})`;
}
