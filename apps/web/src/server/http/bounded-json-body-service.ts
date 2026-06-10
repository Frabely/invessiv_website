import "server-only";
import { BoundedJsonBodyResultKind } from "@/common/constants/http/bounded-json-body-result-kind";
import type { BoundedJsonBodyResult } from "@/common/contracts/http/bounded-json-body-result";

const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });

function concatenateChunks(chunks: Uint8Array[], receivedBytes: number) {
  const bodyBytes = new Uint8Array(receivedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bodyBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bodyBytes;
}

async function cancelReader(reader: ReadableStreamDefaultReader<Uint8Array>) {
  try {
    await reader.cancel();
  } catch {
    // The size verdict is already known. A failed cancel must not turn a
    // payload_too_large result into a generic invalid_json response.
  }
}

/**
 * Reads a request body stream while enforcing a byte limit during the read.
 * The limit cannot be bypassed via a missing or forged Content-Length header
 * because the stream is aborted as soon as the received bytes exceed the
 * limit, before any JSON parsing happens.
 */
async function readBoundedJsonBody(
  bodyStream: ReadableStream<Uint8Array> | null,
  maxBytes: number,
): Promise<BoundedJsonBodyResult> {
  if (!bodyStream) {
    return { kind: BoundedJsonBodyResultKind.InvalidJson };
  }

  const reader = bodyStream.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      receivedBytes += value.byteLength;
      if (receivedBytes > maxBytes) {
        await cancelReader(reader);
        return { kind: BoundedJsonBodyResultKind.PayloadTooLarge };
      }

      chunks.push(value);
    }
  } catch {
    return { kind: BoundedJsonBodyResultKind.InvalidJson };
  } finally {
    reader.releaseLock();
  }

  try {
    const bodyText = UTF8_DECODER.decode(
      concatenateChunks(chunks, receivedBytes),
    );
    return {
      kind: BoundedJsonBodyResultKind.Ok,
      payload: JSON.parse(bodyText) as unknown,
    };
  } catch {
    return { kind: BoundedJsonBodyResultKind.InvalidJson };
  }
}

export const boundedJsonBodyService = {
  readBoundedJsonBody,
} as const;
