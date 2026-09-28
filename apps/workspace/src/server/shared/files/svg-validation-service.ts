import "server-only";
import { SaxesParser } from "saxes";

function safeCss(value: string): boolean {
  // Reject CSS escapes/comments/imports rather than attempting browser CSS recovery.
  if (
    /[\\@]/.test(value) ||
    value.includes("/*") ||
    /javascript\s*:/i.test(value)
  )
    return false;
  return !/url\s*\(/i.test(
    value.replace(/url\(\s*["']?#[a-z0-9_.:-]+["']?\s*\)/gi, ""),
  );
}

function validate(bytes: Uint8Array): boolean {
  try {
    const source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (/<!ENTITY|<!DOCTYPE/i.test(source)) return false;
    let valid = true;
    let root = false;
    let depth = 0;
    let styleDepth = 0;
    let styleText = "";
    const parser = new SaxesParser({ xmlns: true });
    parser.on("error", () => {
      valid = false;
    });
    parser.on("doctype", () => {
      valid = false;
    });
    parser.on("processinginstruction", () => {
      valid = false;
    });
    parser.on("opentag", (tag) => {
      depth++;
      const name = tag.local.toLowerCase();
      if (!root) {
        root = true;
        if (
          name !== "svg" ||
          !["", "http://www.w3.org/2000/svg"].includes(tag.uri)
        )
          valid = false;
      }
      if (
        (tag.uri && tag.uri !== "http://www.w3.org/2000/svg") ||
        [
          "script",
          "foreignobject",
          "animate",
          "animatetransform",
          "animatemotion",
          "set",
          "discard",
        ].includes(name)
      )
        valid = false;
      if (name === "style") {
        styleDepth = depth;
        styleText = "";
      }
      for (const attr of Object.values(tag.attributes)) {
        const local = attr.local.toLowerCase();
        const value = attr.value.trim();
        if (
          local.startsWith("on") ||
          value.includes("\\") ||
          /javascript\s*:/i.test(value) ||
          local === "base" ||
          (["href", "src"].includes(local) && !/^#[^\s]+$/.test(value)) ||
          (local === "style" && !safeCss(value)) ||
          (/url\s*\(/i.test(value) && !safeCss(value))
        )
          valid = false;
      }
    });
    const checkText = (text: string) => {
      if (styleDepth) styleText += text;
    };
    parser.on("text", checkText);
    parser.on("cdata", checkText);
    parser.on("closetag", () => {
      if (styleDepth === depth) {
        if (!safeCss(styleText)) valid = false;
        styleDepth = 0;
      }
      depth--;
    });
    parser.write(source).close();
    return root && valid && depth === 0;
  } catch {
    return false;
  }
}

export const svgValidationService = { validate };
