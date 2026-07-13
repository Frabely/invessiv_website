import Image from "next/image";

import { SiteHeaderAsset } from "@/common/constants/marketing/site-header-assets";
import styles from "./site-header-brand.module.css";

type SiteHeaderBrandProps = {
  brandHref: string;
  brandLabel: string;
};

export function SiteHeaderBrand({
  brandHref,
  brandLabel,
}: SiteHeaderBrandProps) {
  return (
    <a className={styles.brand} href={brandHref}>
      <Image
        alt=""
        aria-hidden="true"
        height={26}
        priority
        src={SiteHeaderAsset.BrandIcon}
        width={26}
      />
      <span>{brandLabel}</span>
    </a>
  );
}
