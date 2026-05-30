import { useEffect, useRef, useState } from "react";
import { POST_SIZE_PX } from "@/common/constants/generator";
import styles from "./post-frame-preview.module.css";

type PostFramePreviewProps = {
  html: string;
  title: string;
};

/**
 * Renders the canonical 1080x1080 post HTML in a sandboxed iframe, scaled to
 * fit its responsive square container. The iframe shows the exact same HTML the
 * server screenshots to PNG, so the on-page preview and the downloaded/emailed
 * image can never drift apart.
 */
export function PostFramePreview({ html, title }: PostFramePreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const update = () => setScale(container.clientWidth / POST_SIZE_PX);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.frame} ref={containerRef}>
      <iframe
        aria-label={title}
        className={styles.canvas}
        sandbox=""
        srcDoc={html}
        style={{
          transform: `scale(${scale})`,
          visibility: scale === 0 ? "hidden" : "visible",
        }}
        title={title}
      />
    </div>
  );
}
