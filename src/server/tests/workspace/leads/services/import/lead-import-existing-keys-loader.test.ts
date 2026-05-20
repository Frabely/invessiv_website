import { describe, expect, it, vi } from "vitest";

const { getDrizzleDatabaseClientMock } = vi.hoisted(() => ({
  getDrizzleDatabaseClientMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@invessiv/db/core", () => ({
  getDrizzleDatabaseClient: getDrizzleDatabaseClientMock,
}));
vi.mock("drizzle-orm", async (importOriginal) => ({
  ...(await importOriginal<typeof import("drizzle-orm")>()),
}));

function drizzleChain(value: unknown) {
  const proxy: Record<string | symbol, unknown> = new Proxy(
    {},
    {
      get(_, prop: string | symbol) {
        if (prop === "then") {
          return (res: (v: unknown) => void, rej: (e: unknown) => void) =>
            Promise.resolve(value).then(res, rej);
        }
        if (prop === Symbol.iterator || prop === Symbol.toPrimitive) {
          return undefined;
        }
        return vi.fn().mockReturnValue(proxy);
      },
    },
  );
  return proxy;
}

describe("loadExistingKeys", () => {
  it("returns empty maps when both inputs are empty", async () => {
    const { leadImportExistingKeysLoaderService } =
      await import("@/server/workspace/leads/services/import/lead-import-existing-keys-loader-service");

    const result = await leadImportExistingKeysLoaderService.loadExistingKeys(
      [],
      [],
    );

    expect(result.emailToLeadId.size).toBe(0);
    expect(result.guidToLeadId.size).toBe(0);
    expect(getDrizzleDatabaseClientMock).not.toHaveBeenCalled();
  });

  it("queries only emails when no guids are provided", async () => {
    vi.resetModules();
    const selectMock = vi
      .fn()
      .mockReturnValue(
        drizzleChain([{ id: "lead-1", email: "Anna@Example.com" }]),
      );
    getDrizzleDatabaseClientMock.mockReturnValue({ select: selectMock });

    const { leadImportExistingKeysLoaderService } =
      await import("@/server/workspace/leads/services/import/lead-import-existing-keys-loader-service");

    const result = await leadImportExistingKeysLoaderService.loadExistingKeys(
      ["anna@example.com"],
      [],
    );

    expect(result.emailToLeadId.get("anna@example.com")).toBe("lead-1");
    expect(result.guidToLeadId.size).toBe(0);
  });

  it("queries only guids when no emails are provided", async () => {
    vi.resetModules();
    const selectMock = vi
      .fn()
      .mockReturnValue(
        drizzleChain([{ id: "lead-2", external_guid: "ext-guid-abc" }]),
      );
    getDrizzleDatabaseClientMock.mockReturnValue({ select: selectMock });

    const { leadImportExistingKeysLoaderService } =
      await import("@/server/workspace/leads/services/import/lead-import-existing-keys-loader-service");

    const result = await leadImportExistingKeysLoaderService.loadExistingKeys(
      [],
      ["ext-guid-abc"],
    );

    expect(result.guidToLeadId.get("ext-guid-abc")).toBe("lead-2");
    expect(result.emailToLeadId.size).toBe(0);
  });

  it("normalizes email key to lowercase when storing in map", async () => {
    vi.resetModules();
    const selectMock = vi
      .fn()
      .mockReturnValue(
        drizzleChain([{ id: "lead-3", email: "Max.Mustermann@Example.DE" }]),
      );
    getDrizzleDatabaseClientMock.mockReturnValue({ select: selectMock });

    const { leadImportExistingKeysLoaderService } =
      await import("@/server/workspace/leads/services/import/lead-import-existing-keys-loader-service");

    const result = await leadImportExistingKeysLoaderService.loadExistingKeys(
      ["max.mustermann@example.de"],
      [],
    );

    expect(result.emailToLeadId.get("max.mustermann@example.de")).toBe(
      "lead-3",
    );
  });

  it("populates both maps when both emails and guids are provided", async () => {
    vi.resetModules();
    let selectCallIndex = 0;
    const selectMock = vi.fn().mockImplementation(() => {
      const idx = selectCallIndex;
      selectCallIndex += 1;
      if (idx === 0) {
        return drizzleChain([{ id: "lead-email", email: "test@example.com" }]);
      }
      return drizzleChain([{ id: "lead-guid", external_guid: "guid-xyz" }]);
    });
    getDrizzleDatabaseClientMock.mockReturnValue({ select: selectMock });

    const { leadImportExistingKeysLoaderService } =
      await import("@/server/workspace/leads/services/import/lead-import-existing-keys-loader-service");

    const result = await leadImportExistingKeysLoaderService.loadExistingKeys(
      ["test@example.com"],
      ["guid-xyz"],
    );

    expect(result.emailToLeadId.get("test@example.com")).toBe("lead-email");
    expect(result.guidToLeadId.get("guid-xyz")).toBe("lead-guid");
  });

  it("skips guid rows where external_guid is null", async () => {
    vi.resetModules();
    const selectMock = vi
      .fn()
      .mockReturnValue(
        drizzleChain([{ id: "lead-null", external_guid: null }]),
      );
    getDrizzleDatabaseClientMock.mockReturnValue({ select: selectMock });

    const { leadImportExistingKeysLoaderService } =
      await import("@/server/workspace/leads/services/import/lead-import-existing-keys-loader-service");

    const result = await leadImportExistingKeysLoaderService.loadExistingKeys(
      [],
      ["guid-xyz"],
    );

    expect(result.guidToLeadId.size).toBe(0);
  });
});
