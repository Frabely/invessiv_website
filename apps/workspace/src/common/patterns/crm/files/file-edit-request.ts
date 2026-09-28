import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import type { UpdateFileRequestDto } from "@invessiv/common/contracts/files/update-file-request.dto";
import type { FileEditValues } from "@/common/contracts/crm/files/file-edit-values";

function valuesOf(file: FileDto): FileEditValues {
  return {
    projectId: file.projectId,
    visibleToCustomer: file.visibleToCustomer,
    note: file.note ?? "",
  };
}

/**
 * Sends only what changed against the latest known state, so every field change becomes its own
 * activity and an unchanged form writes nothing. Customer uploads never carry visibility.
 */
function toRequest(
  values: FileEditValues,
  current: FileDto,
): UpdateFileRequestDto | null {
  const note = values.note.trim() || null;
  const request: UpdateFileRequestDto = { version: current.version };
  if (values.projectId !== current.projectId)
    request.projectId = values.projectId;
  if (
    current.uploadedBySide === UploadSide.Internal &&
    values.visibleToCustomer !== current.visibleToCustomer
  )
    request.visibleToCustomer = values.visibleToCustomer;
  if (note !== current.note) request.note = note;
  return Object.keys(request).length > 1 ? request : null;
}

export const fileEditRequest = { valuesOf, toRequest };
