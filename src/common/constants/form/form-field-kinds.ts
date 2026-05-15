export const FormFieldKind = {
  Email: "email",
  Number: "number",
  Select: "select",
  Tel: "tel",
  Text: "text",
  Textarea: "textarea",
  Url: "url",
} as const;

export type FormFieldKind = (typeof FormFieldKind)[keyof typeof FormFieldKind];

export const FORM_FIELD_KIND_VALUES = [
  FormFieldKind.Email,
  FormFieldKind.Number,
  FormFieldKind.Select,
  FormFieldKind.Tel,
  FormFieldKind.Text,
  FormFieldKind.Textarea,
  FormFieldKind.Url,
] as const;
