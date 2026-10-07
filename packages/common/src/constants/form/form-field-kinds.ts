export const FormFieldKind = {
  Custom: "custom",
  Date: "date",
  Email: "email",
  Number: "number",
  Password: "password",
  Select: "select",
  Tel: "tel",
  Text: "text",
  Textarea: "textarea",
  Url: "url",
} as const;

export type FormFieldKind = (typeof FormFieldKind)[keyof typeof FormFieldKind];

export const FORM_FIELD_KIND_VALUES = [
  FormFieldKind.Custom,
  FormFieldKind.Date,
  FormFieldKind.Email,
  FormFieldKind.Number,
  FormFieldKind.Password,
  FormFieldKind.Select,
  FormFieldKind.Tel,
  FormFieldKind.Text,
  FormFieldKind.Textarea,
  FormFieldKind.Url,
] as const;
