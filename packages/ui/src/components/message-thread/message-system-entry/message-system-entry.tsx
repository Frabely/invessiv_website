import styles from "./message-system-entry.module.css";

type MessageSystemEntryProps = {
  dateTime: string;
  text: string;
  timeLabel: string;
};

/** A system event sits in the flow without a bubble, so it never reads as someone's message. */
export function MessageSystemEntry({
  dateTime,
  text,
  timeLabel,
}: MessageSystemEntryProps) {
  return (
    <p className={styles.entry}>
      <span>{text}</span>
      <time className={styles.time} dateTime={dateTime}>
        {timeLabel}
      </time>
    </p>
  );
}
