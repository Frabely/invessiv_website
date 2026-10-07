import { afterEach, describe, expect, it, vi } from "vitest";
import { readCredentialFixtureKeyring } from "./seed-credentials";
import { readTargetEnvValue } from "../database-target";

vi.mock("../database-target", () => ({ readTargetEnvValue: vi.fn() }));
const encoded = Buffer.alloc(32, 7).toString("base64");

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("credential fixture keyring", () => {
  it.each(["development", "preview"] as const)(
    "reads only the selected %s target",
    (target) => {
      vi.stubEnv("CRM_CREDENTIALS_KEYRING", undefined);
      vi.mocked(readTargetEnvValue).mockReturnValue(`2:${encoded}`);
      expect(readCredentialFixtureKeyring(target)?.activeVersion).toBe(2);
      expect(readTargetEnvValue).toHaveBeenCalledExactlyOnceWith(
        target,
        "CRM_CREDENTIALS_KEYRING",
      );
    },
  );

  it("prefers an explicit caller keyring", () => {
    vi.stubEnv("CRM_CREDENTIALS_KEYRING", `3:${encoded}`);
    expect(readCredentialFixtureKeyring("preview")?.activeVersion).toBe(3);
    expect(readTargetEnvValue).not.toHaveBeenCalled();
  });

  it("skips credentials if the selected target has no keyring", () => {
    vi.stubEnv("CRM_CREDENTIALS_KEYRING", undefined);
    vi.mocked(readTargetEnvValue).mockReturnValue(null);
    expect(readCredentialFixtureKeyring("preview")).toBeNull();
  });

  it("does not fall back from an invalid explicit keyring", () => {
    vi.stubEnv("CRM_CREDENTIALS_KEYRING", "invalid");
    expect(readCredentialFixtureKeyring("preview")).toBeNull();
    expect(readTargetEnvValue).not.toHaveBeenCalled();
  });
});
