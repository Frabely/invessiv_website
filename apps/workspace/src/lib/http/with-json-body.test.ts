import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { z } from "zod";
import { withValidatedJsonBody } from "./with-json-body";

describe("withValidatedJsonBody", () => {
  it.each([
    ["{", 400],
    ['{"title":1}', 422],
    ['{"title":"Valid"}', 201],
  ])(
    "separates invalid JSON and shape errors before calling the command (%s)",
    async (body, status) => {
      const run = vi
        .fn()
        .mockResolvedValue(new Response(null, { status: 201 }));
      const response = await withValidatedJsonBody(
        new NextRequest("https://example.com/api", { method: "POST", body }),
        z.object({ title: z.string() }),
        run,
        () => new Response(null, { status: 400 }),
        () => new Response(null, { status: 422 }),
      );
      expect(response.status).toBe(status);
      if (status === 201)
        expect(run).toHaveBeenCalledExactlyOnceWith({ title: "Valid" });
      else expect(run).not.toHaveBeenCalled();
    },
  );
});
