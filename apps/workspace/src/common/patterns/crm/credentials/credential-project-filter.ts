import {
  CUSTOMER_WIDE_CREDENTIALS_FILTER,
  CustomerCredentialsQueryParam,
} from "@/common/constants/crm/credentials/customer-credentials-query-params";

/** Undefined lists everything readable, null only customer-wide entries. */
type ProjectFilter = string | null | undefined;

/** Unknown or no longer readable values fall back to "all" instead of failing the section. */
function read(
  params: URLSearchParams,
  readableProjectIds: readonly string[],
): ProjectFilter {
  const project = params.get(CustomerCredentialsQueryParam.Project);
  if (project === CUSTOMER_WIDE_CREDENTIALS_FILTER) return null;
  return project && readableProjectIds.includes(project) ? project : undefined;
}

/** Writes the filter onto a copy of the current params, keeping everything else of the URL. */
function write(
  params: URLSearchParams,
  filter: ProjectFilter,
): URLSearchParams {
  const next = new URLSearchParams(params);
  if (filter === undefined) next.delete(CustomerCredentialsQueryParam.Project);
  else
    next.set(
      CustomerCredentialsQueryParam.Project,
      filter ?? CUSTOMER_WIDE_CREDENTIALS_FILTER,
    );
  return next;
}

/** The select works with strings; the empty string stands for "all". */
function toOptionValue(filter: ProjectFilter): string {
  return filter === null ? CUSTOMER_WIDE_CREDENTIALS_FILTER : (filter ?? "");
}

function fromOptionValue(value: string): ProjectFilter {
  if (value === "") return undefined;
  return value === CUSTOMER_WIDE_CREDENTIALS_FILTER ? null : value;
}

export const credentialProjectFilter = {
  read,
  write,
  toOptionValue,
  fromOptionValue,
};
