import { useRef, useState } from "react";
import type { OptimisticChangeItem } from "@/common/contracts/hooks/optimistic-change-item";
import type { OptimisticChangeOptions } from "@/common/contracts/hooks/optimistic-change-options";

export function useOptimisticChange<
  TValue,
  TItem extends OptimisticChangeItem,
>({
  valueOf: sourceValueOf,
  submit,
  announce,
  onSettled,
}: OptimisticChangeOptions<TValue, TItem>) {
  const [announcement, setAnnouncement] = useState("");
  const [picked, setPicked] = useState<
    Record<string, { baseVersion: number; value: TValue }>
  >({});
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());
  const pendingRef = useRef(new Set<string>());

  function valueOf(item: TItem): TValue {
    const pick = picked[item.id];
    return pick && pick.baseVersion === item.version
      ? pick.value
      : sourceValueOf(item);
  }

  async function change(item: TItem, value: TValue) {
    if (pendingRef.current.has(item.id) || Object.is(value, valueOf(item)))
      return;
    pendingRef.current.add(item.id);
    setPendingIds(new Set(pendingRef.current));
    setPicked((current) => ({
      ...current,
      [item.id]: { baseVersion: item.version, value },
    }));

    try {
      const result = await submit(item, value);
      if (result.ok) {
        setAnnouncement(announce.success(item, value));
      } else {
        setPicked((current) => {
          const next = { ...current };
          delete next[item.id];
          return next;
        });
        setAnnouncement(announce.failure(item));
      }
    } catch {
      setPicked((current) => {
        const next = { ...current };
        delete next[item.id];
        return next;
      });
      setAnnouncement(announce.failure(item));
    } finally {
      pendingRef.current.delete(item.id);
      setPendingIds(new Set(pendingRef.current));
      onSettled?.();
    }
  }

  return {
    announcement,
    valueOf,
    change,
    isPending: (id: string) => pendingIds.has(id),
  };
}
