/** The two movements of the allocation dialog; the direction is fixed by the button that opened it. */
export const HourAllocationDirection = {
  Allocate: "allocate",
  Release: "release",
} as const;

export type HourAllocationDirection =
  (typeof HourAllocationDirection)[keyof typeof HourAllocationDirection];
