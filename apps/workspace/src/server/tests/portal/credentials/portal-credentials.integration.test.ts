import { randomBytes } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { PORTAL_READ_PERMISSION_VALUES } from "@invessiv/common/constants/auth/permission-definitions";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SYSTEM_ROLE_DEFINITIONS } from "@invessiv/common/constants/auth/system-role-definitions";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import { CredentialApiErrorCode as E } from "@invessiv/common/constants/credentials/credential-api-error-code";
import { CREDENTIAL_LIMITS } from "@invessiv/common/constants/credentials/credential-limits";
import { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import { CredentialSide } from "@invessiv/common/constants/credentials/credential-sides";
import { CredentialType } from "@invessiv/common/constants/credentials/credential-types";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { SystemMessageKey } from "@invessiv/common/constants/crm/system-message-keys";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { CreateCredentialRequestDto } from "@invessiv/common/contracts/credentials/create-credential-request.dto";
import type { CreatePortalCredentialRequestDto } from "@invessiv/common/contracts/portal/create-portal-credential-request.dto";
import {
  customerCredentials,
  messages,
  projects,
  securityEvents,
} from "@invessiv/db/record-configuration";
import { createPortalActor } from "@/server/portal/auth/portal-actor";
import { createPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import { createPortalCredential } from "@/server/portal/command-handler/create-portal-credential.command-handler";
import { revealPortalCredential } from "@/server/portal/command-handler/reveal-portal-credential.command-handler";
import { updatePortalCredential } from "@/server/portal/command-handler/update-portal-credential.command-handler";
import { getPortalCredentialsSummary } from "@/server/portal/query-handler/get-portal-credentials-summary.query-handler";
import { listPortalCredentials } from "@/server/portal/query-handler/list-portal-credentials.query-handler";
import { createCredential } from "@/server/workspace/crm/command-handler/create-credential.command-handler";
import { revealCredential } from "@/server/workspace/crm/command-handler/reveal-credential.command-handler";
import { setCredentialPortalVisibility } from "@/server/workspace/crm/command-handler/set-credential-portal-visibility.command-handler";
import { listCustomerCredentials } from "@/server/workspace/crm/query-handler/list-customer-credentials.query-handler";
import { createFileTestFixture } from "../../shared/files/file-test-fixture";

vi.mock("server-only", () => ({}));

const KEYRING_VARIABLE = "CRM_CREDENTIALS_KEYRING";
const SECRET = "Portal-Secret-ß🔐-marker";
const NOTE = "Portal-Note-marker\nsecond line";
const TITLE = "Portal-Title-marker";
const CREDENTIAL_ROLE = [
  Permission.PortalAccess,
  ...SYSTEM_ROLE_DEFINITIONS[SystemRoleKey.PortalCredentials].permissions,
];

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "portal credentials PostgreSQL integration",
  () => {
    const f = createFileTestFixture();
    const keyring = `1:${randomBytes(32).toString("base64")}`;
    const userId = f.actor().userId;
    const customerIds = [f.customerId, f.foreignCustomerId];

    const admin = () =>
      f.actor({
        permissions: new Set([
          Permission.CredentialsRead,
          Permission.CredentialsWrite,
          Permission.CredentialsReveal,
        ]),
      });
    function contact(
      permissions: readonly Permission[] = CREDENTIAL_ROLE,
      customerId = f.customerId,
    ) {
      return createPortalActor({
        userId,
        membershipId: f.membershipId,
        customerId,
        personId: f.personId,
        firstName: null,
        permissions: new Set(permissions),
        projectPermissions: new Map(),
      });
    }
    const owner = () =>
      createPortalOwnerView({
        userId,
        customerId: f.customerId,
        permissions: new Set(PORTAL_READ_PERMISSION_VALUES),
      });

    /** Events are append-only; fixtures remove their own under the maintenance switch. */
    async function clearEvents() {
      await f.database().transaction(async (tx) => {
        await tx.execute(
          sql`select set_config('invessiv.security_event_maintenance', 'on', true)`,
        );
        await tx
          .delete(securityEvents)
          .where(eq(securityEvents.actor_user_id, userId));
      });
    }
    const events = () =>
      f
        .database()
        .select()
        .from(securityEvents)
        .where(eq(securityEvents.actor_user_id, userId));
    const storedRow = async (id: string) => {
      const [row] = await f
        .database()
        .select()
        .from(customerCredentials)
        .where(eq(customerCredentials.id, id));
      return row;
    };
    const clearCredentials = () =>
      f
        .database()
        .delete(customerCredentials)
        .where(inArray(customerCredentials.customer_id, customerIds));
    const notices = (key: SystemMessageKey) =>
      f
        .database()
        .select({ body: messages.body, metadata: messages.metadata })
        .from(messages)
        .where(
          and(eq(messages.customer_id, f.customerId), eq(messages.body, key)),
        );
    const setProjectStatus = (status: ProjectStatus) =>
      f
        .database()
        .update(projects)
        .set({ status })
        .where(eq(projects.id, f.projectId));

    const internalInput = (
      overrides: Partial<CreateCredentialRequestDto> = {},
    ): CreateCredentialRequestDto => ({
      projectId: null,
      title: TITLE,
      credentialType: CredentialType.Hosting,
      url: "https://example.com/login",
      username: "deploy@example.com",
      secret: SECRET,
      note: NOTE,
      ...overrides,
    });
    /** An internal entry; released unless stated otherwise. */
    async function internal(
      overrides: Partial<CreateCredentialRequestDto> = {},
      options: { released?: boolean; customerId?: string } = {},
    ) {
      const created = await createCredential(
        options.customerId ?? f.customerId,
        internalInput(overrides),
        admin(),
      );
      if (!created.ok) throw new Error("Expected the internal credential");
      if (options.released === false) return created.value;
      const released = await setCredentialPortalVisibility(
        created.value.id,
        { version: created.value.version, visibleToCustomer: true },
        admin(),
      );
      if (!released.ok) throw new Error("Expected the release");
      return released.value;
    }
    const portalInput = (
      overrides: Partial<CreatePortalCredentialRequestDto> = {},
    ): CreatePortalCredentialRequestDto => ({
      projectId: null,
      title: TITLE,
      credentialType: CredentialType.Email,
      url: null,
      username: "office@example.com",
      secret: SECRET,
      note: null,
      ...overrides,
    });
    const show = (
      id: string,
      actor = contact(),
      field: CredentialSecretField = CredentialSecretField.Secret,
    ) =>
      revealPortalCredential(actor, id, {
        field,
        intent: CredentialRevealIntent.Show,
      });
    const listedIds = async (
      reader: Parameters<typeof listPortalCredentials>[0],
    ) => {
      const result = await listPortalCredentials(reader);
      return result.ok
        ? result.value.credentials.map((entry) => entry.id)
        : null;
    };

    beforeAll(async () => {
      await f.setup();
      vi.stubEnv(KEYRING_VARIABLE, keyring);
    }, 60_000);
    beforeEach(async () => {
      vi.stubEnv(KEYRING_VARIABLE, keyring);
      await setProjectStatus(ProjectStatus.Active);
      await clearCredentials();
      await clearEvents();
    });
    afterAll(async () => {
      vi.unstubAllEnvs();
      vi.restoreAllMocks();
      await clearEvents();
      await clearCredentials();
      await f.cleanup();
    }, 60_000);

    it("shows a contact only the released entries of the own company", async () => {
      const own = await internal();
      const hidden = await internal({}, { released: false });
      const foreign = await internal({}, { customerId: f.foreignCustomerId });
      await clearEvents();

      expect(await listedIds(contact())).toEqual([own.id]);
      expect(await getPortalCredentialsSummary(contact())).toEqual({
        count: 1,
        canWrite: true,
        configured: true,
      });
      expect(
        await listedIds(contact(CREDENTIAL_ROLE, f.foreignCustomerId)),
      ).toEqual([foreign.id]);

      for (const id of [foreign.id, hidden.id, crypto.randomUUID(), "nope"])
        expect(await show(id)).toEqual({ ok: false, code: E.NotFound });
      expect(
        await updatePortalCredential(contact(), foreign.id, {
          version: foreign.version,
          title: "Taken over",
        }),
      ).toEqual({ ok: false, code: E.NotFound });
      expect(await events()).toHaveLength(0);
      expect((await storedRow(foreign.id)).title).toBe(TITLE);
    });

    it("hides entries of a project the portal no longer shows", async () => {
      const entry = await internal({ projectId: f.projectId });
      await clearEvents();
      expect(await listedIds(contact())).toEqual([entry.id]);

      await setProjectStatus(ProjectStatus.Archived);

      expect(await listedIds(contact())).toEqual([]);
      expect(await getPortalCredentialsSummary(contact())).toMatchObject({
        count: 0,
      });
      expect(await show(entry.id)).toEqual({ ok: false, code: E.NotFound });
      expect(
        await updatePortalCredential(contact(), entry.id, {
          version: entry.version,
          title: "Changed",
        }),
      ).toEqual({ ok: false, code: E.NotFound });
      expect(await events()).toHaveLength(0);
    });

    it("keeps the standard role and a missing right outside", async () => {
      const entry = await internal();
      await clearEvents();
      const standard = contact(
        SYSTEM_ROLE_DEFINITIONS[SystemRoleKey.PortalStandard].permissions,
      );

      expect(await listPortalCredentials(standard)).toEqual({
        ok: false,
        code: E.NotFound,
      });
      expect(await getPortalCredentialsSummary(standard)).toBeNull();
      expect(await show(entry.id, standard)).toEqual({
        ok: false,
        code: E.NotFound,
      });
      expect(await createPortalCredential(standard, portalInput())).toEqual({
        ok: false,
        code: E.NotFound,
      });

      // Read alone neither reveals nor writes.
      const reader = contact([Permission.PortalCredentialsRead]);
      expect(await listedIds(reader)).toEqual([entry.id]);
      expect(await show(entry.id, reader)).toEqual({
        ok: false,
        code: E.NotFound,
      });
      expect(
        await updatePortalCredential(reader, entry.id, {
          version: entry.version,
          title: "Changed",
        }),
      ).toEqual({ ok: false, code: E.NotFound });
      expect(await events()).toHaveLength(0);
    });

    it("gives the owner view metadata without any capability", async () => {
      const entry = await internal();
      const listed = await listPortalCredentials(owner());

      expect(await getPortalCredentialsSummary(owner())).toEqual({
        count: 1,
        canWrite: false,
        configured: true,
      });
      expect(listed).toMatchObject({
        ok: true,
        value: {
          credentials: [{ id: entry.id, hasNote: true }],
          capabilities: { canWrite: false, canReveal: false },
          configured: true,
        },
      });
    });

    it("lists metadata only, without plaintext or ciphertext", async () => {
      const entry = await internal({ projectId: f.projectId });
      const row = await storedRow(entry.id);
      const listed = await listPortalCredentials(contact());

      expect(listed).toMatchObject({
        ok: true,
        value: {
          credentials: [
            {
              id: entry.id,
              projectId: f.projectId,
              title: TITLE,
              hasNote: true,
              createdByCustomer: false,
              version: entry.version,
            },
          ],
          capabilities: { canWrite: true, canReveal: true },
        },
      });
      if (!listed.ok) throw new Error("Expected the list");
      expect(listed.value.projects.map((project) => project.id)).toContain(
        f.projectId,
      );
      const serialized = JSON.stringify(listed);
      for (const forbidden of [
        SECRET,
        "Portal-Note-marker",
        row.secret_ciphertext,
        row.note_ciphertext!,
        "ciphertext",
        "lastRevealedAt",
        "visibleToCustomer",
        f.customerId,
        f.memberId,
      ])
        expect(serialized).not.toContain(forbidden);
    });

    it("reveals one field with exactly one customer event", async () => {
      const entry = await internal();
      await clearEvents();

      expect(await show(entry.id)).toEqual({
        ok: true,
        value: { value: SECRET },
      });
      expect(
        await show(entry.id, contact(), CredentialSecretField.Note),
      ).toEqual({ ok: true, value: { value: NOTE } });

      const written = await events();
      expect(written).toHaveLength(2);
      for (const event of written) {
        expect(event.type).toBe(SecurityEventType.CredentialRevealed);
        expect(event.actor_type).toBe(ActorType.Customer);
        expect(event.subject_id).toBe(entry.id);
        expect(JSON.stringify(event.metadata)).not.toContain(TITLE);
      }
      const row = await storedRow(entry.id);
      expect(row.last_revealed_at).not.toBeNull();
      expect(row.version).toBe(entry.version);
      const internalList = await listCustomerCredentials(
        f.customerId,
        {},
        admin(),
      );
      expect(internalList).toMatchObject({
        ok: true,
        value: {
          credentials: [
            { lastRevealedAt: row.last_revealed_at!.toISOString() },
          ],
        },
      });
    });

    it("answers a missing note like a missing entry", async () => {
      const entry = await internal({ note: null });
      await clearEvents();

      expect(
        await show(entry.id, contact(), CredentialSecretField.Note),
      ).toEqual({ ok: false, code: E.NotFound });
      expect(await events()).toHaveLength(0);
    });

    it("limits reveals per contact and window", async () => {
      const entry = await internal({ note: null });
      await clearEvents();
      const limit = CREDENTIAL_LIMITS.revealsPerWindowPortal;

      for (let attempt = 0; attempt < limit; attempt += 1)
        expect(await show(entry.id)).toMatchObject({ ok: true });
      const limited = await show(entry.id);

      if (limited.ok || limited.code !== E.RateLimited)
        throw new Error("Expected the rate limit");
      expect(limited.retryAfterSeconds).toBeGreaterThanOrEqual(1);
      expect(JSON.stringify(limited)).not.toContain(SECRET);
      expect(await events()).toHaveLength(limit);
    }, 120_000);

    it("stores a customer entry encrypted, visible and announced without its title", async () => {
      const before = (await notices(SystemMessageKey.CredentialAddedByCustomer))
        .length;
      const created = await createPortalCredential(
        contact(),
        portalInput({ projectId: f.projectId, note: NOTE }),
      );

      if (!created.ok || !created.value.credential)
        throw new Error("Expected the created credential");
      expect(created.value).toMatchObject({
        created: true,
        credential: {
          projectId: f.projectId,
          createdByCustomer: true,
          hasNote: true,
          version: 1,
        },
      });
      const row = await storedRow(created.value.credential.id);
      expect(row).toMatchObject({
        customer_id: f.customerId,
        created_by_side: CredentialSide.Customer,
        created_by_portal_membership_id: f.membershipId,
        created_by_member_id: null,
        visible_to_customer: true,
      });
      expect(row.secret_ciphertext.startsWith("v1.")).toBe(true);
      expect(JSON.stringify(row)).not.toContain(SECRET);

      const written = await events();
      expect(written).toHaveLength(1);
      expect(written[0]).toMatchObject({
        type: SecurityEventType.CredentialCreated,
        actor_type: ActorType.Customer,
        subject_id: row.id,
      });
      const announced = await notices(
        SystemMessageKey.CredentialAddedByCustomer,
      );
      expect(announced).toHaveLength(before + 1);
      expect(JSON.stringify(announced)).not.toContain(TITLE);
      expect(JSON.stringify(announced)).not.toContain(SECRET);

      // The team reads what the customer handed over.
      expect(
        await revealCredential(
          row.id,
          {
            field: CredentialSecretField.Secret,
            intent: CredentialRevealIntent.Show,
          },
          admin(),
        ),
      ).toEqual({ ok: true, value: { value: SECRET } });
    });

    it("refuses a foreign, archived or unknown project and writes nothing", async () => {
      await setProjectStatus(ProjectStatus.Archived);
      for (const projectId of [
        f.foreignProjectId,
        f.projectId,
        crypto.randomUUID(),
      ])
        expect(
          await createPortalCredential(contact(), portalInput({ projectId })),
        ).toEqual({ ok: false, code: E.Validation });

      expect(
        await f
          .database()
          .select({ id: customerCredentials.id })
          .from(customerCredentials)
          .where(inArray(customerCredentials.customer_id, customerIds)),
      ).toHaveLength(0);
      expect(await events()).toHaveLength(0);
    });

    it("rejects release, project and company fields from the customer", async () => {
      const entry = await internal();
      await clearEvents();
      const update = (extra: object) =>
        updatePortalCredential(contact(), entry.id, {
          version: entry.version,
          title: "Changed",
          ...extra,
        });

      for (const extra of [
        { visibleToCustomer: false },
        { projectId: f.projectId },
        { customerId: f.foreignCustomerId },
      ])
        expect(await update(extra)).toEqual({ ok: false, code: E.Validation });
      expect(
        await createPortalCredential(contact(), {
          ...portalInput(),
          customerId: f.foreignCustomerId,
        } as CreatePortalCredentialRequestDto),
      ).toEqual({ ok: false, code: E.Validation });
      expect((await storedRow(entry.id)).title).toBe(TITLE);
      expect(await events()).toHaveLength(0);
    });

    it("confirms a write without handing the entry to a contact who may not read", async () => {
      const writer = contact([Permission.PortalCredentialsWrite]);
      const created = await createPortalCredential(writer, portalInput());

      expect(created).toEqual({
        ok: true,
        value: { created: true, credential: null },
      });
      const [row] = await f
        .database()
        .select()
        .from(customerCredentials)
        .where(eq(customerCredentials.customer_id, f.customerId));
      expect(
        await updatePortalCredential(writer, row.id, {
          version: 1,
          title: "Renamed",
        }),
      ).toEqual({ ok: true, value: { updated: true, credential: null } });
      expect(
        await updatePortalCredential(writer, row.id, {
          version: 1,
          title: "Stale",
        }),
      ).toMatchObject({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict: { currentVersion: 2, current: null },
      });
    });

    it("changes a secret with one event and a notice, a title without a notice", async () => {
      const entry = await internal();
      await clearEvents();
      const before = (
        await notices(SystemMessageKey.CredentialSecretChangedByCustomer)
      ).length;

      const renamed = await updatePortalCredential(contact(), entry.id, {
        version: entry.version,
        title: "Renamed-marker",
      });
      expect(renamed).toMatchObject({
        ok: true,
        value: { updated: true, credential: { title: "Renamed-marker" } },
      });
      expect(await events()).toHaveLength(1);
      expect(
        await notices(SystemMessageKey.CredentialSecretChangedByCustomer),
      ).toHaveLength(before);

      const stale = await updatePortalCredential(contact(), entry.id, {
        version: entry.version,
        secret: "ignored",
      });
      expect(stale).toMatchObject({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict: { current: { id: entry.id, title: "Renamed-marker" } },
      });

      const changedAt = (await storedRow(entry.id)).secret_changed_at;
      const rotated = await updatePortalCredential(contact(), entry.id, {
        version: entry.version + 1,
        secret: "Rotated-secret-marker",
      });
      expect(rotated).toMatchObject({ ok: true });
      const row = await storedRow(entry.id);
      expect(row.secret_changed_at.getTime()).toBeGreaterThanOrEqual(
        changedAt.getTime(),
      );
      // Still an internal entry: the origin never changes with an edit.
      expect(row.created_by_side).toBe(CredentialSide.Internal);

      const written = await events();
      expect(written).toHaveLength(2);
      for (const event of written) {
        expect(event.type).toBe(SecurityEventType.CredentialUpdated);
        expect(event.actor_type).toBe(ActorType.Customer);
        expect(JSON.stringify(event.metadata)).not.toContain("Renamed-marker");
        expect(JSON.stringify(event.metadata)).not.toContain("Rotated");
      }
      const announced = await notices(
        SystemMessageKey.CredentialSecretChangedByCustomer,
      );
      expect(announced).toHaveLength(before + 1);
      expect(JSON.stringify(announced)).not.toContain("Rotated");
      expect(await show(entry.id)).toEqual({
        ok: true,
        value: { value: "Rotated-secret-marker" },
      });
    });

    it("loses an entry the moment its release is withdrawn", async () => {
      const entry = await internal();
      const withdrawn = await setCredentialPortalVisibility(
        entry.id,
        { version: entry.version, visibleToCustomer: false },
        admin(),
      );
      if (!withdrawn.ok) throw new Error("Expected the withdrawal");
      await clearEvents();

      expect(await listedIds(contact())).toEqual([]);
      expect(
        await updatePortalCredential(contact(), entry.id, {
          version: withdrawn.value.version,
          title: "Changed",
        }),
      ).toEqual({ ok: false, code: E.NotFound });
      expect(await show(entry.id)).toEqual({ ok: false, code: E.NotFound });
      expect(await events()).toHaveLength(0);
    });

    it("answers not_configured without a keyring and writes nothing", async () => {
      const entry = await internal();
      await clearEvents();
      vi.stubEnv(KEYRING_VARIABLE, "");

      expect(await createPortalCredential(contact(), portalInput())).toEqual({
        ok: false,
        code: E.NotConfigured,
      });
      expect(
        await updatePortalCredential(contact(), entry.id, {
          version: entry.version,
          secret: "new",
        }),
      ).toEqual({ ok: false, code: E.NotConfigured });
      expect(await show(entry.id)).toEqual({
        ok: false,
        code: E.NotConfigured,
      });
      expect(await listPortalCredentials(contact())).toMatchObject({
        ok: true,
        value: { configured: false },
      });
      expect(await events()).toHaveLength(0);
      expect(
        await f
          .database()
          .select({ id: customerCredentials.id })
          .from(customerCredentials)
          .where(eq(customerCredentials.customer_id, f.customerId)),
      ).toHaveLength(1);
    });

    it("stops adding at the upper bound per company", async () => {
      const now = new Date();
      await f
        .database()
        .insert(customerCredentials)
        .values(
          Array.from(
            { length: CREDENTIAL_LIMITS.maxPortalCreatedPerCustomer },
            (_, index) => ({
              id: crypto.randomUUID(),
              customer_id: f.customerId,
              project_id: null,
              title: `Bulk ${index}`,
              credential_type: CredentialType.Other,
              url: null,
              username: null,
              secret_ciphertext: "v1.1.fixture.fixture",
              note_ciphertext: null,
              visible_to_customer: false,
              created_by_side: CredentialSide.Internal,
              created_by_member_id: f.memberId,
              created_by_portal_membership_id: null,
              secret_changed_at: now,
              version: 1,
            }),
          ),
        );

      expect(await createPortalCredential(contact(), portalInput())).toEqual({
        ok: false,
        code: E.Validation,
      });
      expect(await events()).toHaveLength(0);
    });
  },
);
