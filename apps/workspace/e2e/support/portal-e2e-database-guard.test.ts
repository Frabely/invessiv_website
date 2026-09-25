import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  databaseIdentity,
  loadPortalE2eEnvironment,
} from "./portal-e2e-database-guard.mjs";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function fixture(databaseUrls: {
  development: string;
  appDevelopment?: string;
  preview: string;
  production: string;
}) {
  const root = mkdtempSync(path.join(tmpdir(), "portal-e2e-guard-"));
  temporaryDirectories.push(root);
  const app = path.join(root, "apps", "workspace");
  mkdirSync(app, { recursive: true });
  mkdirSync(path.join(app, "e2e"));
  writeFileSync(
    path.join(app, "e2e", "allowed-development-database.json"),
    JSON.stringify({
      identitySha256: createHash("sha256")
        .update(databaseIdentity(URLs.development))
        .digest("hex"),
    }),
  );
  const writeEnv = (directory: string, target: string, url: string) => {
    writeFileSync(
      path.join(directory, `.env.${target}.local`),
      `DATABASE_URL=${url}\nNEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_example\nCLERK_SECRET_KEY=sk_test_example\n`,
    );
  };
  writeEnv(root, "development", databaseUrls.development);
  writeEnv(
    app,
    "development",
    databaseUrls.appDevelopment ?? databaseUrls.development,
  );
  writeEnv(root, "preview", databaseUrls.preview);
  writeEnv(root, "production", databaseUrls.production);
  return app;
}

const URLs = {
  development: "postgresql://dev:secret@ep-dev.example.com/neondb",
  preview: "postgresql://preview:secret@ep-preview.example.com/neondb",
  production: "postgresql://prod:secret@ep-prod.example.com/neondb",
};

describe("Portal E2E database guard", () => {
  it("accepts only a matching development target", () => {
    const app = fixture(URLs);
    expect(loadPortalE2eEnvironment(app).databaseUrl).toBe(URLs.development);
  });

  it("rejects a production target with different credentials or a pooler URL", () => {
    const app = fixture({
      ...URLs,
      appDevelopment:
        "postgresql://different:password@ep-prod-pooler.example.com/neondb?sslmode=require",
    });
    expect(() => loadPortalE2eEnvironment(app)).toThrow(
      /allowlisted development database/,
    );
    expect(databaseIdentity(URLs.production)).toBe(
      databaseIdentity(
        "postgresql://different:password@ep-prod-pooler.example.com/neondb?sslmode=require",
      ),
    );
  });

  it("rejects preview and production even when the root development file points there", () => {
    expect(() =>
      loadPortalE2eEnvironment(fixture({ ...URLs, development: URLs.preview })),
    ).toThrow(/distinct from preview and production/);
    expect(() =>
      loadPortalE2eEnvironment(
        fixture({ ...URLs, development: URLs.production }),
      ),
    ).toThrow(/distinct from preview and production/);
  });

  it("fails closed when a comparison target is unavailable", () => {
    const app = fixture(URLs);
    rmSync(path.join(app, "..", "..", ".env.production.local"));
    expect(() => loadPortalE2eEnvironment(app)).toThrow(
      /requires .env.production.local/,
    );
  });

  it("rejects a falsely labeled development target even if every local env file agrees", () => {
    const app = fixture({
      development: URLs.production,
      preview: URLs.preview,
      production: "postgresql://other:secret@ep-other.example.com/neondb",
    });
    expect(() => loadPortalE2eEnvironment(app)).toThrow(
      /allowlisted development database/,
    );
  });
});
