"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { QuestionnaireEditorDialog } from "@/common/contracts/crm/questionnaire/questionnaire-editor-dialog";
import {
  readQuestionnaireEditorDialog,
  writeQuestionnaireEditorDialog,
} from "@/common/patterns/crm/questionnaire/questionnaire-editor-query";

/**
 * The open dialog of the block editor lives in the URL like every CRM dialog. Only the editor's
 * own params change, so an embedding page keeps its state.
 */
export function useQuestionnaireEditorDialog() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dialog = readQuestionnaireEditorDialog(
    new URLSearchParams(searchParams.toString()),
  );

  function open(next: QuestionnaireEditorDialog) {
    const query = writeQuestionnaireEditorDialog(
      new URLSearchParams(searchParams.toString()),
      next,
    ).toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  return { dialog, open, close: () => open(null) };
}
