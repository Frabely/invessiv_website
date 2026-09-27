export const MessagesConstraintName = {
  TypeCheck: "messages_type_check",
  SenderSideCheck: "messages_sender_side_check",
  SenderConsistencyCheck: "messages_sender_consistency_check",
  BodyCheck: "messages_body_check",
  ConversationOrderIndex: "messages_conversation_order_idx",
  CustomerOrderIndex: "messages_customer_order_idx",
  PortalSenderOrderIndex: "messages_portal_sender_order_idx",
  ClientMessageUnique: "messages_client_message_uidx",
} as const;
