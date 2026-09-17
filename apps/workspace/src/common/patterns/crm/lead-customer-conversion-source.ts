import type { LeadDetailDto } from "@invessiv/common/contracts/leads/lead-detail.dto";
import type { LeadCustomerConversionSource } from "@/common/contracts/crm/lead-customer-conversion-source";

export function toLeadCustomerConversionSource(
  lead: LeadDetailDto,
): LeadCustomerConversionSource {
  return {
    id: lead.id,
    displayName: lead.displayName,
    companyName: lead.companyName,
    categoryId: lead.category?.id ?? null,
    websiteUrl: lead.websiteUrl,
    notes: lead.notes,
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone,
  };
}
