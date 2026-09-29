/** Opens a short-lived download URL without keeping it anywhere. */
function openUrl(url: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

/** Saves a blob the page already holds, e.g. a ZIP, under the given name. */
function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  // Revoking right away cancels the download in some browsers.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export const browserDownload = { openUrl, saveBlob };
