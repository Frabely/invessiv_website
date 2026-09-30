export const OnboardingTemplateBlocksConstraintName = {
  PrimaryKey: "onboarding_template_blocks_pkey",
  TemplateForeignKey: "onboarding_template_blocks_template_fk",
  BlockForeignKey: "onboarding_template_blocks_block_fk",
  PositionUnique: "onboarding_template_blocks_position_uidx",
  PositionCheck: "onboarding_template_blocks_position_check",
} as const;
