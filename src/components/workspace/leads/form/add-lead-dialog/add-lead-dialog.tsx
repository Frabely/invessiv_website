"use client";

import {
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  LeadErrorCode,
  LeadValidationIssueCode,
} from "@/common/constants/leads/lead-error-codes";
import { LeadListQueryParam } from "@/common/constants/leads/lead-list-query-params";
import { LeadValidationMessageCode } from "@/common/constants/leads/lead-form-validation";
import { CONTACT_EMAIL_PATTERN } from "@/common/patterns/contact/contact-email";
import { isValidContactPhone } from "@/common/patterns/contact/contact-phone";
import {
  ButtonControl,
  PrimaryCtaButton,
} from "@/components/shared/button/button";
import { FormActions } from "@/components/shared/form/form-actions/form-actions";
import { FormField } from "@/components/shared/form/form-field/form-field";
import { FormStatus } from "@/components/shared/form/form-status/form-status";
import { mapAddLeadFormValuesToCreateLeadRequestDto } from "@/client/leads/mappers/map-add-lead-form-to-create-lead-request-dto";
import { ImprovementsSection } from "./improvements-section/improvements-section";
import { SocialProfilesSection } from "./social-profiles-section/social-profiles-section";
import type { LeadCategoryOption } from "@/common/contracts/leads/lead-category-option";
import type {
  LeadsFormDictionary,
  LeadsSharedDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import type { z } from "zod";
import type { AddLeadFormValues } from "@/common/contracts/leads/forms/add-lead-form-values";
import { addLeadFormSchema } from "./add-lead-dialog.schema";
import { leadsService } from "./leads-service";
import styles from "./add-lead-dialog.module.css";

type AddLeadDialogProps = {
  categories: ReadonlyArray<LeadCategoryOption>;
  content: LeadsFormDictionary;
  open: boolean;
  sharedContent: LeadsSharedDictionary;
};

const DEFAULT_VALUES: AddLeadFormValues = {
  first_name: "",
  last_name: "",
  company_name: "",
  email: "",
  phone: "",
  website_url: "",
  category_id: "",
  score: "",
  owner: "",
  notes: "",
  improvements: [],
  social_profiles: [],
};

const AddLeadDialogField = {
  CategoryId: "category_id",
  CompanyName: "company_name",
  Email: "email",
  FirstName: "first_name",
  LastName: "last_name",
  Notes: "notes",
  Owner: "owner",
  Phone: "phone",
  Score: "score",
  WebsiteUrl: "website_url",
} as const;

const AddLeadDialogId = {
  ContactSection: "add-lead-contact",
  DetailsSection: "add-lead-details",
  Description: "add-lead-dialog-description",
  Dialog: "add-lead-dialog-title",
} as const;

function getValidationMessage(
  code: string | undefined,
  content: LeadsFormDictionary,
): string {
  switch (code) {
    case LeadValidationMessageCode.EmailRequired:
      return content.validation.emailRequired;
    case LeadValidationMessageCode.EmailInvalid:
      return content.validation.emailInvalid;
    case LeadValidationMessageCode.ScoreInvalid:
      return content.validation.scoreInvalid;
    case LeadValidationMessageCode.UrlInvalid:
      return content.validation.urlInvalid;
    case LeadValidationMessageCode.CategoryInvalid:
      return content.validation.categoryInvalid;
    case LeadValidationMessageCode.PhoneInvalid:
      return content.validation.phoneInvalid;
    case LeadValidationMessageCode.SocialProfileInvalid:
      return content.validation.socialProfileInvalid;
    case LeadValidationMessageCode.SocialProfileRequired:
      return content.validation.socialProfileRequired;
    case LeadValidationMessageCode.ImprovementRequired:
      return content.validation.improvementRequired;
    case LeadValidationIssueCode.LastNameOrCompanyNameRequired:
      return content.validation.nameRequired;
    default:
      return content.validation.generic;
  }
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        "summary",
        "[contenteditable='true']",
        "[tabindex]:not([tabindex='-1'])",
      ].join(","),
    ),
  ).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.tabIndex >= 0 &&
      !element.hidden,
  );
}

