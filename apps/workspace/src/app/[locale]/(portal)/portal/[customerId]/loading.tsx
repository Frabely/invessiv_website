import { Skeleton, WidgetGrid } from "@invessiv/ui";
import { PORTAL_WIDGET_LAYOUT } from "@/common/constants/portal/portal-widget-layout";
import styles from "./loading.module.css";

/** Placeholder tiles in the dashboard's own grid, so nothing jumps once the data arrives. */
export default function PortalCustomerLoading() {
  return (
    <div aria-busy="true" className={styles.frame}>
      <WidgetGrid
        layout={PORTAL_WIDGET_LAYOUT}
        slots={Object.fromEntries(
          PORTAL_WIDGET_LAYOUT.map((entry) => [
            entry.key,
            <Skeleton
              className={
                entry.span.desktop === 12 ? styles.wideTile : styles.tile
              }
              key={entry.key}
            />,
          ]),
        )}
      />
    </div>
  );
}
