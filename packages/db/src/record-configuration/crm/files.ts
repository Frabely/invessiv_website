import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import {
  ASSET_KIND_VALUES,
  AssetKind,
} from "@invessiv/common/constants/files/asset-kind";
import {
  FILE_SOURCE_VALUES,
  FileSource,
} from "@invessiv/common/constants/files/file-source";
import {
  FILE_STATUS_VALUES,
  FileStatus,
} from "@invessiv/common/constants/files/file-status";
import {
  UPLOAD_SIDE_VALUES,
  UploadSide,
} from "@invessiv/common/constants/files/upload-side";
import { FILE_INSPECTION_STATUS_VALUES } from "@invessiv/common/constants/files/file-inspection-status";
import { UPLOAD_EXTENSION_VALUES } from "@invessiv/common/constants/files/upload-extension";
import { FilesConstraintName as N } from "@invessiv/db/constraint-names/crm/files-constraint-names";
import { sqlCheckIn } from "@invessiv/db/core";
import { customers } from "./customers";
import { projects } from "./projects";
import { workspaceMembers } from "./workspace-members";
import { portalMemberships } from "./portal-memberships";

export const files = pgTable(
  "files",
  {
    id: uuid("id").primaryKey(),
    customer_id: uuid("customer_id").notNull(),
    project_id: uuid("project_id"),
    // Reserved for the later feedback-round migration, including its foreign key.
    feedback_round_id: uuid("feedback_round_id"),
    source: text("source", { enum: FILE_SOURCE_VALUES }).notNull(),
    status: text("status", { enum: FILE_STATUS_VALUES }).notNull(),
    asset_kind: text("asset_kind", { enum: ASSET_KIND_VALUES }).notNull(),
    display_name: text("display_name").notNull(),
    note: text("note"),
    visible_to_customer: boolean("visible_to_customer").notNull(),
    uploaded_by_side: text("uploaded_by_side", {
      enum: UPLOAD_SIDE_VALUES,
    }).notNull(),
    uploaded_by_member_id: uuid("uploaded_by_member_id"),
    uploaded_by_portal_membership_id: uuid("uploaded_by_portal_membership_id"),
    storage_key: text("storage_key"),
    content_type: text("content_type"),
    extension: text("extension", { enum: UPLOAD_EXTENSION_VALUES }),
    size_bytes: bigint("size_bytes", { mode: "number" }),
    inspection_status: text("inspection_status", {
      enum: FILE_INSPECTION_STATUS_VALUES,
    }),
    url: text("url"),
    orphaned_at: timestamp("orphaned_at", { withTimezone: true }),
    version: integer("version").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      name: N.CustomerForeignKey,
      columns: [t.customer_id],
      foreignColumns: [customers.id],
    }).onDelete("cascade"),
    foreignKey({
      name: N.ProjectCustomerForeignKey,
      columns: [t.project_id, t.customer_id],
      foreignColumns: [projects.id, projects.customer_id],
    }),
    foreignKey({
      name: N.MemberForeignKey,
      columns: [t.uploaded_by_member_id],
      foreignColumns: [workspaceMembers.id],
    }),
    foreignKey({
      name: N.PortalMembershipForeignKey,
      columns: [t.uploaded_by_portal_membership_id],
      foreignColumns: [portalMemberships.id],
    }),
    unique(N.StorageKeyUnique).on(t.storage_key),
    unique(N.IdCustomerUnique).on(t.id, t.customer_id),
    check(N.SourceCheck, sqlCheckIn(t.source, FILE_SOURCE_VALUES)),
    check(N.StatusCheck, sqlCheckIn(t.status, FILE_STATUS_VALUES)),
    check(N.AssetKindCheck, sqlCheckIn(t.asset_kind, ASSET_KIND_VALUES)),
    check(
      N.DisplayNameCheck,
      sql`btrim
        (
        ${t.display_name}
        )
        <>
        ''`,
    ),
    check(
      N.NoteCheck,
      sql`length
        (
        ${t.note}
        )
        <=
        200`,
    ),
    check(
      N.UploadSideCheck,
      sqlCheckIn(t.uploaded_by_side, UPLOAD_SIDE_VALUES),
    ),
    check(
      N.SizeCheck,
      sql`${t.size_bytes}
        > 0`,
    ),
    check(
      N.InspectionCheck,
      sqlCheckIn(t.inspection_status, FILE_INSPECTION_STATUS_VALUES),
    ),
    check(
      N.UrlCheck,
      sql`${t.url}
            LIKE 'https://%' AND length(
            ${t.url}
            )
            <=
            2048`,
    ),
    check(
      N.VersionCheck,
      sql`${t.version}
        > 0`,
    ),
    check(
      N.SourceFieldsCheck,
      sql`(
                    ${t.source} = ${FileSource.Upload} AND ${t.asset_kind} <> ${AssetKind.Link}
                    AND num_nonnulls(${t.storage_key}, ${t.content_type}, ${t.extension}, ${t.size_bytes}, ${t.inspection_status}) = 5 AND ${t.url} IS NULL)
                OR (
                ${t.source}
                =
                ${FileSource.Link}
                AND
                ${t.asset_kind}
                =
                ${AssetKind.Link}
                AND
                ${t.status}
                =
                ${FileStatus.Ready}
                AND
                num_nonnulls
                (
                ${t.storage_key}
                ,
                ${t.content_type}
                ,
                ${t.extension}
                ,
                ${t.size_bytes}
                ,
                ${t.inspection_status}
                )
                =
                0
                AND
                ${t.url}
                IS
                NOT
                NULL
                )`,
    ),
    check(
      N.UploaderCheck,
      sql`num_nonnulls
            (
            ${t.uploaded_by_member_id},
            ${t.uploaded_by_portal_membership_id}
            )
            =
            1
            AND
            (
            (
            ${t.uploaded_by_side}
            =
            ${UploadSide.Internal}
            AND
            ${t.uploaded_by_member_id}
            IS
            NOT
            NULL
            )
            OR
            (
            ${t.uploaded_by_side}
            =
            ${UploadSide.Customer}
            AND
            ${t.uploaded_by_portal_membership_id}
            IS
            NOT
            NULL
            )
            )`,
    ),
    check(
      N.CustomerVisibleCheck,
      sql`${t.uploaded_by_side}
            <>
            ${UploadSide.Customer}
            OR
            ${t.visible_to_customer}`,
    ),
    index(N.CustomerReadyIndex).on(t.customer_id, t.created_at.desc())
      .where(sql`${t.status}
            =
            ${FileStatus.Ready}`),
    index(N.ProjectIndex).on(t.project_id).where(sql`${t.project_id}
            IS NOT NULL`),
    index(N.CustomerVisibleIndex)
      .on(t.customer_id)
      .where(
        sql`${t.visible_to_customer}
                AND
                ${t.status}
                =
                ${FileStatus.Ready}`,
      ),
    index(N.PendingIndex).on(t.status, t.created_at).where(sql`${t.status}
            =
            ${FileStatus.Pending}`),
  ],
);
