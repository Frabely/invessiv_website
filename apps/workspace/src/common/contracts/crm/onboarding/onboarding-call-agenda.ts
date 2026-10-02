/** One question the team keeps for the onboarding call. */
export type OnboardingCallAgendaPoint = {
  blockId: string;
  /** Block title in the interface language. */
  title: string;
  note: string;
};

/** Everything the team wants to clear up in the onboarding call. */
export type OnboardingCallAgenda = {
  points: OnboardingCallAgendaPoint[];
  /** A project line item changed after the customer confirmed the services. */
  servicesChanged: boolean;
  /** What the customer remarked on the booked services; null without a remark. */
  servicesNote: string | null;
};
