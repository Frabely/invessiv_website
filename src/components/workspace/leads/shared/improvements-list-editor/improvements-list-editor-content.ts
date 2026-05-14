export type ImprovementsListEditorContent = {
  title?: string;
  addButton: string;
  addAriaLabel: string;
  fieldLabel: string;
  fieldPlaceholder: string;
  confirmAdd: string;
  confirmEdit: string;
  cancel: string;
  edit: string;
  remove: string;
  emptyState: string;
  validation: {
    required: string;
    tooLong: string;
    tooMany?: string;
  };
};
