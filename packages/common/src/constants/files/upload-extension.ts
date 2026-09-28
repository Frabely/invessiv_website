export const UploadExtension = {
  Pdf: "pdf",
  Pptx: "pptx",
  Docx: "docx",
  Xlsx: "xlsx",
  Txt: "txt",
  Csv: "csv",
  Png: "png",
  Jpg: "jpg",
  Jpeg: "jpeg",
  Webp: "webp",
  Heic: "heic",
  Heif: "heif",
  Svg: "svg",
  Mp4: "mp4",
  Mov: "mov",
  Webm: "webm",
  Otf: "otf",
  Ttf: "ttf",
  Woff2: "woff2",
} as const;
export type UploadExtension =
  (typeof UploadExtension)[keyof typeof UploadExtension];
export const UPLOAD_EXTENSION_VALUES = Object.values(UploadExtension);
