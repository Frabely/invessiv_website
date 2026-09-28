import { UploadExtension } from "../../constants/files/upload-extension";

export function matchesFileSignature(
  bytes: Uint8Array,
  extension: UploadExtension,
): boolean {
  const at = (offset: number, expected: readonly number[]) =>
    expected.every((value, i) => bytes[offset + i] === value);
  const ascii = (offset: number, value: string) =>
    at(
      offset,
      Array.from(value, (c) => c.charCodeAt(0)),
    );
  switch (extension) {
    case UploadExtension.Pdf:
      return ascii(0, "%PDF-");
    case UploadExtension.Png:
      return at(0, [137, 80, 78, 71, 13, 10, 26, 10]);
    case UploadExtension.Jpg:
    case UploadExtension.Jpeg:
      return at(0, [255, 216, 255]);
    case UploadExtension.Webp:
      return ascii(0, "RIFF") && ascii(8, "WEBP");
    case UploadExtension.Webm:
      return at(0, [0x1a, 0x45, 0xdf, 0xa3]);
    case UploadExtension.Otf:
      return ascii(0, "OTTO");
    case UploadExtension.Ttf:
      return at(0, [0, 1, 0, 0]) || ascii(0, "true");
    case UploadExtension.Woff2:
      return ascii(0, "wOF2");
    case UploadExtension.Heic:
    case UploadExtension.Heif:
    case UploadExtension.Mp4:
    case UploadExtension.Mov: {
      if (bytes.length < 16 || !ascii(4, "ftyp")) return false;
      const size = new DataView(
        bytes.buffer,
        bytes.byteOffset,
        bytes.byteLength,
      ).getUint32(0);
      if (size < 16 || size > bytes.length || size % 4 !== 0) return false;
      const brands = [String.fromCharCode(...bytes.slice(8, 12))];
      for (let offset = 16; offset + 4 <= size; offset += 4)
        brands.push(String.fromCharCode(...bytes.slice(offset, offset + 4)));
      const heic = ["heic", "heix", "hevc", "hevx"];
      const heif = [...heic, "mif1", "msf1", "heim", "heis", "hevm", "hevs"];
      if (extension === UploadExtension.Heic)
        return brands.some((brand) => heic.includes(brand));
      if (extension === UploadExtension.Heif)
        return (
          brands.some((brand) => heif.includes(brand)) &&
          !brands.includes("avif") &&
          !brands.includes("avis")
        );
      if (extension === UploadExtension.Mov) return brands.includes("qt  ");
      return (
        !brands.some((brand) =>
          [...heif, "avif", "avis", "qt  "].includes(brand),
        ) &&
        brands.some((brand) =>
          ["isom", "iso2", "mp41", "mp42", "avc1", "M4V ", "dash"].includes(
            brand,
          ),
        )
      );
    }
    case UploadExtension.Txt:
    case UploadExtension.Csv:
      try {
        if (bytes.includes(0)) return false;
        new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        return true;
      } catch {
        return false;
      }
    case UploadExtension.Docx:
    case UploadExtension.Xlsx:
    case UploadExtension.Pptx:
      return at(0, [80, 75, 3, 4]);
    case UploadExtension.Svg:
      return false;
  }
}
