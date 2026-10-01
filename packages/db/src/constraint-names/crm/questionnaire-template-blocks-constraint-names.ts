export const QuestionnaireTemplateBlocksConstraintName = {
  PrimaryKey: "questionnaire_template_blocks_pkey",
  TemplateForeignKey: "questionnaire_template_blocks_template_fk",
  BlockForeignKey: "questionnaire_template_blocks_block_fk",
  PositionUnique: "questionnaire_template_blocks_position_uidx",
  PositionCheck: "questionnaire_template_blocks_position_check",
} as const;
