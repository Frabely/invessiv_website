"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LeadConversionErrorCode } from "@invessiv/common/constants/crm/errors/lead-conversion-error-codes";
import type { ConvertLeadToCustomerRequestDto } from "@invessiv/common/contracts/crm/convert-lead-to-customer-request.dto";
import { leadConversionApiService } from "@/client/crm/lead-conversion-api-service";

type UseLeadCustomerConversionOptions = {
  crmBasePath?: string;
  leadId?: string;
};

export function useLeadCustomerConversion({
  crmBasePath,
  leadId,
}: UseLeadCustomerConversionOptions) {
  const router = useRouter();
  const [errorCode, setErrorCode] = useState<LeadConversionErrorCode | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(request: ConvertLeadToCustomerRequestDto) {
    if (!crmBasePath || !leadId) {
      return;
    }

    setIsSubmitting(true);
    setErrorCode(null);
    const result = await leadConversionApiService.convertLead(leadId, request);
    if (result.ok) {
      router.replace(crmBasePath, { scroll: false });
      router.refresh();
      return;
    }

    setIsSubmitting(false);
    setErrorCode(result.code);
  }

  return { errorCode, isSubmitting, submit };
}
