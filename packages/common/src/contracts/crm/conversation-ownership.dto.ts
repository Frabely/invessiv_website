export interface ConversationOwnershipDto {
  /** `workspace_members.id` of the responsible member; follows the customer owner when created. */
  ownerMemberId: string;
  /** Current display name of the responsible member. */
  ownerDisplayName: string;
  /** Optimistic lock of the conversation, independent of the customer version. */
  version: number;
}
