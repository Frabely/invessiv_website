export const OnboardingBlocksConstraintName = {
  OwnerFormForeignKey: "onboarding_blocks_owner_form_fk",
  SourceBlockForeignKey: "onboarding_blocks_source_block_fk",
  IdOwnerUnique: "onboarding_blocks_id_owner_uidx",
  KeyCheck: "onboarding_blocks_key_check",
  StatusCheck: "onboarding_blocks_status_check",
  VersionCheck: "onboarding_blocks_version_check",
  OwnerStatusCheck: "onboarding_blocks_owner_status_check",
  CatalogSourceCheck: "onboarding_blocks_catalog_source_check",
  CatalogKeyUnique: "onboarding_blocks_catalog_key_uidx",
  OwnerIndex: "onboarding_blocks_owner_idx",
  SourceIndex: "onboarding_blocks_source_idx",
} as const;
