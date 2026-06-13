export const ConsentSignalState = {
  Granted: "granted",
  Denied: "denied",
} as const;
export type ConsentSignalState =
  (typeof ConsentSignalState)[keyof typeof ConsentSignalState];
