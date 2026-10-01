export const SITE_ROUTES = {
  WORKSPACE: "",
  DASHBOARD: "/dashboard",
  LEADS: "/leads",
  CRM: "/crm",
  CRM_LINE_ITEM_TEMPLATES: "/crm/line-item-templates",
  CRM_QUESTIONNAIRE_TEMPLATES: "/crm/questionnaire-templates",
  CRM_QUESTIONNAIRE_BLOCK_EDITOR: "/crm/questionnaire-templates/blocks",
  CRM_QUESTIONNAIRE_TEMPLATE_EDITOR: "/crm/questionnaire-templates/templates",
  CRM_TASKS: "/crm/tasks",
  CRM_MESSAGES: "/crm/messages",
  CRM_FEEDBACK: "/crm/feedback",
  SETTINGS: "/settings",
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  PORTAL: "/portal",
  PORTAL_INVITE: "/portal/invite",
} as const;

export const REDIRECT_URL_QUERY_PARAM = "redirect_url";
