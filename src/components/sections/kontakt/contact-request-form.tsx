"use client";

import { FormEvent, useState } from "react";
import {
  ContactRequestData,
  ContactRequestErrors,
  validateContactRequest,
} from "@/lib/forms/contact-request";

const initialData: ContactRequestData = {
  name: "",
  email: "",
  message: "",
};

export function ContactRequestForm(props: {
  title: string;
  description: string;
  nameLabel: string;
  emailLabel: string;
  messageLabel: string;
  submitLabel: string;
  successMessage: string;
  errors: {
    requiredName: string;
    requiredEmail: string;
    invalidEmail: string;
    requiredMessage: string;
  };
}) {
  const [data, setData] = useState<ContactRequestData>(initialData);
  const [errors, setErrors] = useState<ContactRequestErrors>({});
  const [status, setStatus] = useState<"idle" | "success">("idle");

  function getErrorMessage(field: keyof ContactRequestData): string | null {
    const code = errors[field];
    if (!code) {
      return null;
    }

    if (field === "name" && code === "required") {
      return props.errors.requiredName;
    }
    if (field === "email" && code === "required") {
      return props.errors.requiredEmail;
    }
    if (field === "email" && code === "invalid_email") {
      return props.errors.invalidEmail;
    }
    if (field === "message" && code === "required") {
      return props.errors.requiredMessage;
    }

    return null;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateContactRequest(data);

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus("idle");
      return;
    }

    setStatus("success");
    setData(initialData);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
    >
      <h2 className="text-xl font-black text-[var(--color-foreground)]">
        {props.title}
      </h2>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
        {props.description}
      </p>

      <div className="mt-5 space-y-4">
        <label
          className="block text-sm font-semibold text-[var(--color-foreground)]"
          htmlFor="name"
        >
          {props.nameLabel}
          <input
            id="name"
            name="name"
            value={data.name}
            onChange={(event) =>
              setData((prev) => ({ ...prev, name: event.target.value }))
            }
            className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none ring-[var(--color-primary)] transition focus:ring-2"
          />
          {getErrorMessage("name") ? (
            <span className="mt-1 block text-xs text-rose-600">
              {getErrorMessage("name")}
            </span>
          ) : null}
        </label>

        <label
          className="block text-sm font-semibold text-[var(--color-foreground)]"
          htmlFor="email"
        >
          {props.emailLabel}
          <input
            id="email"
            name="email"
            value={data.email}
            onChange={(event) =>
              setData((prev) => ({ ...prev, email: event.target.value }))
            }
            className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none ring-[var(--color-primary)] transition focus:ring-2"
          />
          {getErrorMessage("email") ? (
            <span className="mt-1 block text-xs text-rose-600">
              {getErrorMessage("email")}
            </span>
          ) : null}
        </label>

        <label
          className="block text-sm font-semibold text-[var(--color-foreground)]"
          htmlFor="message"
        >
          {props.messageLabel}
          <textarea
            id="message"
            name="message"
            rows={4}
            value={data.message}
            onChange={(event) =>
              setData((prev) => ({ ...prev, message: event.target.value }))
            }
            className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none ring-[var(--color-primary)] transition focus:ring-2"
          />
          {getErrorMessage("message") ? (
            <span className="mt-1 block text-xs text-rose-600">
              {getErrorMessage("message")}
            </span>
          ) : null}
        </label>
      </div>

      <button
        type="submit"
        className="mt-5 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-background)] transition hover:opacity-90"
      >
        {props.submitLabel}
      </button>

      {status === "success" ? (
        <p className="mt-3 text-sm font-semibold text-emerald-700">
          {props.successMessage}
        </p>
      ) : null}
    </form>
  );
}
