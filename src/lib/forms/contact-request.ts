export type ContactRequestData = {
  name: string;
  email: string;
  message: string;
};

export type ContactRequestErrorCode = "required" | "invalid_email";

export type ContactRequestErrors = Partial<
  Record<keyof ContactRequestData, ContactRequestErrorCode>
>;

export function validateContactRequest(
  data: ContactRequestData,
): ContactRequestErrors {
  const errors: ContactRequestErrors = {};

  if (!data.name.trim()) {
    errors.name = "required";
  }
  if (!data.email.trim()) {
    errors.email = "required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "invalid_email";
  }
  if (!data.message.trim()) {
    errors.message = "required";
  }

  return errors;
}
