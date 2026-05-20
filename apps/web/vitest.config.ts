import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@invessiv\/db\/(.+)$/,
        replacement: path.resolve(__dirname, "../../packages/db/src/$1"),
      },
      {
        find: /^@invessiv\/db$/,
        replacement: path.resolve(__dirname, "../../packages/db/src/index.ts"),
      },
      {
        find: /^@invessiv\/common\/(.+)$/,
        replacement: path.resolve(__dirname, "../../packages/common/src/$1"),
      },
      {
        find: /^@invessiv\/common$/,
        replacement: path.resolve(
          __dirname,
          "../../packages/common/src/index.ts",
        ),
      },
      {
        find: /^@\/(.+)$/,
        replacement: path.resolve(__dirname, "src/$1"),
      },
    ],
  },
  test: {
    environment: "node",
    exclude: [".claude/**", "**/node_modules/**"],
  },
});
