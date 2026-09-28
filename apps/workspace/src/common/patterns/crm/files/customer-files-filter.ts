import { ASSET_KIND_VALUES } from "@invessiv/common/constants/files/asset-kind";
import { FILE_ORIGIN_VALUES } from "@invessiv/common/constants/files/file-origin";
import type { FileListQueryDto } from "@invessiv/common/contracts/files/file-list-query.dto";
import { CUSTOMER_FILES_PAGE_SIZE } from "@/common/constants/crm/files/customer-files-list-limits";
import {
  CUSTOMER_WIDE_FILES_FILTER,
  CustomerFilesQueryParam,
} from "@/common/constants/crm/files/customer-files-query-params";
import type { CustomerFilesFilter } from "@/common/contracts/crm/files/customer-files-filter";

/** Unknown or no longer readable values fall back to "all" instead of failing the section. */
function read(
  params: URLSearchParams,
  readableProjectIds: readonly string[],
): CustomerFilesFilter {
  const project = params.get(CustomerFilesQueryParam.Project);
  const kind = params.get(CustomerFilesQueryParam.Kind);
  const origin = params.get(CustomerFilesQueryParam.Origin);
  return {
    projectId: readProject(project, readableProjectIds),
    assetKind: ASSET_KIND_VALUES.find((value) => value === kind),
    origin: FILE_ORIGIN_VALUES.find((value) => value === origin),
    search: "",
  };
}

function readProject(
  project: string | null,
  readableProjectIds: readonly string[],
): string | null | undefined {
  if (project === CUSTOMER_WIDE_FILES_FILTER) return null;
  if (project && readableProjectIds.includes(project)) return project;
  return undefined;
}

/** Writes the filter onto a copy of the current params, keeping everything else of the URL. */
function write(
  params: URLSearchParams,
  filter: CustomerFilesFilter,
): URLSearchParams {
  const next = new URLSearchParams(params);
  const set = (name: CustomerFilesQueryParam, value: string | undefined) => {
    if (value) next.set(name, value);
    else next.delete(name);
  };
  set(
    CustomerFilesQueryParam.Project,
    filter.projectId === null
      ? CUSTOMER_WIDE_FILES_FILTER
      : (filter.projectId ?? undefined),
  );
  set(CustomerFilesQueryParam.Kind, filter.assetKind);
  set(CustomerFilesQueryParam.Origin, filter.origin);
  return next;
}

function toListQuery(
  filter: CustomerFilesFilter,
  page: number,
): FileListQueryDto {
  const search = filter.search.trim();
  return {
    page,
    pageSize: CUSTOMER_FILES_PAGE_SIZE,
    ...(filter.projectId !== undefined ? { projectId: filter.projectId } : {}),
    ...(filter.assetKind ? { assetKind: filter.assetKind } : {}),
    ...(filter.origin ? { origin: filter.origin } : {}),
    ...(search ? { search } : {}),
  };
}

function isFiltered(filter: CustomerFilesFilter): boolean {
  return (
    filter.projectId !== undefined ||
    filter.assetKind !== undefined ||
    filter.origin !== undefined ||
    filter.search.trim() !== ""
  );
}

export const customerFilesFilter = { read, write, toListQuery, isFiltered };
