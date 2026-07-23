"use client";

import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useMergeRefs,
} from "@floating-ui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { TriState } from "@invessiv/common/constants/filters/tri-state";
import type {
  CustomMultiSelectOption,
  CustomSelectOption,
} from "@invessiv/common/contracts/ui/custom-select-option";
import styles from "./custom-select.module.css";

type SingleSelectProps<TValue extends string> = {
  multiple?: false;
  ariaLabel?: string;
  clearLabel?: string;
  describedBy?: string;
  id: string;
  invalid?: boolean;
  onClear?: () => void;
  options: readonly CustomSelectOption<TValue>[];
  value: TValue;
  onChange: (next: TValue) => void;
};

type MultiSelectProps<TValue extends string> = {
  multiple: true;
  ariaLabel?: string;
  clearLabel?: string;
  describedBy?: string;
  id: string;
  invalid?: boolean;
  onClear?: () => void;
  triggerLabel: string;
  options: readonly CustomMultiSelectOption<TValue>[];
  onToggleOption: (value: TValue) => void;
};

type CustomSelectProps<TValue extends string = string> =
  SingleSelectProps<TValue> | MultiSelectProps<TValue>;

const STATE_ICON: Partial<Record<TriState, IconDefinition>> = {
  [TriState.Include]: faCheck,
  [TriState.Exclude]: faXmark,
};

const MAX_LIST_BOX_HEIGHT = 256;
const MIN_LIST_BOX_HEIGHT = 120;

