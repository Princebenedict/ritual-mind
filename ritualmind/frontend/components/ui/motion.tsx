"use client";

import {type ReactNode, useEffect, useRef, useState} from "react";
import {animate, motion, useInView, useReducedMotion} from "framer-motion";
import {cn} from "@/lib/utils";

/** Fade and settle a section upward when it enters the viewport. Once per mount. */
export function Reveal({children, delay = 0, className}: {children: ReactNode; delay?: number; className?: string}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, {once: true, margin: "-80px"});
  const reduce = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      initial={reduce ? false : {opacity: 0, y: 16}}
      animate={inView ? {opacity: 1, y: 0} : undefined}
      transition={{duration: 0.5, delay, ease: [0.16, 1, 0.3, 1]}}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** A monospace counter that eases from zero to its value on mount. */
export function Counter({
  value,
  className,
  format = (n: number) => Math.round(n).toLocaleString("en-US"),
  duration = 0.9,
}: {
  value: number;
  className?: string;
  format?: (n: number) => string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
  }, [value, duration, reduce]);
  return <span className={cn("tabular font-mono", className)}>{format(display)}</span>;
}
