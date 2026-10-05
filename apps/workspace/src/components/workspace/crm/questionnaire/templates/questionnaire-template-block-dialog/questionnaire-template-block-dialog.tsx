import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { resolveQuestionnaireBlock } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-resolved-block";
import { Dialog, DialogSize } from "@invessiv/ui";
import { questionnaireCatalogApiService } from "@/client/crm/questionnaire-catalog-api-service";
import type { QuestionnaireFixedChoiceLabels } from "@/common/contracts/crm/questionnaire/questionnaire-fixed-choice-labels";
import type { CrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import { QuestionnaireBlockEditor } from "../../editor/questionnaire-block-editor/questionnaire-block-editor";

export type QuestionnaireTemplateBlockDialogProps = {
  block: QuestionnaireBlockDto;
  canWrite: boolean;
  content: CrmQuestionnaireDictionary;
  fixedChoiceLabels: QuestionnaireFixedChoiceLabels;
  locale: Locale;
  onBlockChangeAction: (block: QuestionnaireBlockDto) => void;
  onCloseAction: () => void;
};

export function QuestionnaireTemplateBlockDialog({
  block,
  canWrite,
  content,
  fixedChoiceLabels,
  locale,
  onBlockChangeAction,
  onCloseAction,
}: QuestionnaireTemplateBlockDialogProps) {
  return (
    <Dialog
      closeLabel={content.templateEditor.blockDialog.close}
      onCloseAction={onCloseAction}
      size={DialogSize.Wide}
      title={resolveQuestionnaireBlock(block, locale).title}
    >
      <QuestionnaireBlockEditor
        api={questionnaireCatalogApiService.definitionApi}
        block={block}
        canWrite={canWrite}
        content={content}
        fixedChoiceLabels={fixedChoiceLabels}
        key={block.id}
        locale={locale}
        onBlockChangeAction={onBlockChangeAction}
        showStatus
      />
    </Dialog>
  );
}
