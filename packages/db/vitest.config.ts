import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@invessiv\/db\/scripts\/(.+)$/,
        replacement: path.resolve(__dirname, "scripts/$1"),
      },
      {
        find: /^@invessiv\/db\/(.+)$/,
        replacement: path.resolve(__dirname, "src/$1"),
      },
      {
        find: /^@invessiv\/db$/,
        replacement: path.resolve(__dirname, "src/index.ts"),
      },
      {
        find: /^@invessiv\/common\/(.+)$/,
        replacement: path.resolve(__dirname, "../common/src/$1"),
      },
      {
        find: /^@invessiv\/common$/,
        replacement: path.resolve(__dirname, "../common/src/index.ts"),
      },
    ],
  },
  test: {
    environment: "node",
    exclude: ["**/node_modules/**"],
  },
});
