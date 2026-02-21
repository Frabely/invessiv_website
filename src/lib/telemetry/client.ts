import { CtaKind, createCtaClickEvent } from "@/lib/telemetry/events";

const TELEMETRY_EVENT_NAME = "invessiv:telemetry";

type BrowserWindow = Window & typeof globalThis;

function emit(eventPayload: unknown): void {
  if (typeof window === "undefined") {
    return;
  }

  const browserWindow = window as BrowserWindow;

  browserWindow.dispatchEvent(
    new CustomEvent(TELEMETRY_EVENT_NAME, { detail: eventPayload }),
  );

  if (process.env.NODE_ENV !== "production") {
    console.info("[telemetry]", eventPayload);
  }
}

export function trackCtaClick(params: {
  kind: CtaKind;
  placement: string;
  target: string;
}): void {
  emit(createCtaClickEvent(params));
}
