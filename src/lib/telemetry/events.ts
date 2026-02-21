export type CtaKind = "primary" | "secondary";

export type CtaClickEvent = {
  event: "cta_click";
  kind: CtaKind;
  placement: string;
  target: string;
  timestamp: string;
};

export function createCtaClickEvent(params: {
  kind: CtaKind;
  placement: string;
  target: string;
}): CtaClickEvent {
  return {
    event: "cta_click",
    kind: params.kind,
    placement: params.placement.trim(),
    target: params.target.trim(),
    timestamp: new Date().toISOString(),
  };
}
