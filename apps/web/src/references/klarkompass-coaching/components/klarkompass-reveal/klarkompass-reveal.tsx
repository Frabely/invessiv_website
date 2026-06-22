"use client";

import type { ReactNode } from "react";
import {
  type HTMLMotionProps,
  motion,
  useReducedMotion,
  type Variants,
} from "motion/react";

const MOTION_TAGS = {
  section: motion.section,
  div: motion.div,
  ul: motion.ul,
  ol: motion.ol,
  li: motion.li,
} as const;

type MotionTag = keyof typeof MOTION_TAGS;

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const staticVariants: Variants = {
  hidden: { opacity: 1, y: 0 },
  show: { opacity: 1, y: 0 },
};

type RevealProps = {
  as?: MotionTag;
  children: ReactNode;
} & Omit<HTMLMotionProps<"div">, "children">;

/**
 * Container that triggers a staggered reveal of its <Reveal> children once it
 * enters the viewport. Replaces useStaggeredSectionReveal within the KlarKompass
 * demo scope.
 */
export function RevealGroup({ as = "div", children, ...rest }: RevealProps) {
  const reduce = useReducedMotion();
  const Comp = MOTION_TAGS[as] as typeof motion.div;

  return (
    <Comp
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      variants={reduce ? staticVariants : containerVariants}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/** Single reveal item. Inherits the show/hidden state from its RevealGroup. */
export function Reveal({ as = "div", children, ...rest }: RevealProps) {
  const reduce = useReducedMotion();
  const Comp = MOTION_TAGS[as] as typeof motion.div;

  return (
    <Comp variants={reduce ? staticVariants : itemVariants} {...rest}>
      {children}
    </Comp>
  );
}
