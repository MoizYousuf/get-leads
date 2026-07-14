import type { Variants, Transition } from "framer-motion";

/** Shared spring used for card/row/list entrances across the app. */
export const springTransition: Transition = { type: "spring", stiffness: 300, damping: 24 };

/** Stagger wrapper for a grid/list of items (30-50ms per item per motion guidelines). */
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

/** Individual card/tile entrance to pair with containerVariants. */
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springTransition,
  },
};

/** Stagger wrapper for table bodies. */
export const tableContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
};

/** Individual table row entrance to pair with tableContainerVariants. */
export const tableRowVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 24 },
  },
};

/** Route-level page transition — subtle fade+rise, exit shorter than enter. */
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

/** Standard press feedback for tappable cards/buttons (scale 0.95-1.05 range). */
export const pressFeedback = {
  whileHover: { scale: 1.01 },
  whileTap: { scale: 0.97 },
};
