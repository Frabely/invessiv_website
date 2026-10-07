import type { FilesMemberOption } from "./files-member-option";
import type { CrmProjectOption } from "../crm-project-option";
import type { CrmScopeRights } from "../crm-scope-rights";

/**
 * What the cockpit needs to render the files of one customer. The list itself is loaded by the
 * section through the API, so filters and paging never re-render the whole cockpit.
 */
export type FilesViewModel = {
  /** Readable projects of the customer; files of other projects never reach the client. */
  projects: readonly CrmProjectOption[];
  read: CrmScopeRights;
  write: CrmScopeRights;
  remove: CrmScopeRights;
  /** Empty without `members.read`; rows then name the side instead of the person. */
  members: readonly FilesMemberOption[];
};
