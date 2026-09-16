import type { CreateCustomerRequestDto } from "@invessiv/common/contracts/crm/create-customer-request.dto";
import type { CustomerDetailDto } from "@invessiv/common/contracts/crm/customer-detail.dto";
import type { CustomerContactWriteDto } from "@invessiv/common/contracts/crm/customer-contact-write.dto";
import type { CustomerWriteFieldsDto } from "@invessiv/common/contracts/crm/customer-write-fields.dto";
import type { UpdateCustomerRequestDto } from "@invessiv/common/contracts/crm/update-customer-request.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { formValidationService } from "@invessiv/common/patterns/validation/form-validation-service";
import { CustomerFormDialogMode } from "@/common/constants/crm/forms/customer-form-dialog-modes";
import { CustomerFormValidationCode } from "@/common/constants/crm/forms/customer-form-validation-codes";
import type {
  CustomerFormErrors,
  CustomerFormValues,
} from "@/common/contracts/crm/customer-form-values";
import {
  formatCentsAsEuroInput,
  parseEuroAmountToCents,
} from "@/common/patterns/crm/euro-cents";

function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function createCustomerFormValues(
  customer: CustomerDetailDto | null,
  locale: Locale,
): CustomerFormValues {
  return {
    displayName: customer?.displayName ?? "",
    companyName: customer?.companyName ?? "",
    categoryId: customer?.categoryId ?? "",
    street: customer?.street ?? "",
    postalCode: customer?.postalCode ?? "",
    city: customer?.city ?? "",
    country: customer?.country ?? "",
    websiteUrl: customer?.websiteUrl ?? "",
    vatId: customer?.vatId ?? "",
    hourlyRate: formatCentsAsEuroInput(
      customer?.defaultHourlyRateCents ?? null,
      locale,
    ),
    notes: customer?.notes ?? "",
    contactFirstName: "",
    contactLastName: "",
    contactEmail: "",
    contactPhone: "",
    contactRoleLabel: "",
    contactPreferredLocale: locale,
  };
}

/** Format and required checks only; uniqueness and ownership are decided by the server. */
export function validateCustomerForm(
  values: CustomerFormValues,
  mode: CustomerFormDialogMode,
  hasContactDrafts = false,
): CustomerFormErrors {
  const errors: CustomerFormErrors = {};

  if (!values.displayName.trim()) {
    errors.displayName = CustomerFormValidationCode.DisplayNameRequired;
  }
  if (
    values.websiteUrl.trim() &&
    !formValidationService.isValidHttpUrl(values.websiteUrl)
  ) {
    errors.websiteUrl = CustomerFormValidationCode.UrlInvalid;
  }
  if (!parseEuroAmountToCents(values.hourlyRate).ok) {
    errors.hourlyRate = CustomerFormValidationCode.HourlyRateInvalid;
  }

  if (mode === CustomerFormDialogMode.Create && !hasContactDrafts) {
    Object.assign(errors, validateCustomerContact(values));
  }

  return errors;
}

export function validateCustomerContact(
  values: CustomerFormValues,
): CustomerFormErrors {
  const errors: CustomerFormErrors = {};
  const email = values.contactEmail.trim();
  const phone = values.contactPhone.trim();
  if (!values.contactLastName.trim() && !email) {
    errors.contactLastName = CustomerFormValidationCode.ContactRequired;
  }
  if (email && !formValidationService.isValidEmail(email)) {
    errors.contactEmail = CustomerFormValidationCode.EmailInvalid;
  }
  if (phone && !formValidationService.isValidPhone(phone)) {
    errors.contactPhone = CustomerFormValidationCode.PhoneInvalid;
  }
  return errors;
}

function toWriteFields(values: CustomerFormValues): CustomerWriteFieldsDto {
  const hourlyRate = parseEuroAmountToCents(values.hourlyRate);

  return {
    displayName: values.displayName.trim(),
    companyName: orNull(values.companyName),
    categoryId: orNull(values.categoryId),
    street: orNull(values.street),
    postalCode: orNull(values.postalCode),
    city: orNull(values.city),
    country: orNull(values.country),
    websiteUrl: orNull(values.websiteUrl),
    vatId: orNull(values.vatId),
    notes: orNull(values.notes),
    defaultHourlyRateCents: hourlyRate.ok ? hourlyRate.cents : null,
  };
}

export function toCreateCustomerRequest(
  values: CustomerFormValues,
  contacts: CustomerContactWriteDto[] = [],
): CreateCustomerRequestDto {
  const drafts =
    contacts.length > 0 ? contacts : [toCustomerContactWrite(values, true)];
  const primary = drafts.find((contact) => contact.isPrimary) ?? drafts[0]!;
  return {
    ...toWriteFields(values),
    primaryContact: primary,
    ...(drafts.length > 1
      ? { additionalContacts: drafts.filter((contact) => contact !== primary) }
      : {}),
  };
}

export function toUpdateCustomerRequest(
  values: CustomerFormValues,
  version: number,
  contacts?: CustomerContactWriteDto[],
): UpdateCustomerRequestDto {
  return {
    ...toWriteFields(values),
    version,
    ...(contacts ? { contacts } : {}),
  };
}

export function toCustomerContactWrite(
  values: CustomerFormValues,
  isPrimary: boolean,
): CustomerContactWriteDto {
  return {
    firstName: orNull(values.contactFirstName),
    lastName: orNull(values.contactLastName),
    email: orNull(values.contactEmail),
    phone: orNull(values.contactPhone),
    roleLabel: orNull(values.contactRoleLabel),
    preferredLocale: values.contactPreferredLocale,
    isPrimary,
  };
}
