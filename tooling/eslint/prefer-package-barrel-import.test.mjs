import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";
import { RuleTester } from "eslint";
import nextTs from "eslint-config-next/typescript";
import rule from "./prefer-package-barrel-import.mjs";

const { parser } = nextTs.find(
  (config) => config.languageOptions?.parser,
).languageOptions;

const root = fs.mkdtempSync(path.join(os.tmpdir(), "barrel-rule-"));
const srcDir = path.join(root, "packages/ui/src");
fs.mkdirSync(path.join(srcDir, "components/badge"), { recursive: true });
fs.writeFileSync(
  path.join(srcDir, "index.ts"),
  [
    'export * from "./components/badge/badge";',
    'export type { HelperProps } from "./components/badge/badge-helper";',
  ].join("\n"),
);

const options = [{ packages: [{ name: "@invessiv/ui", srcDir }] }];
const componentDir = path.join(srcDir, "components/badge");
const testFile = path.join(componentDir, "badge.test.tsx");
const sourceFile = path.join(componentDir, "badge-group.tsx");
const appFile = path.join(root, "apps/web/src/page.tsx");

after(() => fs.rmSync(root, { recursive: true, force: true }));

RuleTester.describe = describe;
RuleTester.it = it;
new RuleTester({
  languageOptions: { ecmaVersion: "latest", parser, sourceType: "module" },
}).run("prefer-package-barrel-import", rule, {
  valid: [
    {
      code: 'import { Badge } from "@invessiv/ui";',
      filename: testFile,
      options,
    },
    // Package sources import siblings directly so the barrel never imports itself.
    { code: 'import { Badge } from "./badge";', filename: sourceFile, options },
    {
      code: 'import { render } from "./badge.test-helper";',
      filename: testFile,
      options,
    },
    {
      code: 'import styles from "./badge.module.css";',
      filename: testFile,
      options,
    },
    // Only the listed type is re-exported, so another name has to stay on the module.
    {
      code: 'import { internal } from "./badge-helper";',
      filename: testFile,
      options,
    },
    {
      code: 'import { render } from "@invessiv/ui/components/badge/badge.test-helper";',
      filename: appFile,
      options,
    },
  ],
  invalid: [
    {
      code: 'import { Badge, type BadgeProps } from "./badge";',
      filename: testFile,
      options,
      errors: [{ messageId: "preferBarrel" }],
      output: 'import { Badge, type BadgeProps } from "@invessiv/ui";',
    },
    {
      code: 'import type { HelperProps } from "./badge-helper";',
      filename: testFile,
      options,
      errors: [{ messageId: "preferBarrel" }],
      output: 'import type { HelperProps } from "@invessiv/ui";',
    },
    {
      code: 'import { Badge } from "@invessiv/ui/components/badge/badge";',
      filename: appFile,
      options,
      errors: [{ messageId: "preferBarrel" }],
      output: 'import { Badge } from "@invessiv/ui";',
    },
    {
      code: 'import { Button } from "@invessiv/ui";\nimport { Badge } from "./badge";',
      filename: testFile,
      options,
      errors: [{ messageId: "preferBarrel" }],
      output: null,
    },
  ],
});
