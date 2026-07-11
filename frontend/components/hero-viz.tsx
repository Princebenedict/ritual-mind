"use client";

import Image from "next/image";
import {motion, useReducedMotion} from "framer-motion";

/**
 * Hero visualization, light theme. Three thin concentric rings with small glowing dots.
 * The middle and outer ring groups counter rotate slowly. Behind the center the Ritual
 * logo sits perfectly still and sharp over a soft emerald teal bloom that breathes, so it
 * reads as lit from within. All motion is subtle and respects reduced motion.
 */

const TEAL = "#256E60";
const CYAN = "#2C7E8C";
const BLUE = "#2F6DA6";

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function polar(radius: number, angleDeg: number): {x: number; y: number} {
  const a = (angleDeg * Math.PI) / 180;
  return {x: round(200 + Math.cos(a) * radius), y: round(200 + Math.sin(a) * radius)};
}

function TwinkleDot({
  radius,
  angle,
  color,
  r = 3.4,
  delay = 0,
  reduce,
}: {
  radius: number;
  angle: number;
  color: string;
  r?: number;
  delay?: number;
  reduce: boolean;
}) {
  const {x, y} = polar(radius, angle);
  return (
    <motion.circle
      cx={x}
      cy={y}
      r={r}
      fill={color}
      style={{filter: `drop-shadow(0 0 4px ${color})`}}
      animate={reduce ? undefined : {opacity: [0.55, 1, 0.55]}}
      transition={{duration: 4, delay, ease: "easeInOut", repeat: Infinity}}
    />
  );
}

export function HeroViz() {
  const reduce = useReducedMotion() ?? false;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      {/* Faint ambient glow behind the whole cluster. */}
      <div className="pointer-events-none absolute inset-16 rounded-full bg-[#9ED9CE]/25 blur-3xl" />

      <svg viewBox="0 0 400 400" className="relative h-full w-full overflow-visible">
        {/* Inner ring, still. */}
        <circle cx="200" cy="200" r="62" fill="none" stroke={CYAN} strokeOpacity="0.5" strokeWidth="1.2" />
        <TwinkleDot radius={62} angle={35} color={TEAL} reduce={reduce} delay={0.2} />
        <TwinkleDot radius={62} angle={215} color={CYAN} r={2.6} reduce={reduce} delay={1.4} />

        {/* Middle ring group. Rotates counter clockwise, about sixty seconds. */}
        <motion.g
          animate={reduce ? undefined : {rotate: -360}}
          transition={{duration: 60, ease: "linear", repeat: Infinity}}
          style={{transformOrigin: "200px 200px"}}
        >
          <circle cx="200" cy="200" r="98" fill="none" stroke={TEAL} strokeOpacity="0.55" strokeWidth="1.2" />
          <TwinkleDot radius={98} angle={305} color={CYAN} reduce={reduce} delay={0.6} />
          <TwinkleDot radius={98} angle={130} color={TEAL} r={2.6} reduce={reduce} delay={1.9} />
          <TwinkleDot radius={98} angle={20} color={TEAL} r={2.6} reduce={reduce} delay={2.7} />
        </motion.g>

        {/* Outer ring group. Rotates clockwise, about forty seconds. */}
        <motion.g
          animate={reduce ? undefined : {rotate: 360}}
          transition={{duration: 40, ease: "linear", repeat: Infinity}}
          style={{transformOrigin: "200px 200px"}}
        >
          <circle cx="200" cy="200" r="158" fill="none" stroke={BLUE} strokeOpacity="0.45" strokeWidth="1.2" />
          <TwinkleDot radius={158} angle={0} color={TEAL} reduce={reduce} delay={0.9} />
          <TwinkleDot radius={158} angle={90} color={CYAN} reduce={reduce} delay={2.1} />
          <TwinkleDot radius={158} angle={180} color={BLUE} r={2.6} reduce={reduce} delay={1.2} />
          <TwinkleDot radius={158} angle={270} color={TEAL} reduce={reduce} delay={3.0} />
        </motion.g>
      </svg>

      {/* Center. The logo stays perfectly still and sharp while everything orbits. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          {/* Emerald teal bloom, breathing, directly behind the logo. */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute rounded-full"
            style={{
              width: 176,
              height: 176,
              background: "radial-gradient(circle, rgba(52,211,153,0.28) 0%, rgba(37,110,96,0.13) 42%, transparent 74%)",
              filter: "blur(34px)",
            }}
            animate={reduce ? undefined : {opacity: [0.4, 0.68, 0.4], scale: [0.94, 1.05, 0.94]}}
            transition={{duration: 4, ease: "easeInOut", repeat: Infinity}}
          />
          <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] shadow-soft-lg">
            <Image
              src="/ritual-logo.png"
              alt="Ritual"
              width={68}
              height={68}
              priority
              quality={100}
              className="block h-[68px] w-[68px] select-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
