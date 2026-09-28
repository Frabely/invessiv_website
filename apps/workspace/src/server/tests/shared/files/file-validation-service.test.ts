import { describe, expect, it, vi } from "vitest";
import { createInMemoryStorage } from "@invessiv/storage/testing";
import { fileValidationService } from "@/server/shared/files/file-validation-service";
import { UploadExtension } from "@invessiv/common/constants/files/upload-extension";
import { UPLOAD_CONTENT_TYPES } from "@invessiv/common/constants/files/upload-content-types";
import { FileErrorCode } from "@invessiv/common/constants/files/file-error-code";
import { FileInspectionStatus } from "@invessiv/common/constants/files/file-inspection-status";

vi.mock("server-only", () => ({}));
const encoder = new TextEncoder();
const cssUrlSplitByCdata = ["u<![CDATA[", "rl(https://example.com/a)]]>"].join(
  "",
);
// Built at runtime so the IDE's SVG schema check — which flags <set> as invalid both with
// and without attributeName — doesn't misread this deliberately minimal, unsafe fixture.
const bareSetTag = "<svg><se" + "t/></svg>";

function fixture(extension: UploadExtension, data: Uint8Array) {
  const storage = createInMemoryStorage();
  const storageKey = "files/a." + extension;
  storage.seed(storageKey, data, UPLOAD_CONTENT_TYPES[extension]);
  return { storage, input: { storageKey, extension, sizeBytes: data.length } };
}

async function validateText(
  text: string,
  extension: UploadExtension = UploadExtension.Svg,
) {
  const { storage, input } = fixture(extension, encoder.encode(text));
  return fileValidationService.validate(storage.adapter, input);
}