export function AddLeadDialog({
  categories,
  content,
  open,
  sharedContent,
}: AddLeadDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const {
    clearErrors,
    control,
    getValues,
    handleSubmit,
    register,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AddLeadFormValues>({
    defaultValues: DEFAULT_VALUES,
    mode: "onSubmit",
  });

  const validateEmailField = useCallback(() => {
    const emailValue = getValues(AddLeadDialogField.Email).trim();

    if (errors.email?.message === content.validation.emailExists) {
      return;
    }

    setStatusMessage(null);

    if (!emailValue) {
      setError(AddLeadDialogField.Email, {
        message: content.validation.emailRequired,
        type: "manual",
      });
      return;
    }

    if (!CONTACT_EMAIL_PATTERN.test(emailValue)) {
      setError(AddLeadDialogField.Email, {
        message: content.validation.emailInvalid,
        type: "manual",
      });
      return;
    }

    clearErrors(AddLeadDialogField.Email);
  }, [
    clearErrors,
    content.validation.emailInvalid,
    content.validation.emailExists,
    content.validation.emailRequired,
    errors.email?.message,
    getValues,
    setError,
  ]);

  const validateLeadNameFields = useCallback(() => {
    const lastNameValue = getValues(AddLeadDialogField.LastName).trim();
    const companyNameValue = getValues(AddLeadDialogField.CompanyName).trim();
    setStatusMessage(null);

    if (lastNameValue || companyNameValue) {
      clearErrors([
        AddLeadDialogField.LastName,
        AddLeadDialogField.CompanyName,
      ]);
      return;
    }

    setError(AddLeadDialogField.LastName, {
      message: content.validation.nameRequired,
      type: "manual",
    });
    setError(AddLeadDialogField.CompanyName, {
      message: content.validation.nameRequired,
      type: "manual",
    });
  }, [clearErrors, content.validation.nameRequired, getValues, setError]);

  const validatePhoneField = useCallback(() => {
    const phoneValue = getValues(AddLeadDialogField.Phone).trim();
    setStatusMessage(null);

    if (!phoneValue) {
      clearErrors(AddLeadDialogField.Phone);
      return;
    }

    if (!isValidContactPhone(phoneValue)) {
      setError(AddLeadDialogField.Phone, {
        message: content.validation.phoneInvalid,
        type: "manual",
      });
      return;
    }

    clearErrors(AddLeadDialogField.Phone);
  }, [clearErrors, content.validation.phoneInvalid, getValues, setError]);

  const validateWebsiteField = useCallback(() => {
    const websiteValue = getValues(AddLeadDialogField.WebsiteUrl).trim();
    setStatusMessage(null);

    if (!websiteValue) {
      clearErrors(AddLeadDialogField.WebsiteUrl);
      return;
    }

    try {
      const parsedUrl = new URL(websiteValue);
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        setError(AddLeadDialogField.WebsiteUrl, {
          message: content.validation.urlInvalid,
          type: "manual",
        });
        return;
      }
      clearErrors(AddLeadDialogField.WebsiteUrl);
    } catch {
      setError(AddLeadDialogField.WebsiteUrl, {
        message: content.validation.urlInvalid,
        type: "manual",
      });
    }
  }, [clearErrors, content.validation.urlInvalid, getValues, setError]);

  const validateScoreField = useCallback(() => {
    const scoreValue = getValues(AddLeadDialogField.Score).trim();
    setStatusMessage(null);

    if (!scoreValue) {
      clearErrors(AddLeadDialogField.Score);
      return;
    }

    const parsedScore = Number(scoreValue);
    const isValidScore =
      Number.isInteger(parsedScore) && parsedScore >= 0 && parsedScore <= 100;

    if (!isValidScore) {
      setError(AddLeadDialogField.Score, {
        message: content.validation.scoreInvalid,
        type: "manual",
      });
      return;
    }

    clearErrors(AddLeadDialogField.Score);
  }, [clearErrors, content.validation.scoreInvalid, getValues, setError]);

  function focusFirstAvailableField() {
    const container = dialogRef.current;
    if (!container) {
      return;
    }

    const firstInput = container.querySelector<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >("input, select, textarea");
    firstInput?.focus();
  }

  useEffect(() => {
    if (open) {
      window.requestAnimationFrame(() => {
        focusFirstAvailableField();
      });
      return;
    }

    reset(DEFAULT_VALUES);
    clearErrors();
  }, [clearErrors, open, reset]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  function buildHref(withSelectedLeadId?: string): string {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(LeadListQueryParam.Create);

    if (withSelectedLeadId) {
      params.set(LeadListQueryParam.Selected, withSelectedLeadId);
    }

    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  }

  function closeDialog() {
    reset(DEFAULT_VALUES);
    clearErrors();
    setStatusMessage(null);
    router.replace(buildHref(), { scroll: false });
  }

  function handleOverlayClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      closeDialog();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusable = getFocusableElements(event.currentTarget);
    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function resetValidationMessages() {
    setStatusMessage(null);
  }

  function clearLeadNameValidationMessages() {
    clearErrors([AddLeadDialogField.LastName, AddLeadDialogField.CompanyName]);
    resetValidationMessages();
  }

  function applyValidationIssues(issues: z.core.$ZodIssue[]) {
    clearErrors();

    for (const issue of issues) {
      const fieldPath = issue.path
        .filter(
          (part): part is string | number =>
            typeof part === "string" || typeof part === "number",
        )
        .join(".");

      if (
        issue.message === LeadValidationIssueCode.LastNameOrCompanyNameRequired
      ) {
        setError(AddLeadDialogField.LastName, {
          message: content.validation.nameRequired,
          type: "manual",
        });
        setError(AddLeadDialogField.CompanyName, {
          message: content.validation.nameRequired,
          type: "manual",
        });
        continue;
      }

      if (!fieldPath) {
        continue;
      }

      setError(fieldPath as never, {
        message: getValidationMessage(issue.message, content),
        type: "manual",
      });
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    const validation = addLeadFormSchema.safeParse(values);
    if (!validation.success) {
      applyValidationIssues(validation.error.issues);
      setStatusMessage(null);
      return;
    }

    setStatusMessage(content.status.saving);

    try {
      const result = await leadsService.createLead(
        mapAddLeadFormValuesToCreateLeadRequestDto(validation.data),
      );

      if (!result.ok) {
        if (result.code === LeadErrorCode.EmailExists) {
          setError(AddLeadDialogField.Email, {
            message: content.validation.emailExists,
            type: "manual",
          });
          setStatusMessage(null);
          return;
        }

        if (result.code === LeadErrorCode.ValidationError) {
          applyValidationIssues(result.errors);
          setStatusMessage(null);
          return;
        }

        setStatusMessage(content.validation.generic);
        return;
      }

      reset(DEFAULT_VALUES);
      router.replace(buildHref(result.lead.id), { scroll: false });
    } catch {
      setStatusMessage(content.validation.generic);
    }
  });

  const rootErrorMessage =
    typeof errors.root?.message === "string" ? errors.root?.message : null;

  return (
    <div
      aria-hidden={!open ? "true" : undefined}
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        aria-describedby={AddLeadDialogId.Description}
        aria-labelledby={AddLeadDialogId.Dialog}
        aria-modal="true"
        className={styles.dialog}
        onKeyDown={handleKeyDown}
        ref={dialogRef}
        role="dialog"
      >
        <header className={styles.header}>
          <div className={styles.heading}>
            <p className={styles.kicker}>{content.sections.identity}</p>
            <h2 className={styles.title} id={AddLeadDialogId.Dialog}>
              {content.title}
            </h2>
            <p className={styles.description} id={AddLeadDialogId.Description}>
              {content.description}
            </p>
          </div>

          <ButtonControl onClick={closeDialog} type="button" variant="ghost">
            {content.buttons.close}
          </ButtonControl>
        </header>

        <FormStatus className={styles.statusBanner} message={statusMessage} />
        {rootErrorMessage ? (
          <p className={styles.statusBanner} role="alert">
            {rootErrorMessage}
          </p>
        ) : null}

        <form className={styles.form} noValidate onSubmit={onSubmit}>
          <section
            className={styles.section}
            aria-labelledby={AddLeadDialogId.ContactSection}
          >
            <div className={styles.sectionHeader}>
              <h3
                className={styles.sectionTitle}
                id={AddLeadDialogId.ContactSection}
              >
                {content.sections.identity}
              </h3>
            </div>

            <div className={styles.grid}>
              <FormField
                className={styles.field}
                controlClassName={styles.input}
                inputProps={{
                  ...register(AddLeadDialogField.FirstName, {
                    onChange: () => {
                      clearErrors(AddLeadDialogField.FirstName);
                      resetValidationMessages();
                    },
                  }),
                  autoComplete: "given-name",
                  placeholder: content.placeholders.firstName,
                }}
                kind="text"
                label={content.fields.firstName}
              />

              <FormField
                className={styles.field}
                controlClassName={styles.input}
                errorMessage={errors.last_name?.message}
                inputProps={{
                  ...register(AddLeadDialogField.LastName, {
                    onChange: () => {
                      clearLeadNameValidationMessages();
                    },
                    onBlur: validateLeadNameFields,
                  }),
                  autoComplete: "family-name",
                  placeholder: content.placeholders.lastName,
                }}
                kind="text"
                label={content.fields.lastName}
              />

              <FormField
                className={styles.field}
                controlClassName={styles.input}
                errorMessage={errors.company_name?.message}
                inputProps={{
                  ...register(AddLeadDialogField.CompanyName, {
                    onChange: () => {
                      clearLeadNameValidationMessages();
                    },
                    onBlur: validateLeadNameFields,
                  }),
                  autoComplete: "organization",
                  placeholder: content.placeholders.companyName,
                }}
                kind="text"
                label={content.fields.companyName}
              />

              <FormField
                className={styles.field}
                controlClassName={styles.input}
                errorMessage={errors.email?.message}
                inputProps={{
                  ...register(AddLeadDialogField.Email, {
                    onChange: () => {
                      clearErrors(AddLeadDialogField.Email);
                      resetValidationMessages();
                    },
                    onBlur: validateEmailField,
                  }),
                  autoComplete: "email",
                  placeholder: content.placeholders.email,
                }}
                kind="email"
                label={content.fields.email}
                required
              />
            </div>
          </section>

          <section
            className={styles.section}
            aria-labelledby={AddLeadDialogId.DetailsSection}
          >
            <div className={styles.sectionHeader}>
              <h3
                className={styles.sectionTitle}
                id={AddLeadDialogId.DetailsSection}
              >
                {content.sections.details}
              </h3>
            </div>

            <div className={styles.grid}>
              <FormField
                className={styles.field}
                controlClassName={styles.input}
                errorMessage={errors.phone?.message}
                inputProps={{
                  ...register(AddLeadDialogField.Phone, {
                    onChange: () => {
                      clearErrors(AddLeadDialogField.Phone);
                      resetValidationMessages();
                    },
                    onBlur: validatePhoneField,
                  }),
                  autoComplete: "tel",
                  placeholder: content.placeholders.phone,
                }}
                kind="tel"
                label={content.fields.phone}
              />

              <FormField
                className={styles.field}
                controlClassName={styles.input}
                errorMessage={errors.website_url?.message}
                inputProps={{
                  ...register(AddLeadDialogField.WebsiteUrl, {
                    onChange: () => {
                      clearErrors(AddLeadDialogField.WebsiteUrl);
                      resetValidationMessages();
                    },
                    onBlur: validateWebsiteField,
                  }),
                  autoComplete: "url",
                  placeholder: content.placeholders.websiteUrl,
                }}
                kind="url"
                label={content.fields.websiteUrl}
              />

              <FormField
                className={styles.field}
                controlClassName={styles.input}
                errorMessage={errors.category_id?.message}
                kind="select"
                label={content.fields.category}
                options={[
                  { label: content.placeholders.category, value: "" },
                  ...categories.map((category) => ({
                    label: category.label,
                    value: category.id,
                  })),
                ]}
                selectProps={{
                  ...register(AddLeadDialogField.CategoryId, {
                    onChange: () => {
                      clearErrors(AddLeadDialogField.CategoryId);
                      resetValidationMessages();
                    },
                  }),
                }}
              />

              <FormField
                className={styles.field}
                controlClassName={styles.input}
                errorMessage={errors.score?.message}
                inputProps={{
                  ...register(AddLeadDialogField.Score, {
                    onChange: () => {
                      clearErrors(AddLeadDialogField.Score);
                      resetValidationMessages();
                    },
                    onBlur: validateScoreField,
                  }),
                  inputMode: "numeric",
                  placeholder: content.placeholders.score,
                }}
                kind="number"
                label={content.fields.score}
              />

              <FormField
                className={styles.field}
                controlClassName={styles.input}
                errorMessage={errors.owner?.message}
                inputProps={{
                  ...register(AddLeadDialogField.Owner, {
                    onChange: () => {
                      clearErrors(AddLeadDialogField.Owner);
                      resetValidationMessages();
                    },
                  }),
                  autoComplete: "organization-title",
                  placeholder: content.placeholders.owner,
                }}
                kind="text"
                label={content.fields.owner}
              />
            </div>
          </section>

          <section className={styles.section}>
            <FormField
              className={styles.field}
              controlClassName={styles.textarea}
              errorMessage={errors.notes?.message}
              textareaProps={{
                ...register(AddLeadDialogField.Notes, {
                  onChange: () => {
                    clearErrors(AddLeadDialogField.Notes);
                    resetValidationMessages();
                  },
                }),
                placeholder: content.placeholders.notes,
                rows: 4,
              }}
              kind="textarea"
              label={content.fields.notes}
            />
          </section>

          <ImprovementsSection
            clearErrorsAction={clearErrors}
            content={content}
            control={control}
            onInteractionAction={resetValidationMessages}
          />

          <SocialProfilesSection
            clearErrorsAction={clearErrors}
            content={content}
            control={control}
            onInteractionAction={resetValidationMessages}
            sharedContent={sharedContent}
          />

          <footer className={styles.footer}>
            <FormActions
              buttons={
                <>
                  <ButtonControl
                    onClick={closeDialog}
                    type="button"
                    variant="ghost"
                  >
                    {content.buttons.cancel}
                  </ButtonControl>
                  <PrimaryCtaButton disabled={isSubmitting} type="submit">
                    {isSubmitting
                      ? content.status.saving
                      : content.buttons.submit}
                  </PrimaryCtaButton>
                </>
              }
              requiredHint={content.help.requiredHint}
            />
          </footer>
        </form>
      </div>
    </div>
  );
}
