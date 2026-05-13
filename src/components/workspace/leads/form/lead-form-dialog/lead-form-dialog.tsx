"use client";

import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useNavigationContext } from "@/hooks/workspace/use-navigation-context";
import { useForm, useWatch } from "react-hook-form";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CONTACT_LEAD_STATUS_VALUES,
  ContactLeadStatus,
} from "@/common/constants/contact/contact-lead-statuses";
import { LeadErrorCode } from "@/common/constants/leads/errors/lead-error-codes";
import {
  LeadFormDialogMode,
  type LeadFormDialogMode as LeadFormDialogModeValue,
} from "@/common/constants/leads/forms/lead-form-dialog-modes";
import { LeadListQueryParam } from "@/common/constants/leads/list/lead-list-query-params";
import { LeadValidationMessageCode } from "@/common/constants/leads/forms/lead-form-validation";
import { CONTACT_EMAIL_PATTERN } from "@/common/patterns/contact/contact-email";
import { isValidContactPhone } from "@/common/patterns/contact/contact-phone";
import {
  ButtonControl,
  PrimaryCtaButton,
} from "@/components/shared/button/button";
import { FormActions } from "@/components/shared/form/form-actions/form-actions";
import { FormField } from "@/components/shared/form/form-field/form-field";
import { FormStatus } from "@/components/shared/form/form-status/form-status";
import { leadMapperService } from "@/client/leads/mappers/lead-mapper-service";
import { ImprovementsSection } from "./improvements-section/improvements-section";
import { SocialProfilesSection } from "./social-profiles-section/social-profiles-section";
import { trapDialogFocus } from "../../shared/dialog-focus-trap";
import type { LeadCategoryOption } from "@/common/contracts/leads/lead-category-option";
import type { LeadDetailDto } from "@/common/contracts/leads/lead-detail.dto";
import type {
  LeadsFormDictionary,
  LeadsSharedDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import type { z } from "zod";
import type { LeadFormValues } from "@/common/contracts/leads/forms/lead-form-values";
import { leadFormSchema } from "./lead-form-dialog.schema";
import { leadsService } from "./leads-service";
import styles from "./lead-form-dialog.module.css";

type LeadFormDialogProps = {
  categories: ReadonlyArray<LeadCategoryOption>;
  content: LeadsFormDictionary;
  editLeadId?: string;
  initialLead?: LeadDetailDto;
  mode: LeadFormDialogModeValue;
  open: boolean;
  sharedContent: LeadsSharedDictionary;
};

type LeadFormDialogModeContent = {
  dialogDescription: string;
  dialogTitle: string;
  savingLabel: string;
  submitLabel: string;
};

type LeadMutationResult =
  | { ok: true; lead: LeadDetailDto }
  | {
      code:
        | typeof LeadErrorCode.EmailExists
        | typeof LeadErrorCode.CompanyNameExists
        | typeof LeadErrorCode.Internal
        | typeof LeadErrorCode.NotFound
        | typeof LeadErrorCode.ValidationError;
      errors?: z.core.$ZodIssue[];
      ok: false;
    };

const DEFAULT_VALUES: LeadFormValues = {
  displayName: "",
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
  lead_status: ContactLeadStatus.New,
  improvements: [],
  social_profiles: [],
};

const LeadFormDialogField = {
  CategoryId: "category_id",
  CompanyName: "company_name",
  DisplayName: "displayName",
  Email: "email",
  FirstName: "first_name",
  LastName: "last_name",
  LeadStatus: "lead_status",
  Notes: "notes",
  Owner: "owner",
  Phone: "phone",
  Score: "score",
  WebsiteUrl: "website_url",
} as const;

const LeadFormDialogId = {
  ContactSection: "lead-form-contact",
  DetailsSection: "lead-form-details",
  Description: "lead-form-dialog-description",
  Dialog: "lead-form-dialog-title",
} as const;

function getLeadFormDialogModeContent(
  mode: LeadFormDialogModeValue,
  content: LeadsFormDictionary,
): LeadFormDialogModeContent {
  if (mode === LeadFormDialogMode.Edit) {
    return {
      dialogDescription: content.description.edit,
      dialogTitle: content.title.edit,
      savingLabel: content.status.savingEdit,
      submitLabel: content.buttons.submit.edit,
    };
  }

  return {
    dialogDescription: content.description.create,
    dialogTitle: content.title.create,
    savingLabel: content.status.savingCreate,
    submitLabel: content.buttons.submit.create,
  };
}

type LeadMutationFailureResult =
  | { code: typeof LeadErrorCode.EmailExists; ok: false }
  | { code: typeof LeadErrorCode.CompanyNameExists; ok: false }
  | { code: typeof LeadErrorCode.Internal; ok: false }
  | {
      code:
        | typeof LeadErrorCode.ValidationError
        | typeof LeadErrorCode.NotFound;
      errors?: z.core.$ZodIssue[];
      ok: false;
    };

function handleLeadMutationFailure(
  result: LeadMutationFailureResult,
  onEmailExists: () => void,
  onValidationError: (errors: z.core.$ZodIssue[]) => void,
  onNotFound?: () => void,
): boolean {
  if (result.code === LeadErrorCode.EmailExists) {
    onEmailExists();
    return true;
  }

  if (result.code === LeadErrorCode.CompanyNameExists) {
    onValidationError([]);
    return true;
  }

  if (result.code === LeadErrorCode.ValidationError) {
    if (!result.errors) {
      return false;
    }

    onValidationError(result.errors);
    return true;
  }

  if (result.code === LeadErrorCode.NotFound && onNotFound) {
    onNotFound();
    return true;
  }

  return false;
}

async function submitLeadMutation(
  mode: LeadFormDialogModeValue,
  editLeadId: string | undefined,
  values: LeadFormValues,
): Promise<LeadMutationResult | null> {
  if (mode === LeadFormDialogMode.Edit) {
    if (!editLeadId) {
      return null;
    }

    return leadsService.updateLead(
      editLeadId,
      leadMapperService.mapLeadFormValuesToUpdateLeadRequestDto(values),
    );
  }

  return leadsService.createLead(
    leadMapperService.mapAddLeadFormValuesToCreateLeadRequestDto(values),
  );
}

function getValidationMessage(
  code: string | undefined,
  content: LeadsFormDictionary,
): string {
  switch (code) {
    case LeadValidationMessageCode.DisplayNameRequired:
      return content.validation.displayNameRequired;
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
    default:
      return content.validation.generic;
  }
}

export function LeadFormDialog({
  categories,
  content,
  editLeadId,
  initialLead,
  mode,
  open,
  sharedContent,
}: LeadFormDialogProps) {
  const router = useRouter();
  const startTransition = useNavigationContext();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const isEditMode = mode === LeadFormDialogMode.Edit;
  const { dialogDescription, dialogTitle, savingLabel, submitLabel } =
    getLeadFormDialogModeContent(mode, content);

  const initialValues = useMemo<LeadFormValues>(
    () =>
      isEditMode && initialLead
        ? leadMapperService.mapLeadDetailDtoToLeadFormValues(initialLead)
        : DEFAULT_VALUES,
    [initialLead, isEditMode],
  );
  const initialImprovementsCount = initialValues.improvements.length;
  const initialSocialProfilesCount = initialValues.social_profiles.length;

  const {
    clearErrors,
    control,
    getValues,
    handleSubmit,
    register,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    defaultValues: initialValues,
    mode: "onSubmit",
  });
  const currentValues = useWatch({
    control,
    defaultValue: initialValues,
  });

  const validateEmailField = useCallback(() => {
    const emailValue = getValues(LeadFormDialogField.Email).trim();

    if (errors.email?.message === content.validation.emailExists) {
      return;
    }

    setStatusMessage(null);

    if (!emailValue) {
      clearErrors(LeadFormDialogField.Email);
      return;
    }

    if (!CONTACT_EMAIL_PATTERN.test(emailValue)) {
      setError(LeadFormDialogField.Email, {
        message: content.validation.emailInvalid,
        type: "manual",
      });
      return;
    }

    clearErrors(LeadFormDialogField.Email);
  }, [
    clearErrors,
    content.validation.emailInvalid,
    content.validation.emailExists,
    errors.email?.message,
    getValues,
    setError,
  ]);

  const validateDisplayNameField = useCallback(() => {
    const displayNameValue = getValues(LeadFormDialogField.DisplayName).trim();
    setStatusMessage(null);

    if (!displayNameValue) {
      setError(LeadFormDialogField.DisplayName, {
        message: content.validation.displayNameRequired,
        type: "manual",
      });
      return;
    }

    clearErrors(LeadFormDialogField.DisplayName);
  }, [
    clearErrors,
    content.validation.displayNameRequired,
    getValues,
    setError,
  ]);

  const validatePhoneField = useCallback(() => {
    const phoneValue = getValues(LeadFormDialogField.Phone).trim();
    setStatusMessage(null);

    if (!phoneValue) {
      clearErrors(LeadFormDialogField.Phone);
      return;
    }

    if (!isValidContactPhone(phoneValue)) {
      setError(LeadFormDialogField.Phone, {
        message: content.validation.phoneInvalid,
        type: "manual",
      });
      return;
    }

    clearErrors(LeadFormDialogField.Phone);
  }, [clearErrors, content.validation.phoneInvalid, getValues, setError]);

  const validateWebsiteField = useCallback(() => {
    const websiteValue = getValues(LeadFormDialogField.WebsiteUrl).trim();
    setStatusMessage(null);

    if (!websiteValue) {
      clearErrors(LeadFormDialogField.WebsiteUrl);
      return;
    }

    try {
      const parsedUrl = new URL(websiteValue);
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        setError(LeadFormDialogField.WebsiteUrl, {
          message: content.validation.urlInvalid,
          type: "manual",
        });
        return;
      }
      clearErrors(LeadFormDialogField.WebsiteUrl);
    } catch {
      setError(LeadFormDialogField.WebsiteUrl, {
        message: content.validation.urlInvalid,
        type: "manual",
      });
    }
  }, [clearErrors, content.validation.urlInvalid, getValues, setError]);

  const validateScoreField = useCallback(() => {
    const scoreValue = getValues(LeadFormDialogField.Score).trim();
    setStatusMessage(null);

    if (!scoreValue) {
      clearErrors(LeadFormDialogField.Score);
      return;
    }

    const parsedScore = Number(scoreValue);
    const isValidScore =
      Number.isInteger(parsedScore) && parsedScore >= 0 && parsedScore <= 100;

    if (!isValidScore) {
      setError(LeadFormDialogField.Score, {
        message: content.validation.scoreInvalid,
        type: "manual",
      });
      return;
    }

    clearErrors(LeadFormDialogField.Score);
  }, [clearErrors, content.validation.scoreInvalid, getValues, setError]);

  function getFieldEditState(
    currentValue: string | undefined,
    initialValue: string,
    options?: { required?: boolean },
  ): ReactNode | null {
    if (!isEditMode) {
      return null;
    }

    const currentTrimmed = (currentValue ?? "").trim();
    const initialTrimmed = initialValue.trim();

    let stateText = content.help.fieldStateUnchanged;
    let tone = styles.fieldStateMuted;

    if (currentTrimmed.length === 0 && initialTrimmed.length === 0) {
      stateText = content.help.fieldStatePristineEmpty;
    } else if (currentTrimmed.length === 0 && initialTrimmed.length > 0) {
      if (options?.required) {
        stateText = content.help.fieldStateRequired;
        tone = styles.fieldStateWarning;
      } else {
        stateText = content.help.fieldStateCleared;
        tone = styles.fieldStateWarning;
      }
    } else if (currentTrimmed !== initialTrimmed) {
      stateText = content.help.fieldStateSet;
      tone = styles.fieldStateAccent;
    }

    return <span className={`${styles.fieldState} ${tone}`}>{stateText}</span>;
  }

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
      reset(initialValues);
      clearErrors();
      window.requestAnimationFrame(() => {
        focusFirstAvailableField();
      });
      return;
    }

    reset(initialValues);
    clearErrors();
  }, [clearErrors, initialValues, open, reset]);

  if (!open) {
    return null;
  }

  function buildHref(withSelectedLeadId?: string): string {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(LeadListQueryParam.Mode);
    params.delete(LeadListQueryParam.TargetLeadId);

    if (withSelectedLeadId) {
      params.set(LeadListQueryParam.Selected, withSelectedLeadId);
    }

    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  }

  function closeDialog() {
    reset(initialValues);
    clearErrors();
    setStatusMessage(null);
    startTransition(() => router.replace(buildHref(), { scroll: false }));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    trapDialogFocus(event, event.currentTarget, closeDialog);
  }

  function resetValidationMessages() {
    setStatusMessage(null);
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
    const validation = leadFormSchema.safeParse(values);
    if (!validation.success) {
      applyValidationIssues(validation.error.issues);
      setStatusMessage(null);
      return;
    }

    setStatusMessage(savingLabel);

    try {
      const result = await submitLeadMutation(
        mode,
        editLeadId,
        validation.data,
      );

      if (!result) {
        setStatusMessage(content.validation.generic);
        return;
      }

      if (!result.ok) {
        const handled = handleLeadMutationFailure(
          result,
          () => {
            setError(LeadFormDialogField.Email, {
              message: content.validation.emailExists,
              type: "manual",
            });
            setStatusMessage(null);
          },
          (errors) => {
            if (result.code === LeadErrorCode.CompanyNameExists) {
              setError(LeadFormDialogField.CompanyName, {
                message: content.validation.companyNameExists,
                type: "manual",
              });
            } else {
              applyValidationIssues(errors);
            }
            setStatusMessage(null);
          },
          isEditMode
            ? () => {
                setStatusMessage(content.validation.generic);
              }
            : undefined,
        );

        if (handled) {
          return;
        }

        setStatusMessage(content.validation.generic);
        return;
      }

      if (isEditMode) {
        setStatusMessage(content.status.successEdit);
        startTransition(() =>
          router.replace(buildHref(result.lead.id), { scroll: false }),
        );
        router.refresh();
        return;
      }

      reset(DEFAULT_VALUES);
      startTransition(() =>
        router.replace(buildHref(result.lead.id), { scroll: false }),
      );
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
      role="presentation"
    >
      <div
        aria-describedby={LeadFormDialogId.Description}
        aria-labelledby={LeadFormDialogId.Dialog}
        aria-modal="true"
        className={styles.dialog}
        onKeyDown={handleKeyDown}
        ref={dialogRef}
        role="dialog"
      >
        <header className={styles.header}>
          <div className={styles.heading}>
            <p className={styles.kicker}>{content.sections.identity}</p>
            <h2 className={styles.title} id={LeadFormDialogId.Dialog}>
              {dialogTitle}
            </h2>
            <p className={styles.description} id={LeadFormDialogId.Description}>
              {dialogDescription}
            </p>
          </div>

          <ButtonControl
            aria-label={content.buttons.closeAriaLabel}
            className={styles.closeButton}
            onClick={closeDialog}
            title={content.buttons.closeAriaLabel}
            type="button"
            variant="ghost"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
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
            aria-labelledby={LeadFormDialogId.ContactSection}
          >
            <div className={styles.sectionHeader}>
              <h3
                className={styles.sectionTitle}
                id={LeadFormDialogId.ContactSection}
              >
                {content.sections.identity}
              </h3>
            </div>

            <div className={styles.grid}>
              <FormField
                className={styles.field}
                controlClassName={styles.input}
                errorMessage={errors.displayName?.message}
                hint={getFieldEditState(
                  currentValues.displayName,
                  initialValues.displayName,
                  {
                    required: true,
                  },
                )}
                inputProps={{
                  ...register(LeadFormDialogField.DisplayName, {
                    onChange: () => {
                      clearErrors(LeadFormDialogField.DisplayName);
                      resetValidationMessages();
                    },
                    onBlur: validateDisplayNameField,
                  }),
                  autoComplete: "organization",
                  placeholder: content.placeholders.displayName,
                }}
                kind="text"
                label={content.fields.displayName}
                required
              />

              <FormField
                className={styles.field}
                controlClassName={styles.input}
                errorMessage={errors.first_name?.message}
                hint={getFieldEditState(
                  currentValues.first_name,
                  initialValues.first_name,
                )}
                inputProps={{
                  ...register(LeadFormDialogField.FirstName, {
                    onChange: () => {
                      clearErrors(LeadFormDialogField.FirstName);
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
                hint={getFieldEditState(
                  currentValues.last_name,
                  initialValues.last_name,
                )}
                inputProps={{
                  ...register(LeadFormDialogField.LastName, {
                    onChange: () => {
                      clearErrors(LeadFormDialogField.LastName);
                      resetValidationMessages();
                    },
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
                hint={getFieldEditState(
                  currentValues.company_name,
                  initialValues.company_name,
                )}
                inputProps={{
                  ...register(LeadFormDialogField.CompanyName, {
                    onChange: () => {
                      clearErrors(LeadFormDialogField.CompanyName);
                      resetValidationMessages();
                    },
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
                hint={getFieldEditState(
                  currentValues.email,
                  initialValues.email,
                )}
                inputProps={{
                  ...register(LeadFormDialogField.Email, {
                    onChange: () => {
                      clearErrors(LeadFormDialogField.Email);
                      resetValidationMessages();
                    },
                    onBlur: validateEmailField,
                  }),
                  autoComplete: "email",
                  placeholder: content.placeholders.email,
                }}
                kind="email"
                label={content.fields.email}
              />
            </div>
          </section>

          <section
            className={styles.section}
            aria-labelledby={LeadFormDialogId.DetailsSection}
          >
            <div className={styles.sectionHeader}>
              <h3
                className={styles.sectionTitle}
                id={LeadFormDialogId.DetailsSection}
              >
                {content.sections.details}
              </h3>
            </div>

            <div className={styles.grid}>
              <FormField
                className={styles.field}
                controlClassName={styles.input}
                errorMessage={errors.phone?.message}
                hint={getFieldEditState(
                  currentValues.phone,
                  initialValues.phone,
                )}
                inputProps={{
                  ...register(LeadFormDialogField.Phone, {
                    onChange: () => {
                      clearErrors(LeadFormDialogField.Phone);
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
                hint={getFieldEditState(
                  currentValues.website_url,
                  initialValues.website_url,
                )}
                inputProps={{
                  ...register(LeadFormDialogField.WebsiteUrl, {
                    onChange: () => {
                      clearErrors(LeadFormDialogField.WebsiteUrl);
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
                hint={getFieldEditState(
                  currentValues.category_id,
                  initialValues.category_id,
                )}
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
                  ...register(LeadFormDialogField.CategoryId, {
                    onChange: () => {
                      clearErrors(LeadFormDialogField.CategoryId);
                      resetValidationMessages();
                    },
                  }),
                }}
              />

              <FormField
                className={styles.field}
                controlClassName={styles.input}
                errorMessage={errors.score?.message}
                hint={getFieldEditState(
                  currentValues.score,
                  initialValues.score,
                )}
                inputProps={{
                  ...register(LeadFormDialogField.Score, {
                    onChange: () => {
                      clearErrors(LeadFormDialogField.Score);
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
                hint={getFieldEditState(
                  currentValues.owner,
                  initialValues.owner,
                )}
                inputProps={{
                  ...register(LeadFormDialogField.Owner, {
                    onChange: () => {
                      clearErrors(LeadFormDialogField.Owner);
                      resetValidationMessages();
                    },
                  }),
                  autoComplete: "organization-title",
                  placeholder: content.placeholders.owner,
                }}
                kind="text"
                label={content.fields.owner}
              />

              <FormField
                className={styles.field}
                controlClassName={styles.input}
                errorMessage={errors.lead_status?.message}
                kind="select"
                label={content.fields.status}
                options={CONTACT_LEAD_STATUS_VALUES.map((status) => ({
                  label: sharedContent.status[status],
                  value: status,
                }))}
                selectProps={{
                  ...register(LeadFormDialogField.LeadStatus, {
                    onChange: () => {
                      clearErrors(LeadFormDialogField.LeadStatus);
                      resetValidationMessages();
                    },
                  }),
                }}
              />
            </div>
          </section>

          <section className={styles.section}>
            <FormField
              className={styles.field}
              controlClassName={styles.textarea}
              errorMessage={errors.notes?.message}
              hint={getFieldEditState(currentValues.notes, initialValues.notes)}
              textareaProps={{
                ...register(LeadFormDialogField.Notes, {
                  onChange: () => {
                    clearErrors(LeadFormDialogField.Notes);
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
            initialItemCount={initialImprovementsCount}
            isEditMode={isEditMode}
            onInteractionAction={resetValidationMessages}
          />

          <SocialProfilesSection
            clearErrorsAction={clearErrors}
            content={content}
            control={control}
            initialItemCount={initialSocialProfilesCount}
            isEditMode={isEditMode}
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
                    {isSubmitting ? savingLabel : submitLabel}
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
