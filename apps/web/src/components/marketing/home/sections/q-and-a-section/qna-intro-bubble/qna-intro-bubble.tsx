import styles from "./qna-intro-bubble.module.css";

type QnaIntroBubbleProps = {
  primary: string;
  secondary: string;
};

export function QnaIntroBubble({ primary, secondary }: QnaIntroBubbleProps) {
  return (
    <div className={styles.intro}>
      <p className={styles.line} data-qna-intro-line="primary">
        {primary}
      </p>
      <p className={styles.line} data-qna-intro-line="secondary">
        {secondary}
      </p>
    </div>
  );
}
