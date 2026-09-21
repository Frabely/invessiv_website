import "server-only";

import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { customers } from "@invessiv/db/record-configuration";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { AccessOperation } from "@/common/constants/access/access-operations";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { withCrmPermission } from "@/lib/auth/api";
import { authApiError } from "@/lib/auth/auth-api-error";
import { logAccessFailure } from "@/lib/workspace/access/log-access-failure";
import { listCustomerAccessScopes } from "@/server/workspace/access/query-handler/list-customer-access-scopes.query-handler";
import { AuthErrorCode } from "@invessiv/common/constants/auth/auth-error-codes";
import { accessSchemas } from "@/server/workspace/access/services/access-schemas";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.CustomerAccessScopes,
    async () => {
      try {
        if (!accessSchemas.entityId.safeParse(id).success)
          return authApiError(
            AuthErrorCode.NotFound,
            HttpResponseCode.NotFound,
          );
        const db = getDrizzleDatabaseClient();
        const [customer] = await db
          .select({ id: customers.id })
          .from(customers)
          .where(eq(customers.id, id))
          .limit(1);
        if (!customer)
          return authApiError(
            AuthErrorCode.NotFound,
            HttpResponseCode.NotFound,
          );
        return Response.json(
          { accessScopes: await listCustomerAccessScopes(id) },
          { status: HttpResponseCode.Ok },
        );
      } catch (error: unknown) {
        logAccessFailure(AccessOperation.ListCustomerAccessScopes, error);
        return authApiError(
          AuthErrorCode.Unavailable,
          HttpResponseCode.ServiceUnavailable,
        );
      }
    },
  )(request);
}
