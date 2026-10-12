"use client";

import type { PortalServiceRequestErrorsDictionary } from "@/common/contracts/portal/portal-service-request-errors-dictionary";
import type { PortalServiceRequestFormDictionary } from "@/common/contracts/portal/portal-service-request-form-dictionary";
import {
  type ReactNode,
  type SubmitEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ServiceRequestFieldLimits } from "@invessiv/common/constants/crm/forms/service-request-field-limits";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { ServiceRequestProjectWish as Wish } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { PortalServiceRequestLimits } from "@invessiv/common/constants/portal/portal-service-request-limits";
import { MINUTES_PER_HOUR } from "@invessiv/common/constants/time/time-units";
import { ButtonSize } from "@invessiv/common/constants/ui/button-sizes";
import { OptionTileKind } from "@invessiv/common/constants/ui/option-tile-kinds";
import type { PortalRequestableServiceDto } from "@invessiv/common/contracts/portal/portal-requestable-service.dto";
import type { PortalServiceProjectOptionDto } from "@invessiv/common/contracts/portal/portal-service-project-option.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import {
  ButtonControl,
  FormField,
  FormFieldset,
  FormHint,
  OptionTile,
} from "@invessiv/ui";
import { portalServiceRequestsApiService } from "@/client/portal/portal-service-requests-api-service";
import {
  PORTAL_SERVICE_REQUEST_QUICK_HOURS,
  PortalServiceRequestFormField as Field,
} from "@/common/constants/portal/portal-service-request-form-fields";
import type { PortalServiceRequestFormValues } from "@/common/contracts/portal/portal-service-request-form-values";
import { portalServiceRequestForm } from "@/common/patterns/portal/portal-service-request-form";
import { FormNotice } from "@invessiv/ui";
import { useFocusFirstInvalidField } from "@/hooks/shared/use-focus-first-invalid-field";
import styles from "./portal-service-request-form.module.css";

export type PortalServiceRequestFormProps = {
  /** Held by the dialog so a pending send also locks tabs and closing. */
  busy: boolean;
  /** False for the owner view and for a reader without the request right: the form then only shows. */
  canRequest: boolean;
  content: PortalServiceRequestFormDictionary;
  /** Wording for every rejection the server can answer. */
  errorTexts: PortalServiceRequestErrorsDictionary;
  customerId: string;
  headingId: string;
  /** Back to the selection. */
  onBackAction: () => void;
  onBusyChangeAction: (busy: boolean) => void;
  /** Called with the request's title once the server has accepted it. */
  onSentAction: (title: string) => void;
  /** The project the dashboard shows; preselected when the service can be requested for it. */
  preferredProjectId: string | null;
  /** Every project a free-text request may name. */
  projects: readonly PortalServiceProjectOptionDto[];
  /** Why sending is off, shown next to the disabled button; null when the reader may send. */
  readOnlyNotice: ReactNode;
  /** The chosen catalog entry; null for a free-text request. */
  service: PortalRequestableServiceDto | null;
  /** Heading of the form: the catalog title or the free-text label. */
  title: string;
};

const HOURS_MIN =
  PortalServiceRequestLimits.MinRequestedMinutes / MINUTES_PER_HOUR;
const HOURS_MAX =
  PortalServiceRequestLimits.MaxRequestedMinutes / MINUTES_PER_HOUR;

/**
 * One request. What it asks follows from the service: a project where the answer is open, an
 * amount for hours, a title and a description for free text. It never shows or sends a price.
 * Mount it with a `key` per selection, so every form gets its own idempotency key.
 */
