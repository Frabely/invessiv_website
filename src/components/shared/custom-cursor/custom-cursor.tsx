"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import styles from "./custom-cursor.module.css";

type CursorTone =
  | "idle"
  | "cta"
  | "view"
  | "open"
  | "more"
  | "switch"
  | "select"
  | "copy"
  | "type"
  | "submit";

type CursorDescriptor = {
  tone: CursorTone;
  active: boolean;
};

const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";
const CURSOR_TARGET_SELECTOR = [
  "a[href]",
  "button",
  "summary",
  "[role='button']",
  "[role='link']",
  "[role='tab']",
  "[aria-pressed]",
  "[aria-expanded]",
  "input",
  "textarea",
  "select",
  "[contenteditable='true']",
  "[data-cursor-label]",
  "[data-cursor-variant]",
  "[data-cursor-kind]",
].join(", ");

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function isElement(value: Element | null): value is HTMLElement {
  return value instanceof HTMLElement;
}

function useSupportsFinePointer() {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (
        typeof window === "undefined" ||
        typeof window.matchMedia !== "function"
      ) {
        return () => undefined;
      }

      const mediaQuery = window.matchMedia(FINE_POINTER_QUERY);
      mediaQuery.addEventListener("change", onStoreChange);
      return () => mediaQuery.removeEventListener("change", onStoreChange);
    },
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia(FINE_POINTER_QUERY).matches,
    () => false,
  );
}

function resolveInteractiveTarget(element: Element | null) {
  if (!isElement(element)) {
    return null;
  }

  return element.closest<HTMLElement>(CURSOR_TARGET_SELECTOR);
}

function isPrimaryActionTarget(element: HTMLElement) {
  const cursorVariant = element.dataset.cursorVariant;
  if (cursorVariant === "primary") {
    return true;
  }

  const analyticsVariant = element.dataset.analyticsVariant;
  if (analyticsVariant === "primary") {
    return true;
  }

  return (
    element.dataset.cursorKind === "cta" ||
    element.dataset.analyticsTarget === "form"
  );
}

function isSubmitTarget(element: HTMLElement) {
  return (
    element.getAttribute("type") === "submit" ||
    element.dataset.cursorKind === "submit"
  );
}

function isSwitchTarget(element: HTMLElement) {
  if (element.dataset.cursorKind === "switch") {
    return true;
  }

  const ariaLabel = normalizeText(element.getAttribute("aria-label") ?? "");
  return (
    ariaLabel.includes("switch") ||
    ariaLabel.includes("wechsel") ||
    ariaLabel.includes("sprache") ||
    ariaLabel.includes("language") ||
    ariaLabel.includes("locale")
  );
}

function isCopyTarget(element: HTMLElement) {
  if (element.dataset.cursorKind === "copy") {
    return true;
  }

  const text = normalizeText(element.textContent ?? "");
  return text.includes("copy") || text.includes("kopier");
}

function isSelectTarget(element: HTMLElement) {
  return (
    element.dataset.cursorKind === "select" ||
    element.dataset.cursorKind === "toggle" ||
    element.getAttribute("aria-pressed") !== null ||
    element.getAttribute("role") === "tab"
  );
}

function isMoreTarget(element: HTMLElement) {
  return (
    element.dataset.cursorKind === "more" ||
    element.matches("summary") ||
    element.getAttribute("aria-expanded") !== null
  );
}

function isTextTarget(element: HTMLElement) {
  return (
    element.matches("input, textarea, select") ||
    element.isContentEditable ||
    element.dataset.cursorKind === "type"
  );
}

