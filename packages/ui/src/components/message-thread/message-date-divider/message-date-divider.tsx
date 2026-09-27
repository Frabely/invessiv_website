import styles from "./message-date-divider.module.css";

type MessageDateDividerProps = {
  dateTime: string;
  label: string;
};

export function MessageDateDivider({
  dateTime,
  label,
}: MessageDateDividerProps) {
  return (
    <div className={styles.divider} role="separator">
      <time dateTime={dateTime}>{label}</time>
    </div>
  );
}
