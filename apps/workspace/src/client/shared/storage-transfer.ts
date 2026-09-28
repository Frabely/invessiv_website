import { UploadTransferErrorCode } from "@invessiv/common/constants/files/upload-transfer-error-code";
import type { StorageUploadTicket } from "@invessiv/common/contracts/storage/storage-upload-ticket";
import type { StorageTransferResult } from "@/common/contracts/files/storage-transfer-result";

/**
 * Sends a file straight to storage with the server-issued ticket. XHR instead of fetch because
 * only XHR reports upload progress. The ticket URL is never logged.
 */
export function transferToStorage(
  ticket: StorageUploadTicket,
  file: Blob,
  onProgress: (fraction: number) => void,
  signal: AbortSignal,
): Promise<StorageTransferResult> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve({ ok: false, aborted: true });
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open(ticket.method, ticket.url);
    for (const [name, value] of Object.entries(ticket.headers))
      xhr.setRequestHeader(name, value);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () =>
      resolve(
        xhr.status >= 200 && xhr.status < 300
          ? { ok: true }
          : { ok: false, code: UploadTransferErrorCode.Refused },
      );
    xhr.onerror = () =>
      resolve({ ok: false, code: UploadTransferErrorCode.Network });
    xhr.onabort = () => resolve({ ok: false, aborted: true });
    signal.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  });
}
