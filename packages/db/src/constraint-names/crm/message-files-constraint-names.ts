export const MessageFilesConstraintName = {
  MessageCustomerForeignKey: "message_files_message_customer_fk",
  FileCustomerForeignKey: "message_files_file_customer_fk",
  MessageFileUnique: "message_files_message_file_unique",
  MessagePositionUnique: "message_files_message_position_unique",
  PositionCheck: "message_files_position_check",
  FileIndex: "message_files_file_idx",
} as const;
