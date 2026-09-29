import { FileQueryParam } from "@/common/constants/files/file-query-params";

/** Opens a short-lived download URL without keeping it anywhere. */
function openUrl(url: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

/** A same-origin frame streams the attachment while exposing a JSON error response to the page. */
function downloadUrl(
  url: string,
  filename: string,
  onError: (code: string | null) => void,
) {
  const destination = new URL(url, window.location.href);
  destination.searchParams.set(FileQueryParam.ArchiveFilename, filename);
  const frame = document.createElement("iframe");
  frame.hidden = true;
  frame.setAttribute("aria-hidden", "true");
  const cleanup = window.setTimeout(() => frame.remove(), 125_000);
  frame.addEventListener("load", () => {
    try {
      if (frame.contentWindow?.location.href === "about:blank") return;
    } catch {
      // A redirect outside this origin is handled as a generic download error below.
    }
    try {
      const payload = JSON.parse(frame.contentDocument?.body.textContent ?? "");
      onError(typeof payload?.code === "string" ? payload.code : null);
    } catch {
      onError(null);
    } finally {
      window.clearTimeout(cleanup);
      frame.remove();
    }
  });
  document.body.append(frame);
  frame.src = destination.href;
}

export const browserDownload = { openUrl, downloadUrl };
