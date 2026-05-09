export const FormFieldKind = {
  Email: "email",
  Number: "number",
  Tel: "tel",
  Text: "text",
  Url: "url",
} as const;

export type FormFieldKind = (typeof FormFieldKind)[keyof typeof FormFieldKind];

export const FORM_FIELD_KIND_VALUES = [
  FormFieldKind.Email,
  FormFieldKind.Number,
  FormFieldKind.Tel,
  FormFieldKind.Text,
  FormFieldKind.Url,
] as const;
