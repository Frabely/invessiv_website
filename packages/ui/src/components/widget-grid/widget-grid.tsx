import type { ReactNode } from "react";
import type { WidgetLayoutEntry } from "@invessiv/common/contracts/ui/widget-layout";
import styles from "./widget-grid.module.css";

export type WidgetGridProps<Key extends string> = {
  layout: readonly WidgetLayoutEntry<Key>[];
  slots: Partial<Record<Key, ReactNode>>;
  className?: string;
};

export function WidgetGrid<Key extends string>({
  layout,
  slots,
  className,
}: WidgetGridProps<Key>) {
  return (
    <section
      className={className ? `${styles.grid} ${className}` : styles.grid}
    >
      {[...layout]
        .sort((a, b) => a.order - b.order)
        .map(({ key, span }) => {
          const slot = slots[key];
          if (!slot) return null;
          return (
            <div
              className={styles.slot}
              data-desktop-span={span.desktop}
              data-mobile-span={span.mobile}
              data-tablet-span={span.tablet}
              data-widget={key}
              key={key}
            >
              {slot}
            </div>
          );
        })}
    </section>
  );
}
