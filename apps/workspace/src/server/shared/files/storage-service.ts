import "server-only";
import { createStorage } from "@invessiv/storage";

let adapter: ReturnType<typeof createStorage> | undefined;

export const storageService = {
  getAdapter() {
    return (adapter ??= createStorage());
  },
};