// Minimal stored ZIP records; metadata is generated independently of the validator.
function office(names: string[]) {
  const local: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const name of names) {
    const nameBytes = encoder.encode(name);
    const body = encoder.encode("<xml/>");
    const entry = new Uint8Array(30 + nameBytes.length + body.length);
    const lv = new DataView(entry.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint32(18, body.length, true);
    lv.setUint32(22, body.length, true);
    lv.setUint16(26, nameBytes.length, true);
    entry.set(nameBytes, 30);
    entry.set(body, 30 + nameBytes.length);
    local.push(entry);
    const header = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(header.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(6, 20, true);
    cv.setUint32(20, body.length, true);
    cv.setUint32(24, body.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, offset, true);
    header.set(nameBytes, 46);
    central.push(header);
    offset += entry.length;
  }
  const cdSize = central.reduce((sum, item) => sum + item.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, names.length, true);
  ev.setUint16(10, names.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, offset, true);
  const result = new Uint8Array(offset + cdSize + 22);
  let cursor = 0;
  for (const part of [...local, ...central, end]) {
    result.set(part, cursor);
    cursor += part.length;
  }
  return result;
}

describe("file finalization validation", () => {
  it("keeps valid files explicitly unscanned", async () => {
    expect(await validateText("%PDF-1.7", UploadExtension.Pdf)).toEqual({
      ok: true,
      inspectionStatus: FileInspectionStatus.Unscanned,
    });
  });
  it("rejects fake image data and mismatched metadata before inspecting contents", async () => {
    const { storage, input } = fixture(
      UploadExtension.Png,
      encoder.encode('<html lang="en">fake</html>'),
    );
    expect(
      await fileValidationService.validate(storage.adapter, input),
    ).toEqual({ ok: false, code: FileErrorCode.InvalidSignature });
    expect(
      await fileValidationService.validate(storage.adapter, {
        ...input,
        sizeBytes: input.sizeBytes + 1,
      }),
    ).toEqual({ ok: false, code: FileErrorCode.SizeMismatch });
    storage.seed(
      input.storageKey,
      encoder.encode('<html lang="en">fake</html>'),
      "text/html",
    );
    expect(
      await fileValidationService.validate(storage.adapter, input),
    ).toEqual({ ok: false, code: FileErrorCode.ContentTypeMismatch });
    await storage.adapter.delete(input.storageKey);
    expect(
      await fileValidationService.validate(storage.adapter, input),
    ).toEqual({ ok: false, code: FileErrorCode.MissingObject });
  });
  it("rejects oversized stored objects before reading their bytes", async () => {
    const { storage, input } = fixture(
      UploadExtension.Png,
      new Uint8Array([1]),
    );
    vi.spyOn(storage.adapter, "head").mockResolvedValue({
      size: 40e6 + 1,
      contentType: UPLOAD_CONTENT_TYPES.png,
    });
    const read = vi.spyOn(storage.adapter, "readRange");
    expect(
      await fileValidationService.validate(storage.adapter, input),
    ).toEqual({ ok: false, code: FileErrorCode.TooLarge });
    expect(read).not.toHaveBeenCalled();
  });
  it("checks text beyond the prefix and handles split UTF-8 sequences", async () => {
    const lateNul = "a".repeat(70_000) + "\0";
    expect(await validateText(lateNul, UploadExtension.Txt)).toEqual({
      ok: false,
      code: FileErrorCode.InvalidSignature,
    });
    const { storage, input } = fixture(
      UploadExtension.Csv,
      encoder.encode("ä"),
    );
    vi.spyOn(storage.adapter, "openReadStream").mockResolvedValue(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([0xc3]));
          controller.enqueue(new Uint8Array([0xa4]));
          controller.close();
        },
      }),
    );
    expect(
      (await fileValidationService.validate(storage.adapter, input)).ok,
    ).toBe(true);
  });
  it("checks the entire SVG including late scripts", async () => {
    expect(
      (
        await validateText(
          '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>',
        )
      ).ok,
    ).toBe(true);
    expect(
      await validateText(
        "<svg><!--" + "a".repeat(70_000) + "--><script>alert(1)</script></svg>",
      ),
    ).toEqual({ ok: false, code: FileErrorCode.UnsafeSvg });
  });
  it.each([
    "<svg><script/></svg>",
    '<svg onload="alert(1)"/>',
    "<svg><foreignObject/></svg>",
    '<svg><use href="https://example.com/a"/></svg>',
    '<svg><use href="data:image/png,x"/></svg>',
    '<!DOCTYPE svg [<!ENTITY x "x">]><svg/>',
    "<svg><path></svg>",
    '<svg><style>@import "https://example.com/a";</style></svg>',
    `<svg><style>a{fill:${cssUrlSplitByCdata}}</style></svg>`,
    bareSetTag,
    '<?xml-stylesheet href="https://example.com/a"?><svg/>',
  ])("rejects unsafe XML: %s", async (source) => {
    expect(await validateText(source)).toEqual({
      ok: false,
      code: FileErrorCode.UnsafeSvg,
    });
  });
  it("allows local SVG references and safe styles", async () => {
    expect(
      (
        await validateText(
          '<svg xmlns="http://www.w3.org/2000/svg"><style>.a{fill:url(#paint)}</style><use href="#shape"/></svg>',
        )
      ).ok,
    ).toBe(true);
  });
  it.each([
    [UploadExtension.Docx, "word/document.xml"],
    [UploadExtension.Xlsx, "xl/workbook.xml"],
    [UploadExtension.Pptx, "ppt/presentation.xml"],
  ] as const)("checks the %s central directory", async (extension, main) => {
    const { storage, input } = fixture(
      extension,
      office(["[Content_Types].xml", main]),
    );
    expect(
      (await fileValidationService.validate(storage.adapter, input)).ok,
    ).toBe(true);
    for (const names of [
      [main],
      ["[Content_Types].xml", "wrong.xml"],
      ["[Content_Types].xml", main, "word/vbaProject.bin"],
      ["[Content_Types].xml", main, "../escape"],
    ]) {
      const bad = fixture(extension, office(names));
      expect(
        await fileValidationService.validate(bad.storage.adapter, bad.input),
      ).toEqual({ ok: false, code: FileErrorCode.InvalidOffice });
    }
  });
  it("rejects corrupt offsets, duplicate entries, ZIP64 and truncated archives", async () => {
    const valid = office(["[Content_Types].xml", "word/document.xml"]);
    const offset = valid.slice();
    new DataView(offset.buffer).setUint32(offset.length - 6, 0xffffffff, true);
    const zip64 = valid.slice();
    new DataView(zip64.buffer).setUint16(zip64.length - 12, 0xffff, true);
    const misleadingLocalName = valid.slice();
    misleadingLocalName[30] = "X".charCodeAt(0);
    for (const data of [
      offset,
      zip64,
      misleadingLocalName,
      valid.slice(0, -1),
      office(["[Content_Types].xml", "word/document.xml", "word/document.xml"]),
    ]) {
      const { storage, input } = fixture(UploadExtension.Docx, data);
      expect(
        (await fileValidationService.validate(storage.adapter, input)).ok,
      ).toBe(false);
    }
  });
  it("propagates operational failures without deleting an object or claiming it is valid", async () => {
    const { storage, input } = fixture(
      UploadExtension.Pdf,
      encoder.encode("%PDF-1.7"),
    );
    vi.spyOn(storage.adapter, "readRange").mockRejectedValue(
      new Error("unavailable"),
    );
    const deletion = vi.spyOn(storage.adapter, "delete");
    await expect(
      fileValidationService.validate(storage.adapter, input),
    ).rejects.toThrow("unavailable");
    expect(deletion).not.toHaveBeenCalled();
  });
});
