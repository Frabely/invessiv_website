import "server-only";
import type { NextRequest } from "next/server";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import {
  CREDENTIAL_CUSTOMER_WIDE_QUERY_VALUE,
  CredentialQueryParam as Q,
} from "@/common/constants/credentials/credential-query-params";
import { withCrmPermission } from "@/lib/auth/api";
import {
  credentialApiResponse,
  parseCredentialBody,
  privateCredentialResponse,
} from "@/lib/credentials/credential-api-response";
import { createCredential } from "@/server/workspace/crm/command-handler/create-credential.command-handler";
import { listCustomerCredentials } from "@/server/workspace/crm/query-handler/list-customer-credentials.query-handler";
import { credentialSchemas } from "@/server/workspace/crm/services/credentials/credential-schemas";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return privateCredentialResponse(() =>
    withCrmPermission(
      CrmEndpointAccessRule.CredentialsList,
      async (authorized, actor) => {
        const projectId = authorized.nextUrl.searchParams.get(Q.ProjectId);
        return credentialApiResponse(
          await listCustomerCredentials(
            id,
            {
              projectId:
                projectId === CREDENTIAL_CUSTOMER_WIDE_QUERY_VALUE
                  ? null
                  : (projectId ?? undefined),
            },
            actor,
          ),
        );
      },
    )(request),
  );
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return privateCredentialResponse(() =>
    withCrmPermission(
      CrmEndpointAccessRule.CredentialCreate,
      async (authorized, actor) =>
        parseCredentialBody(
          authorized,
          credentialSchemas.create,
          async (data) =>
            credentialApiResponse(
              await createCredential(id, data, actor),
              HttpResponseCode.Created,
            ),
        ),
    )(request),
  );
}
