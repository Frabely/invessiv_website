/** Body of `POST /api/workspace/members/clerk-candidates`. */
export interface ListClerkCandidatesRequestDto {
  /**
   * Optional Clerk directory search. It is sent in the request body so names and email addresses
   * never become part of a URL.
   */
  query: string;
}
