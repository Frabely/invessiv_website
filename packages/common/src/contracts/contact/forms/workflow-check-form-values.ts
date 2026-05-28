export type WorkflowCheckFormValues = {
  email: string;
  businessType: string;
  website: string;
  recurringTask: string;
  currentProcess: string;
  consent: boolean;
  name: string;
  desiredOutput: string;
  toolsUsed: string;
  anonymizedExample: string;
  company: string;
};

export const WORKFLOW_CHECK_FORM_INITIAL_VALUES: WorkflowCheckFormValues = {
  email: "",
  businessType: "",
  website: "",
  recurringTask: "",
  currentProcess: "",
  consent: false,
  name: "",
  desiredOutput: "",
  toolsUsed: "",
  anonymizedExample: "",
  company: "",
};
