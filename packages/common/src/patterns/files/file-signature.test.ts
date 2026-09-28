import { describe, expect, it } from "vitest";
import { matchesFileSignature } from "./file-signature";
import { UploadExtension } from "../../constants/files/upload-extension";

const encoder = new TextEncoder();
describe("file signatures", () => {
  it("checks each binary family", () => {
    const samples: [UploadExtension, Uint8Array][] = [
      [UploadExtension.Pdf, encoder.encode("%PDF-1.7")],
      [UploadExtension.Png, new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])],
      [UploadExtension.Jpg, new Uint8Array([255, 216, 255])],
      [UploadExtension.Jpeg, new Uint8Array([255, 216, 255])],
      [UploadExtension.Webp, encoder.encode("RIFF0000WEBP")],
      [UploadExtension.Webm, new Uint8Array([0x1a, 0x45, 0xdf, 0xa3])],
      [UploadExtension.Otf, encoder.encode("OTTO")],
      [UploadExtension.Ttf, new Uint8Array([0, 1, 0, 0])],
      [UploadExtension.Woff2, encoder.encode("wOF2")],
      [UploadExtension.Txt, encoder.encode("Grüße")],
      [UploadExtension.Csv, encoder.encode("a,b\n1,2")],
      ...[UploadExtension.Docx, UploadExtension.Xlsx, UploadExtension.Pptx].map(
        (extension) =>
          [extension, new Uint8Array([80, 75, 3, 4])] as [
            UploadExtension,
            Uint8Array,
          ],
      ),
    ];
    for (const [extension, bytes] of samples) {
      expect(matchesFileSignature(bytes, extension)).toBe(true);
      if (
        extension !== UploadExtension.Txt &&
        extension !== UploadExtension.Csv
      )
        expect(
          matchesFileSignature(encoder.encode("<html>fake</html>"), extension),
        ).toBe(false);
    }
  });
  it("distinguishes BMFF brands", () => {
    for (const [extension, brand] of [
      [UploadExtension.Heic, "heic"],
      [UploadExtension.Heif, "mif1"],
      [UploadExtension.Mov, "qt  "],
      [UploadExtension.Mp4, "isom"],
    ] as const) {
      const bytes = new Uint8Array(20);
      new DataView(bytes.buffer).setUint32(0, 20);
      bytes.set(encoder.encode("ftyp" + brand), 4);
      bytes.set(encoder.encode(brand), 16);
      expect(matchesFileSignature(bytes, extension)).toBe(true);
      expect(matchesFileSignature(bytes, UploadExtension.Png)).toBe(false);
    }
    const avif = new Uint8Array(20);
    new DataView(avif.buffer).setUint32(0, 20);
    avif.set(encoder.encode("ftypavif"), 4);
    avif.set(encoder.encode("mif1"), 16);
    expect(matchesFileSignature(avif, UploadExtension.Heif)).toBe(false);
    expect(matchesFileSignature(avif, UploadExtension.Mp4)).toBe(false);
  });
  it("rejects malformed UTF-8 and NUL", () => {
    for (const bytes of [
      new Uint8Array([0xc3]),
      new Uint8Array([0]),
      new Uint8Array([0xff]),
    ])
      expect(matchesFileSignature(bytes, UploadExtension.Txt)).toBe(false);
  });
});
