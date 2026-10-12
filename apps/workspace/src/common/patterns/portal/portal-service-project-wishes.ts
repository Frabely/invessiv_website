import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
import { ServiceRequestProjectWish as Wish } from "@invessiv/common/constants/crm/service-request-project-wishes";

type PortalServiceProjectWishInput = {
  /** Null for a free-text request. */
  service: { kind: LineItemKind; projectMode: LineItemProjectMode } | null;
  /** How many projects the server offers for this service. */
  selectableProjectCount: number;
};

/**
 * The one definition of what a contact may answer to "which project?", in the order the form
 * offers it. The form builds its question from it and the server rejects every other answer.
 *
 * Hours belong to the company, so they may always be asked for without a project. A further
 * feedback round only exists on a project. A service that starts its own project names none.
 */
export function listPortalServiceProjectWishes({
  service,
  selectableProjectCount,
}: PortalServiceProjectWishInput): Wish[] {
  const existing = selectableProjectCount > 0 ? [Wish.Existing] : [];
  if (service === null) return [...existing, Wish.New, Wish.Undecided];
  if (service.projectMode === LineItemProjectMode.NewProject) return [Wish.New];
  if (service.kind === LineItemKind.FeedbackRound) return existing;
  if (service.kind === LineItemKind.Hours) return [...existing, Wish.Undecided];
  return existing.length > 0 ? existing : [Wish.Undecided];
}
