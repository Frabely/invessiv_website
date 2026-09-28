import { randomUUID } from "node:crypto";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { files } from "@invessiv/db/record-configuration";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";

/** Real link entries avoid fake storage objects and never call an external provider. */
export async function seedFiles(
  tx: ContactDatabaseTransaction,
  customerId: string,
  projectId: string,
  memberId: string,
) {
  await tx.insert(files).values([
    {
      id: randomUUID(),
      customer_id: customerId,
      project_id: projectId,
      source: FileSource.Link,
      status: FileStatus.Ready,
      asset_kind: AssetKind.Link,
      display_name: "Projektunterlagen (Mock)",
      note: "Beispieldaten für die lokale Entwicklung",
      url: "https://example.com/project-documents",
      visible_to_customer: true,
      uploaded_by_side: UploadSide.Internal,
      uploaded_by_member_id: memberId,
      version: 1,
    },
    {
      id: randomUUID(),
      customer_id: customerId,
      source: FileSource.Link,
      status: FileStatus.Ready,
      asset_kind: AssetKind.Link,
      display_name: "Interne Recherche (Mock)",
      url: "https://example.com/research",
      visible_to_customer: false,
      uploaded_by_side: UploadSide.Internal,
      uploaded_by_member_id: memberId,
      version: 1,
    },
  ]);
}
