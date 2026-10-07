import { randomBytes } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import { CredentialApiErrorCode as E } from "@invessiv/common/constants/credentials/credential-api-error-code";
import { CREDENTIAL_LIMITS } from "@invessiv/common/constants/credentials/credential-limits";
import { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import { CredentialSide } from "@invessiv/common/constants/credentials/credential-sides";
import { CredentialType } from "@invessiv/common/constants/credentials/credential-types";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { CreateCredentialRequestDto } from "@invessiv/common/contracts/credentials/create-credential-request.dto";
import {
  customerCredentials,
  securityEvents,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { createCredential } from "@/server/workspace/crm/command-handler/create-credential.command-handler";
import { deleteCredential } from "@/server/workspace/crm/command-handler/delete-credential.command-handler";
import { revealCredential } from "@/server/workspace/crm/command-handler/reveal-credential.command-handler";
import { updateCredential } from "@/server/workspace/crm/command-handler/update-credential.command-handler";
import { listCustomerCredentials } from "@/server/workspace/crm/query-handler/list-customer-credentials.query-handler";
import { createFileTestFixture } from "../../../shared/files/file-test-fixture";

vi.mock("server-only", () => ({}));

const KEYRING_VARIABLE = "CRM_CREDENTIALS_KEYRING";
const SECRET = "Plaintext-Secret-ß🔐-marker";
const NOTE = "Plaintext-Note-marker\nsecond line";
const TITLE = "Title-marker hosting";
const ALL = [
  Permission.CredentialsRead,
  Permission.CredentialsWrite,
  Permission.CredentialsReveal,
];

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "credentials PostgreSQL integration",
  () => {
    const f = createFileTestFixture();
    const keyring = `1:${randomBytes(32).toString("base64")}`;
    const userId = f.actor().userId;
    const customerIds = [f.customerId, f.foreignCustomerId];

    const admin = () => f.actor({ permissions: new Set(ALL) });
    const bound = (projectId: string, permissions: Permission[] = ALL) =>
      f.actor({
        permissions: new Set(),
        projectPermissions: new Map([
          [
            projectId,
            { customerId: f.customerId, permissions: new Set(permissions) },
          ],
        ]),
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

    const input = (
      overrides: Partial<CreateCredentialRequestDto> = {},
    ): CreateCredentialRequestDto => ({
      projectId: f.projectId,
      title: TITLE,
      credentialType: CredentialType.Hosting,
      url: "https://example.com/login",
      username: "deploy@example.com",
      secret: SECRET,
      note: NOTE,
      ...overrides,
    });
    async function create(
      overrides: Partial<CreateCredentialRequestDto> = {},
      actor: WorkspaceActor = admin(),
      customerId = f.customerId,
    ) {
      const result = await createCredential(
        customerId,
        input(overrides),
        actor,
      );
      if (!result.ok) throw new Error("Expected the credential to be created");
      return result.value;
    }
    const show = (
      id: string,
      actor: WorkspaceActor = admin(),
      field: CredentialSecretField = CredentialSecretField.Secret,
    ) =>
      revealCredential(
        id,
        { field, intent: CredentialRevealIntent.Show },
        actor,
      );

    beforeAll(async () => {
      await f.setup();
      vi.stubEnv(KEYRING_VARIABLE, keyring);
    }, 60_000);
    beforeEach(async () => {
      vi.stubEnv(KEYRING_VARIABLE, keyring);
      await clearEvents();
    });
    afterAll(async () => {
      vi.unstubAllEnvs();
      vi.restoreAllMocks();
      await clearEvents();
      await f
        .database()
        .delete(customerCredentials)
        .where(inArray(customerCredentials.customer_id, customerIds));
      await f.cleanup();
    }, 60_000);

    it("stores only ciphertext and lists only metadata", async () => {
      const created = await create();
      const row = await storedRow(created.id);

      expect(created).toMatchObject({
        customerId: f.customerId,
        projectId: f.projectId,
        hasNote: true,
        visibleToCustomer: false,
        createdBySide: CredentialSide.Internal,
        version: 1,
        capabilities: { canWrite: true, canReveal: true },
      });
      expect(row.secret_ciphertext.startsWith("v1.")).toBe(true);
      expect(row.note_ciphertext?.startsWith("v1.")).toBe(true);
      expect(row.created_by_member_id).toBe(f.memberId);
      expect(JSON.stringify(row)).not.toContain(SECRET);
      expect(JSON.stringify(row)).not.toContain("Plaintext-Note-marker");

      const listed = await listCustomerCredentials(f.customerId, {}, admin());
      const serialized = JSON.stringify(listed);
      expect(listed).toMatchObject({ ok: true });
      expect(serialized).toContain(created.id);
      for (const forbidden of [
        SECRET,
        "Plaintext-Note-marker",
        row.secret_ciphertext,
        row.note_ciphertext!,
        "ciphertext",
      ])
        expect(serialized).not.toContain(forbidden);
    });

    it("writes exactly one event per write, without title or value", async () => {
      const created = await create();
      const renamed = await updateCredential(
        created.id,
        { version: 1, title: "Renamed-marker", secret: "Second-secret-marker" },
        admin(),
      );
      expect(renamed).toMatchObject({ ok: true, value: { version: 2 } });
      expect(
        await deleteCredential(created.id, { version: 2 }, admin()),
      ).toEqual({ ok: true, value: { deleted: true } });

      const written = await events();
      expect(written.map((event) => event.type).sort()).toEqual(
        [
          SecurityEventType.CredentialCreated,
          SecurityEventType.CredentialDeleted,
          SecurityEventType.CredentialUpdated,
        ].sort(),
      );
      for (const event of written) {
        expect(event.subject_type).toBe(SecuritySubjectType.Credential);
        expect(event.subject_id).toBe(created.id);
        expect(event.metadata).toMatchObject({
          customer_id: f.customerId,
          project_id: f.projectId,
        });
      }
      expect(
        written.find(
          (event) => event.type === SecurityEventType.CredentialUpdated,
        )?.metadata,
      ).toMatchObject({
        changed_fields: ["title", "secret_ciphertext", "secret_changed_at"],
      });
      const serialized = JSON.stringify(written);
      for (const forbidden of [
        TITLE,
        "Renamed-marker",
        SECRET,
        "Second-secret-marker",
        "Plaintext-Note-marker",
        "v1.",
      ])
        expect(serialized).not.toContain(forbidden);
      expect(await storedRow(created.id)).toBeUndefined();
    });

    it("keeps the secret when it is omitted and treats the note as three-valued", async () => {
      const created = await create();
      const before = await storedRow(created.id);

      const renamed = await updateCredential(
        created.id,
        { version: 1, title: "Other title", url: null },
        admin(),
      );
      const afterRename = await storedRow(created.id);
      expect(renamed).toMatchObject({
        ok: true,
        value: { title: "Other title", url: null, hasNote: true, version: 2 },
      });
      expect(afterRename.secret_ciphertext).toBe(before.secret_ciphertext);
      expect(afterRename.note_ciphertext).toBe(before.note_ciphertext);
      expect(afterRename.secret_changed_at).toEqual(before.secret_changed_at);

      const cleared = await updateCredential(
        created.id,
        { version: 2, note: null },
        admin(),
      );
      const afterClear = await storedRow(created.id);
      expect(cleared).toMatchObject({ ok: true, value: { hasNote: false } });
      expect(afterClear.note_ciphertext).toBeNull();
      expect(afterClear.secret_ciphertext).toBe(before.secret_ciphertext);

      const replaced = await updateCredential(
        created.id,
        { version: 3, secret: "Rotated-secret" },
        admin(),
      );
      const afterReplace = await storedRow(created.id);
      expect(replaced).toMatchObject({ ok: true, value: { version: 4 } });
      expect(afterReplace.secret_ciphertext).not.toBe(before.secret_ciphertext);
      expect(afterReplace.secret_changed_at.getTime()).toBeGreaterThanOrEqual(
        before.secret_changed_at.getTime(),
      );
      expect(await show(created.id)).toEqual({
        ok: true,
        value: { value: "Rotated-secret" },
      });
    });

    it("skips the write and the event when nothing differs", async () => {
      const created = await create({ note: null });
      await clearEvents();

      const unchanged = await updateCredential(
        created.id,
        { version: 1, title: TITLE, note: null },
        admin(),
      );

      expect(unchanged).toMatchObject({ ok: true, value: { version: 1 } });
      expect(await events()).toHaveLength(0);
    });

    it("answers a stale version with the current metadata and a deleted row with not_found", async () => {
      const created = await create();
      await updateCredential(
        created.id,
        { version: 1, title: "Newer" },
        admin(),
      );

      const stale = await updateCredential(
        created.id,
        { version: 1, title: "Stale" },
        admin(),
      );
      expect(stale).toMatchObject({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict: {
          currentVersion: 2,
          current: { id: created.id, title: "Newer", version: 2 },
        },
      });
      expect(JSON.stringify(stale)).not.toContain("ciphertext");
      expect(
        await deleteCredential(created.id, { version: 1 }, admin()),
      ).toMatchObject({ code: ConcurrencyErrorCode.VersionConflict });

      await deleteCredential(created.id, { version: 2 }, admin());
      expect(
        await updateCredential(
          created.id,
          { version: 2, title: "Gone" },
          admin(),
        ),
      ).toEqual({ ok: false, code: E.NotFound });
      expect(
        await deleteCredential(created.id, { version: 2 }, admin()),
      ).toEqual({ ok: false, code: E.NotFound });
    });

    it("keeps both values readable across project moves", async () => {
      const created = await create();

      const moved = await updateCredential(
        created.id,
        { version: 1, projectId: f.siblingProjectId },
        admin(),
      );
      expect(moved).toMatchObject({
        ok: true,
        value: { projectId: f.siblingProjectId },
      });
      expect(await show(created.id)).toEqual({
        ok: true,
        value: { value: SECRET },
      });

      const customerWide = await updateCredential(
        created.id,
        { version: 2, projectId: null },
        admin(),
      );
      expect(customerWide).toMatchObject({
        ok: true,
        value: { projectId: null },
      });
      expect(await show(created.id)).toEqual({
        ok: true,
        value: { value: SECRET },
      });
      expect(
        await show(created.id, admin(), CredentialSecretField.Note),
      ).toEqual({ ok: true, value: { value: NOTE } });
    });

    it("filters the list by project and keeps customer-wide entries in a project view", async () => {
      const wide = await create({ projectId: null, title: "Wide" });
      const own = await create({ title: "Own" });
      const sibling = await create({
        projectId: f.siblingProjectId,
        title: "Sibling",
      });
      const ids = async (projectId?: string | null) => {
        const result = await listCustomerCredentials(
          f.customerId,
          projectId === undefined ? {} : { projectId },
          admin(),
        );
        if (!result.ok) throw new Error("Expected a list");
        return result.value.credentials.map((credential) => credential.id);
      };

      const all = await ids();
      expect(all).toEqual(
        expect.arrayContaining([wide.id, own.id, sibling.id]),
      );
      // Customer-wide entries come first.
      expect(all.indexOf(wide.id)).toBeLessThan(all.indexOf(own.id));
      expect(await ids(null)).toContain(wide.id);
      expect(await ids(null)).not.toContain(own.id);
      const projectView = await ids(f.projectId);
      expect(projectView).toEqual(expect.arrayContaining([wide.id, own.id]));
      expect(projectView).not.toContain(sibling.id);
    });

    it("treats foreign customers and projects as not found", async () => {
      const foreign = await create(
        { projectId: f.foreignProjectId },
        admin(),
        f.foreignCustomerId,
      );
      const customerBound = f.actor({
        permissions: new Set(),
        customerPermissions: new Map([[f.customerId, new Set(ALL)]]),
      });

      // A project of another customer is not a valid target.
      expect(
        await createCredential(
          f.customerId,
          input({ projectId: f.foreignProjectId }),
          admin(),
        ),
      ).toEqual({ ok: false, code: E.NotFound });
      // A role bound to one customer reaches nothing of the other one.
      expect(
        await createCredential(
          f.foreignCustomerId,
          input({ projectId: null }),
          customerBound,
        ),
      ).toEqual({ ok: false, code: E.NotFound });
      expect(
        await listCustomerCredentials(f.foreignCustomerId, {}, customerBound),
      ).toEqual({ ok: true, value: { credentials: [] } });
      expect(
        await updateCredential(
          foreign.id,
          { version: 1, title: "Taken over" },
          customerBound,
        ),
      ).toEqual({ ok: false, code: E.NotFound });
      expect(
        await deleteCredential(foreign.id, { version: 1 }, customerBound),
      ).toEqual({ ok: false, code: E.NotFound });
      expect(await show(foreign.id, customerBound)).toEqual({
        ok: false,
        code: E.NotFound,
      });
      expect((await storedRow(foreign.id)).title).toBe(TITLE);
    });

    it("hides customer-wide and sibling entries from a project-bound role", async () => {
      const wide = await create({ projectId: null });
      const own = await create();
      const sibling = await create({ projectId: f.siblingProjectId });
      const projectMember = bound(f.projectId);
      await clearEvents();

      const listed = await listCustomerCredentials(
        f.customerId,
        {},
        projectMember,
      );
      if (!listed.ok) throw new Error("Expected a list");
      // Earlier tests left entries in this project; none of another scope may appear.
      const listedIds = listed.value.credentials.map((entry) => entry.id);
      expect(listedIds).toContain(own.id);
      expect(listedIds).not.toContain(wide.id);
      expect(listedIds).not.toContain(sibling.id);
      expect(
        listed.value.credentials.every(
          (entry) => entry.projectId === f.projectId,
        ),
      ).toBe(true);

      for (const hidden of [wide, sibling]) {
        expect(
          await updateCredential(
            hidden.id,
            { version: 1, title: "Changed" },
            projectMember,
          ),
        ).toEqual({ ok: false, code: E.NotFound });
        expect(
          await deleteCredential(hidden.id, { version: 1 }, projectMember),
        ).toEqual({ ok: false, code: E.NotFound });
        expect(await show(hidden.id, projectMember)).toEqual({
          ok: false,
          code: E.NotFound,
        });
      }
      // Moving an entry needs write permission at the destination as well.
      for (const projectId of [f.siblingProjectId, null])
        expect(
          await updateCredential(
            own.id,
            { version: 1, projectId },
            projectMember,
          ),
        ).toEqual({ ok: false, code: E.NotFound });
      expect(
        await createCredential(
          f.customerId,
          input({ projectId: null }),
          projectMember,
        ),
      ).toEqual({ ok: false, code: E.NotFound });
      expect(await events()).toHaveLength(0);
      expect((await storedRow(own.id)).project_id).toBe(f.projectId);
    });

    it("separates write from reveal", async () => {
      const writer = bound(f.projectId, [
        Permission.CredentialsRead,
        Permission.CredentialsWrite,
      ]);
      const created = await create({}, writer);

      expect(created.capabilities).toEqual({
        canWrite: true,
        canReveal: false,
      });
      expect(
        await updateCredential(
          created.id,
          { version: 1, secret: "Changed-blind" },
          writer,
        ),
      ).toMatchObject({ ok: true });
      await clearEvents();
      expect(await show(created.id, writer)).toEqual({
        ok: false,
        code: E.NotFound,
      });
      expect(await events()).toHaveLength(0);
    });

    it("stays read-only without a keyring", async () => {
      const created = await create();
      vi.stubEnv(KEYRING_VARIABLE, undefined);

      expect(await createCredential(f.customerId, input(), admin())).toEqual({
        ok: false,
        code: E.NotConfigured,
      });
      expect(
        await updateCredential(
          created.id,
          { version: 1, secret: "New" },
          admin(),
        ),
      ).toEqual({ ok: false, code: E.NotConfigured });
      expect(
        await updateCredential(
          created.id,
          { version: 1, note: "New note" },
          admin(),
        ),
      ).toEqual({ ok: false, code: E.NotConfigured });
      expect(await show(created.id)).toEqual({
        ok: false,
        code: E.NotConfigured,
      });

      expect(
        await listCustomerCredentials(f.customerId, {}, admin()),
      ).toMatchObject({ ok: true });
      expect(
        await updateCredential(
          created.id,
          { version: 1, title: "Metadata only" },
          admin(),
        ),
      ).toMatchObject({ ok: true, value: { version: 2 } });
      expect(
        await deleteCredential(created.id, { version: 2 }, admin()),
      ).toEqual({ ok: true, value: { deleted: true } });
    });

    it("audits every reveal and leaves the version alone", async () => {
      const created = await create();
      await clearEvents();

      expect(await show(created.id)).toEqual({
        ok: true,
        value: { value: SECRET },
      });
      expect(
        await revealCredential(
          created.id,
          {
            field: CredentialSecretField.Note,
            intent: CredentialRevealIntent.Copy,
          },
          admin(),
        ),
      ).toEqual({ ok: true, value: { value: NOTE } });

      const written = await events();
      expect(written).toHaveLength(2);
      expect(
        written
          .map((event) => event.metadata)
          .sort((a, b) => String(a?.field).localeCompare(String(b?.field))),
      ).toEqual([
        {
          customer_id: f.customerId,
          project_id: f.projectId,
          field: CredentialSecretField.Note,
          intent: CredentialRevealIntent.Copy,
        },
        {
          customer_id: f.customerId,
          project_id: f.projectId,
          field: CredentialSecretField.Secret,
          intent: CredentialRevealIntent.Show,
        },
      ]);
      expect(
        written.every(
          (event) => event.type === SecurityEventType.CredentialRevealed,
        ),
      ).toBe(true);
      expect(JSON.stringify(written)).not.toContain(SECRET);
      expect(JSON.stringify(written)).not.toContain("Plaintext-Note-marker");

      const row = await storedRow(created.id);
      expect(row.last_revealed_at).toBeInstanceOf(Date);
      expect(row.version).toBe(1);
      expect(row.updated_at.toISOString()).toBe(created.updatedAt);
    });

    it("answers a missing note and a revoked role without an event", async () => {
      const created = await create({ note: null });
      const revealer = bound(f.projectId);
      await clearEvents();

      expect(
        await show(created.id, admin(), CredentialSecretField.Note),
      ).toEqual({ ok: false, code: E.NotFound });
      expect(await show(created.id, revealer)).toMatchObject({ ok: true });
      // The same member after the role was taken away: the next request is rejected.
      expect(
        await show(
          created.id,
          bound(f.projectId, [Permission.CredentialsRead]),
        ),
      ).toEqual({ ok: false, code: E.NotFound });
      expect(await show(created.id, bound(f.siblingProjectId))).toEqual({
        ok: false,
        code: E.NotFound,
      });
      expect(await events()).toHaveLength(1);
    });

    it("fails closed on a modified ciphertext", async () => {
      const created = await create();
      const row = await storedRow(created.id);
      const parts = row.secret_ciphertext.split(".");
      parts[3] = randomBytes(
        Buffer.from(parts[3], "base64url").length,
      ).toString("base64url");
      await f
        .database()
        .update(customerCredentials)
        .set({ secret_ciphertext: parts.join(".") })
        .where(eq(customerCredentials.id, created.id));
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      await clearEvents();

      const result = await show(created.id);

      expect(result).toEqual({ ok: false, code: E.Internal });
      expect(await events()).toHaveLength(0);
      expect((await storedRow(created.id)).last_revealed_at).toBeNull();
      const logged = JSON.stringify(consoleError.mock.calls);
      expect(logged).not.toContain(created.id);
      expect(logged).not.toContain(parts[3]);
      consoleError.mockRestore();
    });

    it("limits reveals per member and window", async () => {
      const created = await create({ note: null });
      await clearEvents();
      const limit = CREDENTIAL_LIMITS.revealsPerWindowInternal;

      for (let count = 0; count < limit; count += 1)
        expect(await show(created.id)).toMatchObject({ ok: true });
      const limited = await show(created.id);

      expect(limited).toMatchObject({ ok: false, code: E.RateLimited });
      if (limited.ok || limited.code !== E.RateLimited)
        throw new Error("Expected the rate limit");
      expect(limited.retryAfterSeconds).toBeGreaterThanOrEqual(1);
      expect(limited.retryAfterSeconds).toBeLessThanOrEqual(
        CREDENTIAL_LIMITS.revealWindowSeconds,
      );
      expect(JSON.stringify(limited)).not.toContain(SECRET);
      expect(await events()).toHaveLength(limit);
    }, 120_000);
  },
);
