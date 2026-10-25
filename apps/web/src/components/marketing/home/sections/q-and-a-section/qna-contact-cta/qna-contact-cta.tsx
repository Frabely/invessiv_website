import { AnalyticsCtaId } from "@/common/constants/analytics/analytics-cta-id";
import { AnalyticsEventName } from "@/common/constants/analytics/analytics-event-name";
import { AnalyticsTarget } from "@/common/constants/analytics/analytics-target";
import { analyticsAttributes } from "@/common/patterns/analytics/analytics-properties";
import styles from "./qna-contact-cta.module.css";
import { TertiaryCta } from "@invessiv/ui";

type QnaContactCtaProps = {
  hint: string;
  href: string;
  label: string;
};

export function QnaContactCta({ hint, href, label }: QnaContactCtaProps) {
  return (
    <p className={styles.cta}>
      <span className={styles.hint}>{hint}</span>
      <TertiaryCta
        className={styles.link}
        href={href}
        {...analyticsAttributes(AnalyticsEventName.CtaClicked, {
          cta: AnalyticsCtaId.HomeFaqContact,
          target: AnalyticsTarget.ContactEmail,
        })}
      >
        {label}
      </TertiaryCta>
    </p>
  );
}
