import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const DEFAULT_PACKAGES = [
  { name: "@invessiv/ui", srcDir: path.join(REPO_ROOT, "packages/ui/src") },
];

const TEST_FILE_PATTERN = /\.test\.[cm]?[jt]sx?$/;
const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs"];
const BARREL_EXPORT_PATTERN =
  /export\s+(\*|(?:type\s+)?\{[^}]*\})\s+from\s+["']([^"']+)["']/g;

const barrelCache = new Map();

function stripExtension(filePath) {
  const extension = SOURCE_EXTENSIONS.find((ext) => filePath.endsWith(ext));
  return extension ? filePath.slice(0, -extension.length) : filePath;
}

function exportedNames(clause) {
  return clause
    .replace(/^type\s+/, "")
    .slice(1, -1)
    .split(",")
    .map((part) => part.trim().replace(/^type\s+/, ""))
    .filter(Boolean)
    .map((part) => part.split(/\s+as\s+/).at(-1));
}

/** Maps each module the barrel re-exports to "*" or the names it re-exports. */
function readBarrel(srcDir) {
  const indexFile = path.join(srcDir, "index.ts");
  const stat = fs.statSync(indexFile, { throwIfNoEntry: false });
  if (!stat) return new Map();

  const cached = barrelCache.get(indexFile);
  if (cached && cached.mtimeMs === stat.mtimeMs) return cached.modules;

  const modules = new Map();
  const source = fs.readFileSync(indexFile, "utf8");
  for (const [, clause, specifier] of source.matchAll(BARREL_EXPORT_PATTERN)) {
    if (!specifier.startsWith(".")) continue;
    const modulePath = path.resolve(srcDir, specifier);
    const previous = modules.get(modulePath);
    if (previous === "*") continue;
    if (clause === "*") {
      modules.set(modulePath, "*");
      continue;
    }
    modules.set(
      modulePath,
      new Set([...(previous ?? []), ...exportedNames(clause)]),
    );
  }

  barrelCache.set(indexFile, { mtimeMs: stat.mtimeMs, modules });
  return modules;
}

function importedNames(node) {
  return node.specifiers.map((specifier) => {
    if (specifier.type === "ImportDefaultSpecifier") return "default";
    if (specifier.type === "ImportNamespaceSpecifier") return null;
    return specifier.imported.name ?? specifier.imported.value;
  });
}

function isServedByBarrel(barrel, modulePath, names) {
  const exported = barrel.get(stripExtension(modulePath));
  if (!exported || names.length === 0) return false;
  return names.every(
    (name) =>
      name !== null &&
      name !== "default" &&
      (exported === "*" || exported.has(name)),
  );
}

function isInside(filePath, dir) {
  const relative = path.relative(dir, filePath);
  return (
    relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative)
  );
}

/** Reports imports that bypass a package barrel which already serves the same symbols. */
const preferPackageBarrelImport = {
  meta: {
    type: "suggestion",
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          packages: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                srcDir: { type: "string" },
              },
              required: ["name", "srcDir"],
              additionalProperties: false,
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      preferBarrel:
        'Import from "{{name}}"; its barrel already exports these symbols.',
    },
  },
  create(context) {
    const packages = context.options[0]?.packages ?? DEFAULT_PACKAGES;
    const filename = path.resolve(context.filename);
    const sourceCode = context.sourceCode;

    return {
      ImportDeclaration(node) {
        const specifier = node.source.value;
        if (typeof specifier !== "string") return;

        for (const pkg of packages) {
          const srcDir = path.resolve(pkg.srcDir);
          let modulePath = null;

          if (specifier.startsWith(".")) {
            // Package sources must stay off their own barrel to avoid cycles; only tests use it.
            if (
              !isInside(filename, srcDir) ||
              !TEST_FILE_PATTERN.test(filename)
            )
              continue;
            modulePath = path.resolve(path.dirname(filename), specifier);
          } else if (
            specifier.startsWith(`${pkg.name}/`) &&
            !isInside(filename, srcDir)
          ) {
            modulePath = path.join(
              srcDir,
              specifier.slice(pkg.name.length + 1),
            );
          } else {
            continue;
          }

          if (
            !isServedByBarrel(
              readBarrel(srcDir),
              modulePath,
              importedNames(node),
            )
          )
            continue;

          const hasBarrelImport = sourceCode.ast.body.some(
            (statement) =>
              statement !== node &&
              statement.type === "ImportDeclaration" &&
              statement.source.value === pkg.name,
          );

          context.report({
            node: node.source,
            messageId: "preferBarrel",
            data: { name: pkg.name },
            // Merging into an existing barrel import is left to the author.
            fix: hasBarrelImport
              ? null
              : (fixer) =>
                  fixer.replaceText(node.source, JSON.stringify(pkg.name)),
          });
          return;
        }
      },
    };
  },
};

export default preferPackageBarrelImport;
