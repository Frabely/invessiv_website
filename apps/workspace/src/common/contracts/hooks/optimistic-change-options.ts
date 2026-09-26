import type { OptimisticChangeItem } from "./optimistic-change-item";

export type OptimisticChangeOptions<
  TValue,
  TItem extends OptimisticChangeItem,
> = {
  valueOf: (item: TItem) => TValue;
  submit: (item: TItem, value: TValue) => Promise<{ ok: boolean }>;
  announce: {
    success: (item: TItem, value: TValue) => string;
    failure: (item: TItem) => string;
  };
  onSettled?: () => void;
};
