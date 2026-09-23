/** Thrown by page gates when authorization data cannot be loaded; the error page keeps the door closed. */
export class PortalAuthorizationUnavailableError extends Error {
  constructor() {
    super("Portal authorization is unavailable.");
    this.name = "PortalAuthorizationUnavailableError";
  }
}
