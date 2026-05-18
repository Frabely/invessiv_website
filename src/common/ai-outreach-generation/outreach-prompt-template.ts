export const OutreachTemplateInput = {
  FirstName: "firstName",
  CompanyName: "companyName",
  WebsiteStatus: "websiteStatus",
  CategoryLabel: "categoryLabel",
  Notes: "notes",
  Improvements: "improvements",
  ContextNote: "contextNote",
} as const;

export type OutreachTemplateInput =
  (typeof OutreachTemplateInput)[keyof typeof OutreachTemplateInput];

export interface OutreachPromptTemplate {
  templateExample: string;
  templateInstructions: string[];
  requiredInputs: readonly OutreachTemplateInput[];
}
