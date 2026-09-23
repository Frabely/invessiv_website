import type {
  HTMLAttributes,
  ReactNode,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import { ListPagination, type ListPaginationProps } from "./list-pagination";
import styles from "./data-table.module.css";

function getClassName(baseClassName: string, className?: string) {
  return className ? `${baseClassName} ${className}` : baseClassName;
}

export type DataTableFrameProps = HTMLAttributes<HTMLDivElement> & {
  fillAvailableHeight?: boolean;
  responsiveMode?: "cards" | "scroll";
};

export function DataTableFrame({
  className,
  fillAvailableHeight = false,
  responsiveMode = "cards",
  ...props
}: DataTableFrameProps) {
  return (
    <div
      {...props}
      className={getClassName(styles.frame, className)}
      data-fill-available-height={fillAvailableHeight || undefined}
      data-responsive-mode={responsiveMode}
    />
  );
}

export type DataTableScrollProps = HTMLAttributes<HTMLDivElement>;

export function DataTableScroll({ className, ...props }: DataTableScrollProps) {
  return <div {...props} className={getClassName(styles.scroll, className)} />;
}

export type DataTableProps = TableHTMLAttributes<HTMLTableElement>;

export function DataTable({ className, ...props }: DataTableProps) {
  return <table {...props} className={getClassName(styles.table, className)} />;
}

export type DataTableLayoutProps = {
  ariaLabel: string;
  caption: string;
  children: ReactNode;
  columns: ReadonlyArray<{
    header: ReactNode;
    headerClassName?: string;
    id: string;
    isPinned?: boolean;
    isVisuallyHidden?: boolean;
    width?: number;
  }>;
  /** Pagination metadata. The layout renders the controls inside the table frame. */
  pagination?: ListPaginationProps;
  frameClassName?: string;
  /** Fills the height provided by a surrounding scrollable table area. */
  fillAvailableHeight?: boolean;
  overlay?: ReactNode;
  responsiveMode?: "cards" | "scroll";
  scrollClassName?: string;
  tableClassName?: string;
};

export type { ListPaginationProps } from "./list-pagination";

/** Renders the shared table frame, scroll area, column layout, and header. */
export function DataTableLayout({
  ariaLabel,
  caption,
  children,
  columns,
  pagination,
  frameClassName,
  fillAvailableHeight,
  overlay,
  responsiveMode,
  scrollClassName,
  tableClassName,
}: DataTableLayoutProps) {
  return (
    <DataTableFrame
      className={frameClassName}
      fillAvailableHeight={fillAvailableHeight}
      responsiveMode={responsiveMode}
    >
      {overlay}
      <DataTableScroll className={scrollClassName}>
        <DataTable aria-label={ariaLabel} className={tableClassName}>
          <colgroup>
            {columns.map((column) => (
              <col key={column.id} width={column.width} />
            ))}
          </colgroup>
          <DataTableCaption>{caption}</DataTableCaption>
          <DataTableHeader>
            <DataTableRow>
              {columns.map((column) => (
                <DataTableHeaderCell
                  className={column.headerClassName}
                  isPinned={column.isPinned}
                  key={column.id}
                  scope="col"
                >
                  {column.isVisuallyHidden ? (
                    <span className={styles.visuallyHidden}>
                      {column.header}
                    </span>
                  ) : (
                    column.header
                  )}
                </DataTableHeaderCell>
              ))}
            </DataTableRow>
          </DataTableHeader>
          <DataTableBody>{children}</DataTableBody>
        </DataTable>
      </DataTableScroll>
      {pagination ? (
        <div className={styles.pagination}>
          <ListPagination {...pagination} />
        </div>
      ) : null}
    </DataTableFrame>
  );
}

export type DataTableCaptionProps = HTMLAttributes<HTMLTableCaptionElement>;

export function DataTableCaption({
  className,
  ...props
}: DataTableCaptionProps) {
  return (
    <caption {...props} className={getClassName(styles.caption, className)} />
  );
}

export type DataTableHeaderProps = HTMLAttributes<HTMLTableSectionElement>;

export function DataTableHeader({ className, ...props }: DataTableHeaderProps) {
  return (
    <thead {...props} className={getClassName(styles.header, className)} />
  );
}

export type DataTableBodyProps = HTMLAttributes<HTMLTableSectionElement>;

export function DataTableBody({ className, ...props }: DataTableBodyProps) {
  return <tbody {...props} className={getClassName(styles.body, className)} />;
}

export type DataTableRowProps = HTMLAttributes<HTMLTableRowElement> & {
  /** Enables the shared mobile card shell; consumers define their cell layout. */
  mobileCard?: boolean;
};

type DataTableMobileCardSlot =
  | "actions"
  | "detail"
  | "primary"
  | "secondary"
  | "selection"
  | "supportingPrimary"
  | "supportingSecondary";

export function DataTableRow({
  className,
  mobileCard = false,
  ...props
}: DataTableRowProps) {
  return (
    <tr
      {...props}
      className={getClassName(styles.row, className)}
      data-mobile-card={mobileCard || undefined}
    />
  );
}

export type DataTableHeaderCellProps =
  ThHTMLAttributes<HTMLTableCellElement> & {
    isPinned?: boolean;
    mobileCardSlot?: DataTableMobileCardSlot;
  };

export function DataTableHeaderCell({
  className,
  isPinned,
  mobileCardSlot,
  scope,
  ...props
}: DataTableHeaderCellProps) {
  const isRowHeader = scope === "row";

  return (
    <th
      {...props}
      className={getClassName(
        isRowHeader ? styles.rowHeaderCell : styles.headerCell,
        className,
      )}
      data-pinned={isPinned ? "true" : undefined}
      data-mobile-card-slot={mobileCardSlot}
      scope={scope}
    />
  );
}

export type DataTableCellProps = TdHTMLAttributes<HTMLTableCellElement> & {
  mobileCardSlot?: DataTableMobileCardSlot;
};

export function DataTableCell({
  className,
  mobileCardSlot,
  ...props
}: DataTableCellProps) {
  return (
    <td
      {...props}
      className={getClassName(styles.cell, className)}
      data-mobile-card-slot={mobileCardSlot}
    />
  );
}
