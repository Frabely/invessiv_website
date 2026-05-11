type ColumnPillGroupClassNames = {
  group: string;
  label: string;
  pills: string;
  pill: string;
};

type ColumnPillGroupProps = {
  columns: string[];
  classNames: ColumnPillGroupClassNames;
  label: string;
};

export function ColumnPillGroup({
  columns,
  classNames,
  label,
}: ColumnPillGroupProps) {
  if (columns.length === 0) return null;

  return (
    <div className={classNames.group}>
      <p className={classNames.label}>{label}</p>
      <div className={classNames.pills}>
        {columns.map((col) => (
          <span className={classNames.pill} key={col}>
            {col}
          </span>
        ))}
      </div>
    </div>
  );
}