function resolveCursorDescriptor(
  element: HTMLElement | null,
): CursorDescriptor {
  if (!element) {
    return {
      active: false,
      tone: "idle",
    };
  }

  if (element.dataset.cursorVariant === "ghost") {
    return {
      active: true,
      tone: "view",
    };
  }

  if (isTextTarget(element)) {
    return {
      active: true,
      tone: "type",
    };
  }

  if (isSubmitTarget(element)) {
    return {
      active: true,
      tone: "submit",
    };
  }

  if (isPrimaryActionTarget(element)) {
    return {
      active: true,
      tone: "cta",
    };
  }

  if (isCopyTarget(element)) {
    return {
      active: true,
      tone: "copy",
    };
  }

  if (isSwitchTarget(element)) {
    return {
      active: true,
      tone: "switch",
    };
  }

  if (isSelectTarget(element)) {
    return {
      active: true,
      tone: "select",
    };
  }

  if (isMoreTarget(element)) {
    return {
      active: true,
      tone: "more",
    };
  }

  if (element.tagName === "A") {
    const href = element.getAttribute("href") ?? "";

    if (href.startsWith("mailto:") || href.startsWith("tel:")) {
      return {
        active: true,
        tone: "open",
      };
    }

    return {
      active: true,
      tone: "open",
    };
  }

  if (element.tagName === "BUTTON") {
    return {
      active: true,
      tone: "select",
    };
  }

  return {
    active: true,
    tone: "view",
  };
}

export function resolveCustomCursorState(element: HTMLElement | null) {
  return resolveCursorDescriptor(element);
}

export function CustomCursor() {
  const { theme } = useTheme();
  const supportsFinePointer = useSupportsFinePointer();
  const cursorRef = useRef<HTMLSpanElement | null>(null);
  const activeTargetRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [descriptor, setDescriptor] = useState<CursorDescriptor>({
    active: false,
    tone: "idle",
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!supportsFinePointer) {
      document.documentElement.removeAttribute("data-custom-cursor");
      return;
    }

    document.documentElement.setAttribute("data-custom-cursor", "enabled");

    const updateCursorPosition = () => {
      const cursor = cursorRef.current;
      if (!cursor) {
        return;
      }

      cursor.style.setProperty("--cursor-x", `${pointerRef.current.x}px`);
      cursor.style.setProperty("--cursor-y", `${pointerRef.current.y}px`);
    };

    const scheduleCursorPosition = () => {
      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        updateCursorPosition();
      });
    };

    const updateDescriptor = (nextElement: HTMLElement | null) => {
      if (nextElement === activeTargetRef.current) {
        return;
      }

      activeTargetRef.current = nextElement;
      setDescriptor(resolveCursorDescriptor(nextElement));
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") {
        return;
      }

      pointerRef.current = {
        x: event.clientX,
        y: event.clientY,
      };
      setIsVisible(true);
      scheduleCursorPosition();

      const hoveredElement = resolveInteractiveTarget(
        document.elementFromPoint(event.clientX, event.clientY),
      );
      updateDescriptor(hoveredElement);
    };

    const handlePointerLeave = () => {
      activeTargetRef.current = null;
      setDescriptor({
        active: false,
        tone: "idle",
      });
      setIsVisible(false);
    };

    const handleDocumentMouseOut = (event: MouseEvent) => {
      if (event.relatedTarget instanceof Node) {
        return;
      }

      handlePointerLeave();
    };

    const handleWindowBlur = () => {
      handlePointerLeave();
    };

    document.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    document.addEventListener("pointercancel", handlePointerLeave);
    document.addEventListener("mouseout", handleDocumentMouseOut);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointercancel", handlePointerLeave);
      document.removeEventListener("mouseout", handleDocumentMouseOut);
      window.removeEventListener("blur", handleWindowBlur);
      document.documentElement.removeAttribute("data-custom-cursor");
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [supportsFinePointer]);

  useEffect(() => {
    if (!supportsFinePointer || !activeTargetRef.current) {
      return;
    }

    setDescriptor(resolveCursorDescriptor(activeTargetRef.current));
  }, [supportsFinePointer, theme]);

  if (!supportsFinePointer) {
    return null;
  }

  return (
    <span
      aria-hidden="true"
      className={styles.root}
      data-state={isVisible ? "visible" : "hidden"}
      data-tone={descriptor.tone}
      ref={cursorRef}
    />
  );
}
