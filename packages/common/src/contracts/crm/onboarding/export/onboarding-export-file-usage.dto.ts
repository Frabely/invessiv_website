/** One question a file is attached to. */
export interface OnboardingExportFileUsageDto {
  /** Key of the block the question belongs to. */
  blockKey: string;
  /** Key of the group the question sits in; null on block level. */
  groupKey: string | null;
  /** Number of the group entry, starting at 1; null on block level. */
  entryNumber: number | null;
  /** Key of the files question itself; inside a group the key of the sub-question. */
  fieldKey: string;
}
