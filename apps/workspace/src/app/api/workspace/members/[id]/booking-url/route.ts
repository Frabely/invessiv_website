import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { UpdateMemberBookingUrlRequestDto } from "@invessiv/common/contracts/auth/update-member-booking-url-request.dto";
import { AccessOperation } from "@/common/constants/access/access-operations";
import { handleMemberMutation } from "@/lib/workspace/access/access-mutation-route";
import { updateMemberBookingUrl } from "@/server/workspace/access/command-handler/update-member-booking-url.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  return handleMemberMutation(request, {
    operation: AccessOperation.UpdateMemberBookingUrl,
    successStatus: HttpResponseCode.Ok,
    execute: (body, actor) =>
      updateMemberBookingUrl(
        id,
        body as UpdateMemberBookingUrlRequestDto,
        actor,
      ),
  });
}
