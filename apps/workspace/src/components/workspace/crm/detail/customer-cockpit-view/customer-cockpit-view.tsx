import type { CustomerCockpitDto } from "@invessiv/common/contracts/crm/customer-cockpit.dto";
import type { ProjectDto } from "@invessiv/common/contracts/crm/project.dto";
import { CustomerProjectsSection } from "@/components/workspace/crm/projects/customer-projects-section/customer-projects-section";
import type { CrmCockpitDictionary } from "@/i18n/dictionaries/workspace/crm";

type CustomerCockpitViewProps = {
  content: CrmCockpitDictionary;
  customer: CustomerCockpitDto;
  canWriteProjects?: boolean;
  projects?: ProjectDto[] | null;
};

/** The shared customer detail content for the CRM dialog and future dashboard view. */
export function CustomerCockpitView({
  content,
  customer,
  canWriteProjects = false,
  projects = null,
}: CustomerCockpitViewProps) {
  return (
    <div>
      {projects ? (
        <CustomerProjectsSection
          canWrite={canWriteProjects}
          content={content}
          customerId={customer.id}
          projects={projects}
        />
      ) : null}
    </div>
  );
}
