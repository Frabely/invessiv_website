import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DatabaseTarget } from "@invessiv/common/constants/database/database-target";
import { configureThumbnailBackfillEnvironment } from "./configure-thumbnail-backfill-environment";

let directory: string;
function write(relativePath: string, content: string) {
  const filename = path.join(directory, relativePath);
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, content);
}

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), "invessiv-backfill-env-"));
  write(
    ".env.production.local",
    "DATABASE_URL=postgresql://user:secret@ep-prod.neon.tech/app",
  );
  write(
    "apps/workspace/.env.local",
    "BLOB_STORE_ID=store_shared\nVERCEL_OIDC_TOKEN=nonproduction-test-credential",
  );
  write(
    "apps/workspace/.env.production.local",
    "BLOB_STORE_ID=store_prod\nVERCEL_OIDC_TOKEN=production-test-credential",
  );
  for (const target of [DatabaseTarget.Development, DatabaseTarget.Preview]) {
    write(
      `.env.${target}.local`,
      `DATABASE_URL=postgresql://user:secret@ep-${target}.neon.tech/app`,
    );
    write(
      `apps/workspace/.env.${target}.local`,
      "BLOB_STORE_ID=store_shared\nVERCEL_OIDC_TOKEN=nonproduction-test-credential",
    );
  }
});
afterEach(() => fs.rmSync(directory, { recursive: true, force: true }));

describe("thumbnail backfill environment safety", () => {
  it.each([DatabaseTarget.Development, DatabaseTarget.Preview])(
    "allows %s to use the shared nonproduction store",
    (target) => {
      const environment: Record<string, string | undefined> = {
        DATABASE_URL: "postgresql://user@ep-prod.neon.tech/app",
        BLOB_STORE_ID: "store_prod",
      };
      configureThumbnailBackfillEnvironment(target, directory, environment);
      expect(environment.DATABASE_URL).toContain(`ep-${target}.neon.tech`);
      expect(environment.BLOB_STORE_ID).toBe("store_shared");
      expect(environment.VERCEL_OIDC_TOKEN).toBe(
        "nonproduction-test-credential",
      );
      expect(environment.BLOB_READ_WRITE_TOKEN).toBe("");
    },
  );

  it("keeps production on its explicit database and target-specific storage", () => {
    const environment: Record<string, string | undefined> = {
      VERCEL_OIDC_TOKEN: "inherited-dev-credential",
    };
    configureThumbnailBackfillEnvironment(
      DatabaseTarget.Production,
      directory,
      environment,
    );
    expect(environment.DATABASE_URL).toContain("ep-prod.neon.tech");
    expect(environment.BLOB_STORE_ID).toBe("store_prod");
    expect(environment.VERCEL_OIDC_TOKEN).toBe("production-test-credential");
  });

  it("never treats the generic app environment as production storage", () => {
    fs.unlinkSync(path.join(directory, "apps/workspace/.env.production.local"));
    expect(() =>
      configureThumbnailBackfillEnvironment(
        DatabaseTarget.Production,
        directory,
        {},
      ),
    ).toThrow("Missing explicit production Blob store ID");
  });

  it("uses the explicitly matching Vercel production configuration without local target files", () => {
    fs.unlinkSync(path.join(directory, ".env.production.local"));
    fs.unlinkSync(path.join(directory, "apps/workspace/.env.production.local"));
    const environment: Record<string, string | undefined> = {
      VERCEL: "1",
      VERCEL_ENV: "production",
      DATABASE_URL: "postgresql://user@ep-prod.neon.tech/app",
      BLOB_STORE_ID: "store_prod",
      VERCEL_OIDC_TOKEN: "runtime-test-credential",
    };
    configureThumbnailBackfillEnvironment(
      DatabaseTarget.Production,
      directory,
      environment,
    );
    expect(environment.BLOB_STORE_ID).toBe("store_prod");
    expect(environment.VERCEL_OIDC_TOKEN).toBe("runtime-test-credential");
  });

  it("refuses a development run from the Vercel production environment", () => {
    expect(() =>
      configureThumbnailBackfillEnvironment(
        DatabaseTarget.Development,
        directory,
        {
          VERCEL: "1",
          VERCEL_ENV: "production",
        },
      ),
    ).toThrow("does not match");
  });

  it.each(["ep-prod.neon.tech", "ep-prod-pooler.neon.tech"])(
    "refuses a nonproduction target using the production endpoint %s",
    (hostname) => {
      write(
        ".env.preview.local",
        `DATABASE_URL=postgres://other:password@${hostname}/app`,
      );
      const environment = { DATABASE_URL: "unchanged" };
      expect(() =>
        configureThumbnailBackfillEnvironment(
          DatabaseTarget.Preview,
          directory,
          environment,
        ),
      ).toThrow("production database");
      expect(environment.DATABASE_URL).toBe("unchanged");
    },
  );

  it("never falls back to a generic or another target's database URL", () => {
    fs.unlinkSync(path.join(directory, ".env.preview.local"));
    const environment = {
      DATABASE_URL: "postgresql://user@ep-prod.neon.tech/app",
    };
    expect(() =>
      configureThumbnailBackfillEnvironment(
        DatabaseTarget.Preview,
        directory,
        environment,
      ),
    ).toThrow("Explicit target");
  });

  it("requires a known production identity before a nonproduction write", () => {
    fs.unlinkSync(path.join(directory, ".env.production.local"));
    expect(() =>
      configureThumbnailBackfillEnvironment(
        DatabaseTarget.Development,
        directory,
        {},
      ),
    ).toThrow("production database URLs");
  });

  it("refuses conflicting root and app database targets", () => {
    write(
      "apps/workspace/.env.preview.local",
      "DATABASE_URL=postgresql://user@ep-prod.neon.tech/app\nBLOB_STORE_ID=store_shared\nVERCEL_OIDC_TOKEN=test",
    );
    expect(() =>
      configureThumbnailBackfillEnvironment(
        DatabaseTarget.Preview,
        directory,
        {},
      ),
    ).toThrow("Conflicting preview");
  });

  it("refuses production storage and missing target credentials on nonproduction runs", () => {
    write(
      "apps/workspace/.env.preview.local",
      "BLOB_STORE_ID=store_prod\nVERCEL_OIDC_TOKEN=test",
    );
    expect(() =>
      configureThumbnailBackfillEnvironment(
        DatabaseTarget.Preview,
        directory,
        {},
      ),
    ).toThrow("production Blob");
    write("apps/workspace/.env.preview.local", "BLOB_STORE_ID=store_shared");
    expect(() =>
      configureThumbnailBackfillEnvironment(DatabaseTarget.Preview, directory, {
        VERCEL_OIDC_TOKEN: "inherited",
      }),
    ).toThrow("Missing preview Blob credentials");
  });

  it("refuses a read-write token whose store differs from the selected store", () => {
    write(
      "apps/workspace/.env.preview.local",
      "BLOB_STORE_ID=store_shared\nBLOB_READ_WRITE_TOKEN=vercel_blob_rw_prod_test",
    );
    expect(() =>
      configureThumbnailBackfillEnvironment(
        DatabaseTarget.Preview,
        directory,
        {},
      ),
    ).toThrow("token and store ID disagree");
  });
});
