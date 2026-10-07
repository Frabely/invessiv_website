import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faChartLine,
  faDatabase,
  faEnvelope,
  faGlobe,
  faKey,
  faNewspaper,
  faPlug,
  faServer,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CredentialType } from "@invessiv/common/constants/credentials/credential-types";

const ICON_BY_TYPE: Record<CredentialType, IconDefinition> = {
  [CredentialType.DomainRegistrar]: faGlobe,
  [CredentialType.Hosting]: faServer,
  [CredentialType.Email]: faEnvelope,
  [CredentialType.Cms]: faNewspaper,
  [CredentialType.Database]: faDatabase,
  [CredentialType.Analytics]: faChartLine,
  [CredentialType.ApiService]: faPlug,
  [CredentialType.Other]: faKey,
};

export type CredentialTypeIconProps = {
  className?: string;
  type: CredentialType;
};

/** Decorative: the type is always named in text next to it. */
export function CredentialTypeIcon({
  className,
  type,
}: CredentialTypeIconProps) {
  return (
    <FontAwesomeIcon
      aria-hidden="true"
      className={className}
      icon={ICON_BY_TYPE[type]}
    />
  );
}
