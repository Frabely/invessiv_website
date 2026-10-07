/** What the viewer may do with one entry; resolved per row because bound roles differ per project. */
export interface CredentialCapabilitiesDto {
  /** Edit, move between projects and delete. Independent of `canReveal`. */
  canWrite: boolean;
  /** Request the secret or the note in plaintext, one field per request. */
  canReveal: boolean;
}
