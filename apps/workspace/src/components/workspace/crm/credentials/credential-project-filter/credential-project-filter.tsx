"use client";

import { useId } from "react";
import { CustomSelect } from "@invessiv/ui";
import type { CrmProjectOption } from "@/common/contracts/crm/crm-project-option";
import { credentialProjectFilter } from "@/common/patterns/crm/credentials/credential-project-filter";
import type { CrmCredentialsDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./credential-project-filter.module.css";

type CredentialProjectFilterProps = {
  content: CrmCredentialsDictionary["filter"];
  customerWide: boolean;
  projects: readonly CrmProjectOption[];
  projectId: string | null | undefined;
  onChangeAction: (projectId: string | null | undefined) => void;
};

export function CredentialProjectFilter({
  content,
  customerWide,
  projects,
  projectId,
  onChangeAction,
}: CredentialProjectFilterProps) {
  const id = useId();
  return (
    <div className={styles.filter}>
      <label className={styles.filterLabel} htmlFor={id}>
        {content.label}
      </label>
      <CustomSelect
        ariaLabel={content.label}
        id={id}
        onChange={(value) =>
          onChangeAction(credentialProjectFilter.fromOptionValue(value))
        }
        options={[
          { value: "", label: content.all },
          ...(customerWide
            ? [
                {
                  value: credentialProjectFilter.toOptionValue(null),
                  label: content.customerWide,
                },
              ]
            : []),
          ...projects.map((project) => ({
            value: project.id,
            label: project.title,
          })),
        ]}
        value={credentialProjectFilter.toOptionValue(projectId)}
      />
    </div>
  );
}
