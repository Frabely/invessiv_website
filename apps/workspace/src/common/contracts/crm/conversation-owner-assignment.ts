/** Responsible member and version after a successful or conflicting owner change. */
export type ConversationOwnerAssignment = {
  /** `workspace_members.id` of the responsible member. */
  ownerMemberId: string;
  /** Version to send with the next change. */
  version: number;
};
