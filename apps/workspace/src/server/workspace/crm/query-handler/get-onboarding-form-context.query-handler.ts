import "server-only";

import { and, eq } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { OnboardingFormContextDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form-context.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  customers,
  onboardingForms,
  projects,
  questionnaireTemplates,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessScope } from "@/common/patterns/auth/access-scope";
import { onboardingFormSchemas } from "@/server/workspace/crm/services/onboarding/onboarding-form-schemas";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";

/**
 * Customer, project and template of a form for the head of its page; null when the form is out of
 * reach. A member bound to the project alone still reads the customer's name: the customer is the
 * container of that project.
 */
export async function getOnboardingFormContext(
  formId: string,
  actor: WorkspaceActor,
): Promise<OnboardingFormContextDto | null> {
  if (!onboardingFormSchemas.entityId.safeParse(formId).success) return null;
  const [row] = await getDrizzleDatabaseClient()
    .select({
      customerId: customers.id,
      customerName: customers.display_name,
      projectId: projects.id,
      projectTitle: projects.title,
      projectPhase: projects.phase,
      templateTitle: questionnaireTemplates.title,
    })
    .from(onboardingForms)
    .innerJoin(projects, eq(projects.id, onboardingForms.project_id))
    .innerJoin(customers, eq(customers.id, onboardingForms.customer_id))
    .leftJoin(
      questionnaireTemplates,
      eq(questionnaireTemplates.id, onboardingForms.source_template_id),
    )
    .where(
      and(
        eq(onboardingForms.id, formId),
        crmAccessCondition.forScope(
          accessScope(actor, Permission.ProjectsRead),
          {
            customerId: onboardingForms.customer_id,
            projectId: onboardingForms.project_id,
          },
        ),
      ),
    )
    .limit(1);
  return row ?? null;
}
