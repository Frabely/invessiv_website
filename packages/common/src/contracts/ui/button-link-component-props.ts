import type { AnchorHTMLAttributes, ReactNode, Ref } from "react";

/** Props a framework link (e.g. Next.js `Link`) receives when a button link renders through it. */
export type ButtonLinkComponentProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "children" | "className"
> & {
  children: ReactNode;
  className?: string;
  href: string;
  ref?: Ref<HTMLAnchorElement>;
};
