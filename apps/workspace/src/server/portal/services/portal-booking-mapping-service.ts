import type { PortalBookingDto } from "@invessiv/common/contracts/portal/portal-booking.dto";
import { resolveBookingProvider } from "@invessiv/common/patterns/portal/resolve-booking-provider";
import type { ProjectBookingContact } from "@/server/shared/services/project-responsible-member-types";

function toDto(contact: ProjectBookingContact): PortalBookingDto {
  return {
    memberDisplayName: contact.displayName,
    bookingUrl: contact.bookingUrl,
    provider: resolveBookingProvider(contact.bookingUrl),
  };
}

export const portalBookingMappingService = { toDto } as const;
