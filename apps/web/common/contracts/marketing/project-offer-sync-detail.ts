/**
 * Detail payload of the PROJECT_OFFER_CHANGE_EVENT used to sync the contact
 * form from other sections (services cards, LinkedIn-post generator).
 *
 * All fields are best-effort: a cold entry (e.g. limit reached without a prior
 * lead step) simply omits identity fields and the prefill stays empty.
 */
export type ProjectOfferSyncDetail = {
  offerKey?: string;
  projectGoal?: string;
  displayName?: string;
  email?: string;
};