export function PortalServiceRequestForm({
  busy,
  canRequest,
  content,
  customerId,
  errorTexts,
  headingId,
  onBackAction,
  onBusyChangeAction,
  onSentAction,
  preferredProjectId,
  projects,
  readOnlyNotice,
  service,
  title,
}: PortalServiceRequestFormProps) {
  const question = useMemo(
    () => portalServiceRequestForm.projectQuestion(service, projects),
    [service, projects],
  );
  // Created once per form: a repeated send answers with the request it already created.
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [values, setValues] = useState<PortalServiceRequestFormValues>(() =>
    portalServiceRequestForm.initialValues(question, preferredProjectId),
  );
  const [showErrors, setShowErrors] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { formRef, focusFirstInvalidField } = useFocusFirstInvalidField();
  const inFlight = useRef(false);
  const quickLabelId = useId();

  useEffect(
    () => () => {
      // Browser navigation can unmount the form even though the dialog's own controls are locked.
      if (inFlight.current) {
        inFlight.current = false;
        onBusyChangeAction(false);
      }
    },
    [onBusyChangeAction],
  );

  const isHours = service?.kind === LineItemKind.Hours;
  const invalid = showErrors
    ? portalServiceRequestForm.invalidFields(values, service, question)
    : [];
  const errorFor = (field: Field, message: string) =>
    invalid.includes(field) ? message : undefined;
  const change = (patch: Partial<PortalServiceRequestFormValues>) =>
    setValues((current) => ({ ...current, ...patch }));

  const fixedProject =
    !question.asks && values.projectWish === Wish.Existing
      ? question.projects.find((project) => project.id === values.projectId)
      : undefined;
  const wishLabels: Record<Exclude<Wish, typeof Wish.Existing>, string> = {
    [Wish.New]: content.project.new,
    [Wish.Undecided]: isHours
      ? content.project.noProject
      : content.project.undecided,
  };

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || busy || !canRequest) return;
    const blocking = portalServiceRequestForm.invalidFields(
      values,
      service,
      question,
    );
    setShowErrors(true);
    if (blocking.length > 0) {
      focusFirstInvalidField();
      return;
    }
    inFlight.current = true;
    onBusyChangeAction(true);
    setSubmitError(null);
    const result = await portalServiceRequestsApiService.createRequest(
      customerId,
      portalServiceRequestForm.toRequest(values, service, idempotencyKey),
    );
    if (!inFlight.current) return;
    inFlight.current = false;
    onBusyChangeAction(false);
    if (!result.ok) {
      setSubmitError(errorTexts[result.code]);
      return;
    }
    onSentAction(service?.title ?? values.title.trim());
  }

  return (
    <section aria-labelledby={headingId} className={styles.request}>
      <div className={styles.back}>
        <ButtonControl
          disabled={busy}
          onClick={onBackAction}
          type="button"
          variant="quiet"
        >
          <FontAwesomeIcon aria-hidden="true" icon={faArrowLeft} />
          {content.back}
        </ButtonControl>
      </div>
      <header className={styles.header}>
        <h3 className={styles.heading} id={headingId}>
          {title}
        </h3>
        {service ? (
          <p className={styles.description}>{service.description}</p>
        ) : null}
      </header>
      <form
        className={styles.form}
        noValidate
        onSubmit={handleSubmit}
        ref={formRef}
      >
        {service === null ? (
          <FormField
            errorMessage={errorFor(Field.Title, content.title.required)}
            inputProps={{
              maxLength: ServiceRequestFieldLimits.TitleMaxLength,
              onChange: (event) => change({ title: event.target.value }),
              placeholder: content.title.placeholder,
              value: values.title,
            }}
            kind={FormFieldKind.Text}
            label={content.title.label}
            required
          />
        ) : null}

        {question.asks ? (
          <FormFieldset
            data-invalid={invalid.includes(Field.Project) ? "true" : undefined}
            errorMessage={errorFor(Field.Project, content.project.required)}
            label={content.project.label}
            required
          >
            <div className={styles.options}>
              {question.wishes.includes(Wish.Existing)
                ? question.projects.map((project) => (
                    <OptionTile
                      checked={
                        values.projectWish === Wish.Existing &&
                        values.projectId === project.id
                      }
                      key={project.id}
                      kind={OptionTileKind.Radio}
                      name={`${headingId}-project`}
                      onChange={() =>
                        change({
                          projectWish: Wish.Existing,
                          projectId: project.id,
                        })
                      }
                    >
                      {project.title}
                    </OptionTile>
                  ))
                : null}
              {([Wish.New, Wish.Undecided] as const)
                .filter((wish) => question.wishes.includes(wish))
                .map((wish) => (
                  <OptionTile
                    checked={values.projectWish === wish}
                    key={wish}
                    kind={OptionTileKind.Radio}
                    name={`${headingId}-project`}
                    onChange={() =>
                      change({ projectWish: wish, projectId: null })
                    }
                  >
                    {wishLabels[wish]}
                  </OptionTile>
                ))}
            </div>
          </FormFieldset>
        ) : null}
        {fixedProject ? (
          <p className={styles.fact}>
            {formatMessage(content.project.fixed, {
              project: fixedProject.title,
            })}
          </p>
        ) : null}
        {!question.asks && values.projectWish === Wish.New && service ? (
          <p className={styles.fact}>{content.project.newProject}</p>
        ) : null}

        {isHours ? (
          <div className={styles.hours}>
            <FormField
              errorMessage={errorFor(
                Field.Hours,
                values.hours.trim() === ""
                  ? content.hours.required
                  : formatMessage(content.hours.range, {
                      min: HOURS_MIN,
                      max: HOURS_MAX,
                    }),
              )}
              hint={content.hours.hint}
              inputProps={{
                inputMode: "numeric",
                max: HOURS_MAX,
                min: HOURS_MIN,
                onChange: (event) => change({ hours: event.target.value }),
                step: 1,
                value: values.hours,
              }}
              inputSuffix={content.hours.unit}
              kind={FormFieldKind.Number}
              label={content.hours.label}
              required
            />
            <div
              aria-labelledby={quickLabelId}
              className={styles.quick}
              role="group"
            >
              <span className={styles.quickLabel} id={quickLabelId}>
                {content.hours.quickLabel}
              </span>
              {PORTAL_SERVICE_REQUEST_QUICK_HOURS.map((hours) => (
                <ButtonControl
                  key={hours}
                  onClick={() => change({ hours: String(hours) })}
                  size={ButtonSize.Control}
                  type="button"
                  variant="ghost"
                >
                  {formatMessage(content.hours.quick, { hours })}
                </ButtonControl>
              ))}
            </div>
          </div>
        ) : null}

        <FormField
          autoGrow={service !== null}
          errorMessage={errorFor(Field.Note, content.description.required)}
          hint={service ? content.note.hint : content.description.hint}
          kind={FormFieldKind.Textarea}
          label={service ? content.note.label : content.description.label}
          required={service === null}
          textareaProps={{
            maxLength: ServiceRequestFieldLimits.NoteMaxLength,
            onChange: (event) => change({ note: event.target.value }),
            rows: service ? 2 : 4,
            value: values.note,
          }}
        />

        {submitError ? (
          <FormNotice role="alert">{submitError}</FormNotice>
        ) : null}
        {readOnlyNotice}
        <div className={styles.footer}>
          <FormHint>{content.nonBinding}</FormHint>
          <ButtonControl
            aria-busy={busy}
            disabled={busy || !canRequest}
            type="submit"
            variant="primary"
          >
            {busy ? content.submitting : content.submit}
          </ButtonControl>
        </div>
      </form>
    </section>
  );
}
