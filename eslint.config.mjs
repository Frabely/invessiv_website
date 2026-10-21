import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import localRules from "./tooling/eslint/local-rules.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  localRules,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".claude/worktrees/**/.next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "kunden_templates/**",
    "next-seed-temp/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
