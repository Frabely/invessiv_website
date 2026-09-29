"use client";

import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import { filesApiService } from "@/client/crm/files-api-service";
import type { CustomerFilesFilter } from "@/common/contracts/crm/files/customer-files-filter";
import { customerFilesFilter } from "@/common/patterns/crm/files/customer-files-filter";
import { usePagedFiles } from "@/hooks/shared/use-paged-files";

/**
 * Loads the files of one customer through the API. `revision` reloads from the first page
 * whenever another section of the cockpit changed files.
 */
export function useCustomerFiles(
  customerId: string,
  filter: CustomerFilesFilter,
  revision: number,
) {
  const query = customerFilesFilter.toListQuery(filter, 1);
  return usePagedFiles<FileDto>(
    JSON.stringify([customerId, query, revision]),
    (page) => filesApiService.listFiles(customerId, { ...query, page }),
  );
}
