/**
 * Synthetic CRM sample data for development and preview.
 *
 * Stays deliberately optional: without seeding, the empty states of the following units
 * remain verifiable. Every run resets its own fixture rows and recreates them, so it is
 * repeatable.
 *
 * Grows along: every unit that adds new schema extends this script (definition of done
 * in `plans/crm/AGENTS.md`).
 */
import { randomUUID } from "node:crypto";
import { inArray, like } from "drizzle-orm";

import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  activities,
  customerContactAssignments,
  customers,
  leadCategories,
  people,
  serviceTemplates,
  users,
  workspaceMemberRoles,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { SystemActorKey } from "@invessiv/common/constants/activity/system-actor-keys";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { SYSTEM_ROLE_DEFINITIONS } from "@invessiv/common/constants/auth/system-role-definitions";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import { CustomerStatus } from "@invessiv/common/constants/crm/customer-statuses";
import { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { ServiceTemplateStatus } from "@invessiv/common/constants/crm/service-template-statuses";
import { Locale } from "@invessiv/common/contracts/i18n/locale";
import {
  configureDatabaseUrlFromTarget,
  type DatabaseTarget,
  parseDatabaseTarget,
} from "./database-target";

const FIXTURE_PREFIX = "fixture:crm:";
const ALLOWED_SEED_TARGETS: DatabaseTarget[] = ["development", "preview"];

type PersonFixture = {
  key: string;
  displayName: string;
  firstName: string;
  lastName: string;
  primaryEmail: string;
  primaryPhone: string | null;
  preferredLocale: (typeof Locale)[keyof typeof Locale];
};

type CustomerFixture = {
  key: string;
  displayName: string;
  companyName: string | null;
  status: (typeof CustomerStatus)[keyof typeof CustomerStatus];
  city: string | null;
  street: string | null;
  postalCode: string | null;
  websiteUrl: string | null;
  vatId: string | null;
  defaultHourlyRateCents: number | null;
  retentionReviewAfterDays: number | null;
  categorySlug: string | null;
  /** The first entry is the primary contact. */
  contacts: { personKey: string; roleLabel: string; businessEmail?: string }[];
};

const PEOPLE: PersonFixture[] = [
  {
    key: "anna",
    displayName: "Anna Berger",
    firstName: "Anna",
    lastName: "Berger",
    primaryEmail: "anna.berger@example.test",
    primaryPhone: "+49 221 1000001",
    preferredLocale: Locale.De,
  },
  {
    key: "bernd",
    displayName: "Bernd Kluge",
    firstName: "Bernd",
    lastName: "Kluge",
    primaryEmail: "bernd.kluge@example.test",
    primaryPhone: "+49 30 1000002",
    preferredLocale: Locale.De,
  },
  {
    key: "clara",
    displayName: "Clara Vogt",
    firstName: "Clara",
    lastName: "Vogt",
    primaryEmail: "clara.vogt@example.test",
    primaryPhone: null,
    preferredLocale: Locale.En,
  },
  {
    key: "dario",
    displayName: "Dario Lentz",
    firstName: "Dario",
    lastName: "Lentz",
    primaryEmail: "dario.lentz@example.test",
    primaryPhone: "+49 89 1000004",
    preferredLocale: Locale.De,
  },
];

const CUSTOMERS: CustomerFixture[] = [
  {
    key: "nordlicht",
    displayName: "Nordlicht Coaching",
    companyName: "Nordlicht Coaching GmbH",
    status: CustomerStatus.Active,
    city: "Hamburg",
    street: "Hafenstraße 14",
    postalCode: "20359",
    websiteUrl: "https://nordlicht.example.test",
    vatId: "DE100000001",
    defaultHourlyRateCents: 9500,
    retentionReviewAfterDays: null,
    categorySlug: "coaches",
    contacts: [
      {
        personKey: "anna",
        roleLabel: "Geschäftsführung",
        businessEmail: "a.berger@nordlicht.example.test",
      },
      { personKey: "bernd", roleLabel: "Marketing" },
    ],
  },
  {
    key: "kluge-bau",
    displayName: "Kluge Bau",
    companyName: "Kluge Bau GmbH",
    status: CustomerStatus.Active,
    city: "Berlin",
    street: "Chausseestraße 8",
    postalCode: "10115",
    websiteUrl: "https://kluge-bau.example.test",
    vatId: null,
    defaultHourlyRateCents: 8500,
    retentionReviewAfterDays: null,
    categorySlug: "craftspeople",
    // Same person as at Nordlicht — the intended multi-company case.
    contacts: [{ personKey: "bernd", roleLabel: "Inhaber" }],
  },
  {
    key: "vogt-consulting",
    displayName: "Vogt Consulting",
    companyName: "Vogt Consulting",
    status: CustomerStatus.Paused,
    city: "München",
    street: null,
    postalCode: null,
    websiteUrl: null,
    vatId: null,
    defaultHourlyRateCents: null,
    retentionReviewAfterDays: 365,
    categorySlug: "consultants",
    contacts: [{ personKey: "clara", roleLabel: "Partnerin" }],
  },
  {
    key: "dario-lentz",
    displayName: "Dario Lentz",
    companyName: null,
    status: CustomerStatus.Archived,
    city: "Köln",
    street: null,
    postalCode: null,
    websiteUrl: null,
    vatId: null,
    defaultHourlyRateCents: null,
    retentionReviewAfterDays: null,
    categorySlug: null,
    contacts: [{ personKey: "dario", roleLabel: "Privatkunde" }],
  },
];

const SERVICE_TEMPLATE_FIXTURES = [
  {
    id: "9c8f1a10-1b1a-4a10-8e10-00000000f001",
    title: "Conversion-Workshop",
    description:
      "Gemeinsame Priorisierung von Zielgruppe, Angebot und nächstem Conversion-Schritt.",
    price_cents: 45000,
    pricing_mode: ServicePricingMode.OneTime,
    recurring_interval: null,
    status: ServiceTemplateStatus.Active,
    version: 1,
  },
  {
    id: "9c8f1a10-1b1a-4a10-8e10-00000000f002",
    title: "Contentpflege",
    description:
      "Monatliche Pflege bestehender Inhalte inklusive kleiner Text- und Bildänderungen.",
    price_cents: 25000,
    pricing_mode: ServicePricingMode.Recurring,
    recurring_interval: BillingInterval.Monthly,
    status: ServiceTemplateStatus.Active,
    version: 1,
  },
  {
    id: "9c8f1a10-1b1a-4a10-8e10-00000000f003",
    title: "Legacy-Supportpaket",
    description:
      "Archiviertes Beispiel für einen nicht mehr angebotenen Supportumfang.",
    price_cents: 15000,
    pricing_mode: ServicePricingMode.Rate,
    recurring_interval: null,
    status: ServiceTemplateStatus.Archived,
    version: 1,
  },
] as const;

async function resolveCategoryIds(tx: ContactDatabaseTransaction) {
  const slugs = CUSTOMERS.map((customer) => customer.categorySlug).filter(
    (slug): slug is string => slug !== null,
  );

  if (slugs.length === 0) {
    return new Map<string, string>();
  }

  const rows = await tx
    .select({ id: leadCategories.id, slug: leadCategories.slug })
    .from(leadCategories)
    .where(inArray(leadCategories.slug, slugs));

  return new Map(rows.map((row) => [row.slug, row.id]));
}

async function resetFixtureRows(tx: ContactDatabaseTransaction) {
  const pattern = `${FIXTURE_PREFIX}%`;

  await tx.delete(serviceTemplates).where(
    inArray(
      serviceTemplates.id,
      SERVICE_TEMPLATE_FIXTURES.map((serviceTemplate) => serviceTemplate.id),
    ),
  );

  const fixtureCustomers = await tx
    .select({ id: customers.id })
    .from(customers)
    .where(like(customers.notes, pattern));

  if (fixtureCustomers.length > 0) {
    await tx.delete(customerContactAssignments).where(
      inArray(
        customerContactAssignments.customer_id,
        fixtureCustomers.map((row) => row.id),
      ),
    );
    await tx.delete(customers).where(like(customers.notes, pattern));
  }

  await tx.delete(people).where(like(people.notes, pattern));

  const fixtureUsers = await tx
    .select({ id: users.id })
    .from(users)
    .where(like(users.clerk_user_id, pattern));

  if (fixtureUsers.length === 0) {
    return;
  }

  const userIds = fixtureUsers.map((row) => row.id);
  const fixtureMembers = await tx
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(inArray(workspaceMembers.user_id, userIds));

  if (fixtureMembers.length > 0) {
    const memberIds = fixtureMembers.map((row) => row.id);
    await tx
      .delete(workspaceMemberRoles)
      .where(inArray(workspaceMemberRoles.workspace_member_id, memberIds));
    await tx
      .delete(workspaceMembers)
      .where(inArray(workspaceMembers.id, memberIds));
  }

  await tx.delete(users).where(inArray(users.id, userIds));
}

/**
 * The fixture member deliberately holds the member role, not the owner role: an active fixture
 * owner would close the owner bootstrap for the developer's real Clerk account.
 */
async function createFixtureMember(tx: ContactDatabaseTransaction) {
  const userId = randomUUID();
  const memberId = randomUUID();

  await tx.insert(users).values({
    id: userId,
    clerk_user_id: `${FIXTURE_PREFIX}member`,
    primary_email: "fixture-member@example.test",
    first_name: "Fixture",
    last_name: "Mitglied",
    display_name: "Fixture Mitglied",
    active: true,
    version: 1,
  });

  await tx.insert(workspaceMembers).values({
    id: memberId,
    user_id: userId,
    active: true,
    version: 1,
  });

  await tx.insert(workspaceMemberRoles).values({
    workspace_member_id: memberId,
    role_id: SYSTEM_ROLE_DEFINITIONS[SystemRoleKey.WorkspaceMember].id,
    role_realm: AuthRealm.Workspace,
    assigned_by_user_id: userId,
    assigned_at: new Date(),
  });

  return memberId;
}

async function run() {
  const target = parseDatabaseTarget(process.argv);

  if (!target) {
    throw new Error(
      `A database target is required. Use one of: ${ALLOWED_SEED_TARGETS.join(", ")}.`,
    );
  }

  if (!ALLOWED_SEED_TARGETS.includes(target)) {
    throw new Error(
      `Seeding is only allowed for: ${ALLOWED_SEED_TARGETS.join(", ")}.`,
    );
  }

  configureDatabaseUrlFromTarget(target);

  const db = getDrizzleDatabaseClient();

  await db.transaction(async (tx) => {
    await resetFixtureRows(tx);

    await tx.insert(serviceTemplates).values([...SERVICE_TEMPLATE_FIXTURES]);

    const ownerMemberId = await createFixtureMember(tx);
    const categoryIds = await resolveCategoryIds(tx);

    const personIds = new Map<string, string>();
    await tx.insert(people).values(
      PEOPLE.map((person) => {
        const id = randomUUID();
        personIds.set(person.key, id);
        return {
          id,
          display_name: person.displayName,
          first_name: person.firstName,
          last_name: person.lastName,
          primary_email: person.primaryEmail,
          primary_phone: person.primaryPhone,
          preferred_locale: person.preferredLocale,
          notes: `${FIXTURE_PREFIX}${person.key}`,
          version: 1,
        };
      }),
    );

    const customerIds = new Map<string, string>();
    await tx.insert(customers).values(
      CUSTOMERS.map((customer) => {
        const id = randomUUID();
        customerIds.set(customer.key, id);
        return {
          id,
          display_name: customer.displayName,
          company_name: customer.companyName,
          status: customer.status,
          owner_member_id: ownerMemberId,
          category_id: customer.categorySlug
            ? (categoryIds.get(customer.categorySlug) ?? null)
            : null,
          street: customer.street,
          postal_code: customer.postalCode,
          city: customer.city,
          country: "DE",
          website_url: customer.websiteUrl,
          vat_id: customer.vatId,
          notes: `${FIXTURE_PREFIX}${customer.key}`,
          default_hourly_rate_cents: customer.defaultHourlyRateCents,
          retention_review_after_days: customer.retentionReviewAfterDays,
          version: 1,
        };
      }),
    );

    await tx.insert(customerContactAssignments).values(
      CUSTOMERS.flatMap((customer) =>
        customer.contacts.map((contact, index) => ({
          id: randomUUID(),
          customer_id: customerIds.get(customer.key) as string,
          person_id: personIds.get(contact.personKey) as string,
          role_label: contact.roleLabel,
          business_email: contact.businessEmail ?? null,
          business_phone: null,
          is_primary: index === 0,
          version: 1,
        })),
      ),
    );

    const occurredAt = new Date();
    await tx.insert(activities).values(
      CUSTOMERS.map((customer) => ({
        id: randomUUID(),
        lead_id: null,
        customer_id: customerIds.get(customer.key) as string,
        project_id: null,
        type: ActivityType.Created,
        title: "Fixture customer created",
        body: null,
        metadata: { fixture: true },
        occurred_at: occurredAt,
        actor_type: ActorType.System,
        actor_user_id: null,
        system_actor_key: SystemActorKey.Fixture,
        actor_id: null,
        actor_label: "CRM fixture seeder",
        created_at: occurredAt,
      })),
    );
  });

  const contactCount = CUSTOMERS.reduce(
    (total, customer) => total + customer.contacts.length,
    0,
  );

  console.log(
    `Seeded ${CUSTOMERS.length} customers, ${PEOPLE.length} people, ${SERVICE_TEMPLATE_FIXTURES.length} service templates and ${contactCount} contact assignments.`,
  );
  console.log(`Fixture prefix: ${FIXTURE_PREFIX}`);
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
