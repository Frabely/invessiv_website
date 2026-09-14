import type { OwnableEntity } from "@invessiv/common/constants/crm/ownable-entities";

/** Complete responsibility count keyed by every entity registered for ownership. */
export type OwnershipResponsibilityCountsDto = Record<OwnableEntity, number>;
