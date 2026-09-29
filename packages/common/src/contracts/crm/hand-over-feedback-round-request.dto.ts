/** Project comes from the route; round number and customer are assigned by the server. */
export interface HandOverFeedbackRoundRequestDto {
  /** HTTPS preview the customer should look at; null or omitted when there is none yet. */
  previewUrl?: string | null;
  /** "What's new" for the customer, plain text; null or omitted when there is nothing to say. */
  handoverNote?: string | null;
  /** Requested feedback day as `YYYY-MM-DD`, today or later; display only, nothing expires. */
  dueOn?: string | null;
  /** Areas the customer can pick per item; also replaces the project's saved area list. */
  areaOptions: string[];
}
