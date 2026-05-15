import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const loadDotenvMock = vi.hoisted(() => vi.fn());

vi.mock("dotenv", () => ({
  config: loadDotenvMock,
}));

describe("loadLocalEnvFiles", () => {
  beforeEach(() => {
    vi.resetModules();
    loadDotenvMock.mockClear();
  });

  it("loads shared and environment-specific local env files", async () => {
    const { loadLocalEnvFiles } = await import("@/server/config/load-env");

    loadLocalEnvFiles();

    expect(loadDotenvMock).toHaveBeenCalledTimes(4);
    expect(loadDotenvMock.mock.calls.map(([options]) => options)).toEqual([
      {
        quiet: true,
        override: false,
        path: path.join(process.cwd(), ".env.local"),
      },
      {
        quiet: true,
        override: false,
        path: path.join(process.cwd(), ".env.development.local"),
      },
      {
        quiet: true,
        override: false,
        path: path.join(process.cwd(), ".env.preview.local"),
      },
      {
        quiet: true,
        override: false,
        path: path.join(process.cwd(), ".env.production.local"),
      },
    ]);
  });
});
