/**
 * Every editable entity carries `version`; every write sends back the version it read.
 * A mutation without a version is a contract error, not an "optional" field.
 */
export interface VersionedWriteInput {
  /**
   * The version as read by the client. Goes into the `WHERE` of the update, so a stale
   * value yields a 409 instead of overwriting someone else's change.
   */
  version: number;
}

/** Read-side counterpart: every editable DTO exposes its version. */
export interface VersionedDto {
  /**
   * Current version of the record. The client keeps it and sends it back on the next
   * write — it is not a display value.
   */
  version: number;
}
