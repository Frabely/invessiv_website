import { describe, expect, it } from "vitest";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import { fileEditRequest } from "./file-edit-request";

const file = {
  id: "f1",
  projectId: "p1",
  visibleToCustomer: false,
  note: "Entwurf",
  uploadedBySide: UploadSide.Internal,
  version: 3,
} as FileDto;

describe("fileEditRequest", () => {
  it("writes nothing when nothing changed", () => {
    expect(
      fileEditRequest.toRequest(fileEditRequest.valuesOf(file), file),
    ).toBeNull();
    expect(
      fileEditRequest.toRequest(
        { ...fileEditRequest.valuesOf(file), note: " Entwurf " },
        file,
      ),
    ).toBeNull();
  });

  it("sends only the changed fields with the current version", () => {
    expect(
      fileEditRequest.toRequest(
        { projectId: null, visibleToCustomer: true, note: "" },
        file,
      ),
    ).toEqual({
      version: 3,
      projectId: null,
      visibleToCustomer: true,
      note: null,
    });
  });

  it("never sends visibility for customer uploads", () => {
    expect(
      fileEditRequest.toRequest(
        { projectId: "p1", visibleToCustomer: false, note: "Entwurf" },
        {
          ...file,
          uploadedBySide: UploadSide.Customer,
          visibleToCustomer: true,
        },
      ),
    ).toBeNull();
  });
});
