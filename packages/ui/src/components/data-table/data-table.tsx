import type {
  HTMLAttributes,
  ReactNode,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import styles from "./data-table.module.css";

function getClassName(baseClassName: string, className?: string) {
  return className ? `${baseClassName} ${className}` : baseClassName;
}

export type DataTableFrameProps = HTMLAttributes<HTMLDivElement> & {
  responsiveMode?: "cards" | "scroll";
};

export function DataTableFrame({
  className,
  responsiveMode = "cards",
  ...props
}: DataTableFrameProps) {
  return (
    <div
      {...props}
      className={getClassName(styles.frame, className)}
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
  frameClassName?: string;
  overlay?: ReactNode;
  responsiveMode?: "cards" | "scroll";
  scrollClassName?: string;
  tableClassName?: string;
};

/** Renders the shared table frame, scroll area, column layout, and header. */
export function DataTableLayout({
  ariaLabel,
  caption,
  children,
  columns,
  frameClassName,
  overlay,
  responsiveMode,
  scrollClassName,
  tableClassName,
}: DataTableLayoutProps) {
  return (
    <DataTableFrame className={frameClassName} responsiveMode={responsiveMode}>
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

export type DataTableRowProps = HTMLAttributes<HTMLTableRowElement>;

export function DataTableRow({ className, ...props }: DataTableRowProps) {
  return <tr {...props} className={getClassName(styles.row, className)} />;
}

export type DataTableHeaderCellProps =
  ThHTMLAttributes<HTMLTableCellElement> & {
    isPinned?: boolean;
  };

export function DataTableHeaderCell({
  className,
  isPinned,
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
      scope={scope}
    />
  );
}

export type DataTableCellProps = TdHTMLAttributes<HTMLTableCellElement>;

export function DataTableCell({ className, ...props }: DataTableCellProps) {
  return <td {...props} className={getClassName(styles.cell, className)} />;
}
