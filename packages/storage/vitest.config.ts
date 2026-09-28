import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@invessiv\/common\/(.+)$/,
        replacement: path.resolve(__dirname, "../common/src/$1"),
      },
    ],
  },
  test: { environment: "node" },
});
