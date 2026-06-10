import { describe, expect, it, vi } from "vitest";
import { BoundedJsonBodyResultKind } from "@/common/constants/http/bounded-json-body-result-kind";
import { boundedJsonBodyService } from "./bounded-json-body-service";

vi.mock("server-only", () => ({}));

function streamFromChunks(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

function streamFromByteChunks(
  chunks: Uint8Array[],
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });
}

describe("boundedJsonBodyService.readBoundedJsonBody", () => {
  it("parses valid JSON that arrives in multiple chunks within the limit", async () => {
    const result = await boundedJsonBodyService.readBoundedJsonBody(
      streamFromChunks(['{"topic":', '"Preise"}']),
      100,
    );

    expect(result).toEqual({
      kind: BoundedJsonBodyResultKind.Ok,
      payload: { topic: "Preise" },
    });
  });

  it("accepts JSON whose byte length is exactly at the limit", async () => {
    const body = '{"topic":"Preise"}';
    const result = await boundedJsonBodyService.readBoundedJsonBody(
      streamFromChunks([body]),
      new TextEncoder().encode(body).byteLength,
    );

    expect(result).toEqual({
      kind: BoundedJsonBodyResultKind.Ok,
      payload: { topic: "Preise" },
    });
  });

  it("rejects a payload whose accumulated chunks exceed the limit", async () => {
    const result = await boundedJsonBodyService.readBoundedJsonBody(
      streamFromChunks(["a".repeat(40), "b".repeat(40), "c".repeat(40)]),
      100,
    );

    expect(result).toEqual({
      kind: BoundedJsonBodyResultKind.PayloadTooLarge,
    });
  });

  it("keeps the payload_too_large result when stream cancellation fails", async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      cancel() {
        throw new Error("cancel_failed");
      },
      start(controller) {
        controller.enqueue(encoder.encode("x".repeat(101)));
      },
    });

    const result = await boundedJsonBodyService.readBoundedJsonBody(
      stream,
      100,
    );

    expect(result).toEqual({
      kind: BoundedJsonBodyResultKind.PayloadTooLarge,
    });
  });

  it("rejects an oversized payload independently of any Content-Length header", async () => {
    const request = new Request("http://localhost/", {
      body: JSON.stringify({ topic: "x".repeat(500) }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const result = await boundedJsonBodyService.readBoundedJsonBody(
      request.body,
      100,
    );

    expect(result).toEqual({
      kind: BoundedJsonBodyResultKind.PayloadTooLarge,
    });
  });

  it("returns invalid_json for malformed JSON within the limit", async () => {
    const result = await boundedJsonBodyService.readBoundedJsonBody(
      streamFromChunks(['{"topic":']),
      100,
    );

    expect(result).toEqual({
      kind: BoundedJsonBodyResultKind.InvalidJson,
    });
  });

  it("returns invalid_json for invalid UTF-8 even when the bytes form JSON-like text", async () => {
    const invalidUtf8InsideJsonString = new Uint8Array([
      123, 34, 118, 97, 108, 117, 101, 34, 58, 34, 195, 40, 34, 125,
    ]);

    const result = await boundedJsonBodyService.readBoundedJsonBody(
      streamFromByteChunks([invalidUtf8InsideJsonString]),
      100,
    );

    expect(result).toEqual({
      kind: BoundedJsonBodyResultKind.InvalidJson,
    });
  });

  it("returns invalid_json when no body stream is present", async () => {
    const result = await boundedJsonBodyService.readBoundedJsonBody(null, 100);

    expect(result).toEqual({
      kind: BoundedJsonBodyResultKind.InvalidJson,
    });
  });
});
