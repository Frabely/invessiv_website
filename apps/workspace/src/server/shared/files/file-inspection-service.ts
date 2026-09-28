import "server-only";
import { FileInspectionStatus } from "@invessiv/common/constants/files/file-inspection-status";
import type { FileInspectionAdapter } from "@invessiv/common/contracts/files/file-inspection-adapter";

/** No malware scanner is configured in v1. Never report these files as clean. */
export const fileInspectionService: FileInspectionAdapter = {
  async inspect() {
    return { ok: true, inspectionStatus: FileInspectionStatus.Unscanned };
  },
};
