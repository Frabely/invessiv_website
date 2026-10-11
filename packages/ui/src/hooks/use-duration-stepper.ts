"use client";

import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

/** Wheel input belongs only to the value under a fine pointer; touch input uses pointer capture. */
export function useDurationStepper(stepAction: (steps: number) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const step = useRef(stepAction);
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null);
  useEffect(() => {
    step.current = stepAction;
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let distance = 0;
    let lastWheel = 0;
    function wheel(event: WheelEvent) {
      if (
        event.ctrlKey ||
        !window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
      )
        return;
      if (event.deltaY === 0) return;
      event.preventDefault();
      const now = Date.now();
      const delta =
        event.deltaY *
        (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 120 : 1);
      if (now - lastWheel > 180 || Math.sign(distance) !== Math.sign(delta))
        distance = 0;
      lastWheel = now;
      distance += delta;
      if (Math.abs(distance) >= 40) {
        step.current(distance < 0 ? 1 : -1);
        distance = 0;
      }
    }
    element.addEventListener("wheel", wheel, { passive: false });
    return () => {
      element.removeEventListener("wheel", wheel);
      gesture.current = null;
    };
  }, []);

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (
      (event.pointerType !== "touch" && event.pointerType !== "pen") ||
      !event.isPrimary
    )
      return;
    gesture.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }
  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId) return;
    const distance = current.y - event.clientY;
    if (Math.abs(event.clientX - current.x) > Math.abs(distance)) return;
    const steps = Math.trunc(distance / 24);
    if (!steps) return;
    event.preventDefault();
    current.y -= steps * 24;
    step.current(steps);
  }
  function pointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (gesture.current?.id !== event.pointerId) return;
    gesture.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function keyDown(event: KeyboardEvent<HTMLDivElement>) {
    const steps = {
      ArrowUp: 1,
      ArrowDown: -1,
      PageUp: 5,
      PageDown: -5,
      Home: -Number.MAX_SAFE_INTEGER,
      End: Number.MAX_SAFE_INTEGER,
    }[event.key];
    if (steps === undefined) return;
    event.preventDefault();
    step.current(steps);
  }
  return {
    ref,
    onPointerDown: pointerDown,
    onPointerMove: pointerMove,
    onPointerUp: pointerEnd,
    onPointerCancel: pointerEnd,
    onLostPointerCapture: pointerEnd,
    onKeyDown: keyDown,
  };
}
