export const QuestionnaireBlocksConstraintName = {
  OwnerFormForeignKey: "questionnaire_blocks_owner_form_fk",
  SourceBlockForeignKey: "questionnaire_blocks_source_block_fk",
  IdOwnerUnique: "questionnaire_blocks_id_owner_uidx",
  KeyCheck: "questionnaire_blocks_key_check",
  StatusCheck: "questionnaire_blocks_status_check",
  VersionCheck: "questionnaire_blocks_version_check",
  OwnerStatusCheck: "questionnaire_blocks_owner_status_check",
  CatalogSourceCheck: "questionnaire_blocks_catalog_source_check",
  CatalogKeyUnique: "questionnaire_blocks_catalog_key_uidx",
  OwnerIndex: "questionnaire_blocks_owner_idx",
  SourceIndex: "questionnaire_blocks_source_idx",
} as const;
