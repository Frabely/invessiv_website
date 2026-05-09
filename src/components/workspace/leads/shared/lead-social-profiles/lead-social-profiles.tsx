"use client";

import type { MouseEvent } from "react";
import {
  faInstagram,
  faLinkedinIn,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import { faGlobe, faPhone } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { LeadSocialProfileDto } from "@/common/contracts/leads/lead-social-profile.dto";
import type { LeadSocialPlatform } from "@/common/constants/leads/social/lead-social-platforms";
import styles from "./lead-social-profiles.module.css";

type LeadSocialProfilesLabels = {
  website: string;
  linkedin: string;
  instagram: string;
  youtube: string;
  phone: string;
};

type LeadSocialProfilesProps = {
  websiteUrl: string | null;
  phone: string | null;
  profiles: LeadSocialProfileDto[];
  labels: LeadSocialProfilesLabels;
  emptyLabel: string;
};

const platformIcons: Record<LeadSocialPlatform, IconDefinition> = {
  linkedin: faLinkedinIn,
  instagram: faInstagram,
  youtube: faYoutube,
};

function stopPropagation(event: MouseEvent<HTMLAnchorElement>) {
  event.stopPropagation();
}

export function LeadSocialProfiles({
  websiteUrl,
  phone,
  profiles,
  labels,
  emptyLabel,
}: LeadSocialProfilesProps) {
  const hasAny = Boolean(websiteUrl) || Boolean(phone) || profiles.length > 0;

  if (!hasAny) {
    return <span className={styles.empty}>{emptyLabel}</span>;
  }

  return (
    <div className={styles.container}>
      {websiteUrl ? (
        <a
          aria-label={labels.website}
          className={styles.iconLink}
          data-platform="website"
          href={websiteUrl}
          onClick={stopPropagation}
          rel="noopener noreferrer"
          target="_blank"
          title={labels.website}
        >
          <FontAwesomeIcon className={styles.icon} icon={faGlobe} />
        </a>
      ) : null}
      {profiles.map((profile) => (
        <a
          aria-label={labels[profile.platform]}
          className={styles.iconLink}
          data-platform={profile.platform}
          href={profile.profileUrl}
          key={profile.id}
          onClick={stopPropagation}
          rel="noopener noreferrer"
          target="_blank"
          title={labels[profile.platform]}
        >
          <FontAwesomeIcon
            className={styles.icon}
            icon={platformIcons[profile.platform]}
          />
        </a>
      ))}
      {phone ? (
        <a
          aria-label={labels.phone}
          className={styles.iconLink}
          data-platform="phone"
          href={`tel:${phone.replace(/\s+/g, "")}`}
          onClick={stopPropagation}
          title={labels.phone}
        >
          <FontAwesomeIcon className={styles.icon} icon={faPhone} />
        </a>
      ) : null}
    </div>
  );
}
