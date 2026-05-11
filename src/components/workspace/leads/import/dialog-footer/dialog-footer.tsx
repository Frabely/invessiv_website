type DialogFooterAction = {
  label: string;
  onClick: () => void;
  className: string;
  disabled?: boolean;
};

type DialogFooterProps = {
  actions: DialogFooterAction[];
  className: string;
};

export function DialogFooter({ actions, className }: DialogFooterProps) {
  return (
    <footer className={className}>
      {actions.map((action) => (
        <button
          key={action.label}
          className={action.className}
          disabled={action.disabled}
          onClick={action.onClick}
          type="button"
        >
          {action.label}
        </button>
      ))}
    </footer>
  );
}
