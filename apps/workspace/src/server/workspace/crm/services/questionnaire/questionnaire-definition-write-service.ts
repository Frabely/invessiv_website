import "server-only";

import { questionnaireBlockSession } from "./questionnaire-block-session";
import { questionnaireBlockWriteService } from "./questionnaire-block-write-service";
import { questionnaireFieldWriteService } from "./questionnaire-field-write-service";

/**
 * The one entry point for every write on a block and its fields, for the catalog and for the
 * blocks of a form alike. The commands live next to it: block head in
 * `questionnaire-block-write-service`, fields in `questionnaire-field-write-service`, the lock and
 * the answer shape in `questionnaire-block-session`.
 */
export const questionnaireDefinitionWriteService = {
  blockConflict: questionnaireBlockSession.blockConflict,
  createBlock: questionnaireBlockWriteService.createBlock,
  createField: questionnaireFieldWriteService.createField,
  deleteBlock: questionnaireBlockWriteService.deleteBlock,
  deleteField: questionnaireFieldWriteService.deleteField,
  lockBlock: questionnaireBlockSession.lockBlock,
  moveField: questionnaireFieldWriteService.moveField,
  updateBlock: questionnaireBlockWriteService.updateBlock,
  updateField: questionnaireFieldWriteService.updateField,
} as const;