export function CustomSelect<TValue extends string = string>(
  props: CustomSelectProps<TValue>,
) {
  const {
    ariaLabel,
    clearLabel,
    describedBy,
    id,
    invalid = false,
    onClear,
  } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const pendingFocusIndexRef = useRef<number | null>(null);
  const listBoxId = `${id}-listbox`;

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (!open) {
      setActiveIndex(null);
      pendingFocusIndexRef.current = null;
      return;
    }
    if (!props.multiple) {
      const nextIndex = Math.max(
        props.options.findIndex((option) => option.value === props.value),
        0,
      );
      setActiveIndex(nextIndex);
      pendingFocusIndexRef.current = nextIndex;
    }
  }

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: handleOpenChange,
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(6),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      size({
        padding: 8,
        apply({ availableHeight, elements, rects }) {
          elements.floating.style.maxHeight = `${Math.max(
            MIN_LIST_BOX_HEIGHT,
            Math.min(availableHeight, MAX_LIST_BOX_HEIGHT),
          )}px`;
          elements.floating.style.minWidth = `${rects.reference.width}px`;
        },
      }),
    ],
  });

  const click = useClick(context, { keyboardHandlers: false });
  const dismiss = useDismiss(context, { outsidePress: true });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
  ]);
  const setTriggerRef = useMergeRefs([refs.setReference, triggerRef]);
  const setFloatingRef = useMergeRefs([refs.setFloating]);

  useEffect(() => {
    if (isOpen && activeIndex !== null) {
      optionRefs.current[activeIndex]?.focus({ preventScroll: true });
    }
  }, [activeIndex, isOpen]);

  const clearButton =
    onClear && clearLabel ? (
      <button
        aria-label={clearLabel}
        className={styles.clearButton}
        onClick={(event) => {
          event.stopPropagation();
          onClear();
        }}
        title={clearLabel}
        type="button"
      >
        <span aria-hidden="true">×</span>
      </button>
    ) : null;

  if (props.multiple) {
    const { options, onToggleOption, triggerLabel } = props;
    const activeOptions = options.filter(
      (option) => option.state !== TriState.Off,
    );

    return (
      <div className={styles.root}>
        <button
          {...getReferenceProps()}
          aria-controls={listBoxId}
          aria-describedby={describedBy}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={ariaLabel}
          className={styles.trigger}
          data-clearable={clearButton ? true : undefined}
          data-invalid={invalid || undefined}
          id={id}
          ref={setTriggerRef}
          type="button"
        >
          <span className={styles.triggerText}>
            {activeOptions.length > 0 ? (
              <span className={styles.badges}>
                {activeOptions.map((option) => (
                  <span
                    className={styles.badge}
                    data-state={option.state}
                    key={option.value}
                  >
                    {option.leading ? (
                      <span className={styles.badgeLeading}>
                        {option.leading}
                      </span>
                    ) : (
                      <span className={styles.badgeLabel}>{option.label}</span>
                    )}
                  </span>
                ))}
              </span>
            ) : (
              <span className={styles.triggerLabel}>{triggerLabel}</span>
            )}
          </span>
          <span aria-hidden="true" className={styles.chevron}>
            v
          </span>
        </button>

        {clearButton}

        {isOpen ? (
          <FloatingPortal>
            <div
              {...getFloatingProps()}
              className={styles.listBox}
              id={listBoxId}
              ref={setFloatingRef}
              role="group"
              style={floatingStyles}
            >
              {options.map((option) => {
                const stateIcon = STATE_ICON[option.state];

                return (
                  <button
                    aria-label={option.ariaLabel}
                    className={styles.option}
                    data-has-leading={Boolean(option.leading) || undefined}
                    data-state={option.state}
                    key={option.value}
                    onClick={() => onToggleOption(option.value)}
                    type="button"
                  >
                    {option.leading ? (
                      <span className={styles.leading}>{option.leading}</span>
                    ) : null}
                    <span className={styles.optionText}>
                      <span className={styles.optionLabel}>{option.label}</span>
                    </span>
                    <span aria-hidden="true" className={styles.indicator}>
                      {stateIcon ? <FontAwesomeIcon icon={stateIcon} /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </FloatingPortal>
        ) : null}
      </div>
    );
  }

  const { options, value, onChange } = props;
  const selected =
    options.find((option) => option.value === value) ?? options[0];
  const hasSelectedLeading = Boolean(selected?.leading);

  function handleSingleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const selectedIndex = Math.max(
      options.findIndex((option) => option.value === value),
      0,
    );

    if (
      event.key === "ArrowDown" ||
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      setActiveIndex(selectedIndex);
      pendingFocusIndexRef.current = selectedIndex;
      setIsOpen(true);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(options.length - 1);
      pendingFocusIndexRef.current = options.length - 1;
      setIsOpen(true);
    }
  }

  function handleSingleOptionKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number | undefined;
    if (event.key === "ArrowDown") {
      nextIndex = (index + 1) % options.length;
    } else if (event.key === "ArrowUp") {
      nextIndex = (index - 1 + options.length) % options.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = options.length - 1;
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus({ preventScroll: true });
      return;
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = options[index];
      if (option) {
        onChange(option.value);
      }
      setIsOpen(false);
      triggerRef.current?.focus({ preventScroll: true });
      return;
    }

    if (nextIndex !== undefined) {
      event.preventDefault();
      setActiveIndex(nextIndex);
    }
  }

  return (
    <div className={styles.root}>
      <button
        {...getReferenceProps()}
        aria-controls={listBoxId}
        aria-describedby={describedBy}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={styles.trigger}
        data-clearable={clearButton ? true : undefined}
        data-has-leading={hasSelectedLeading || undefined}
        data-invalid={invalid || undefined}
        id={id}
        onKeyDown={handleSingleTriggerKeyDown}
        ref={setTriggerRef}
        type="button"
      >
        {selected?.leading ? (
          <span className={styles.leading}>{selected.leading}</span>
        ) : null}
        <span className={styles.triggerText}>
          <span className={styles.triggerLabel}>{selected?.label}</span>
          {selected?.description ? (
            <span className={styles.triggerDescription}>
              {selected.description}
            </span>
          ) : null}
        </span>
        <span aria-hidden="true" className={styles.chevron}>
          v
        </span>
      </button>

      {clearButton}

      {isOpen ? (
        <FloatingPortal>
          <div
            {...getFloatingProps()}
            className={styles.listBox}
            id={listBoxId}
            ref={setFloatingRef}
            role="listbox"
            style={floatingStyles}
          >
            {options.map((option, index) => (
              <button
                aria-label={option.ariaLabel}
                aria-selected={value === option.value}
                className={styles.option}
                data-has-leading={Boolean(option.leading) || undefined}
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                  triggerRef.current?.focus({ preventScroll: true });
                }}
                onKeyDown={(event) => handleSingleOptionKeyDown(event, index)}
                ref={(element) => {
                  optionRefs.current[index] = element;
                  if (element && pendingFocusIndexRef.current === index) {
                    pendingFocusIndexRef.current = null;
                    element.focus({ preventScroll: true });
                  }
                }}
                role="option"
                type="button"
              >
                {option.leading ? (
                  <span className={styles.leading}>{option.leading}</span>
                ) : null}
                <span className={styles.optionText}>
                  <span className={styles.optionLabel}>{option.label}</span>
                  {option.description ? (
                    <span className={styles.optionDescription}>
                      {option.description}
                    </span>
                  ) : null}
                </span>
              </button>
            ))}
          </div>
        </FloatingPortal>
      ) : null}
    </div>
  );
}
