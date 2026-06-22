"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { KlarkompassEyebrow } from "@/references/klarkompass-coaching/components/klarkompass-eyebrow/klarkompass-eyebrow";
import {
  Reveal,
  RevealGroup,
} from "@/references/klarkompass-coaching/components/klarkompass-reveal/klarkompass-reveal";
import type { Locale } from "@/config/i18n";
import type { KlarkompassProblemContent } from "@/references/klarkompass-coaching/i18n/content";
import styles from "./problem-section.module.css";

type ProblemSectionProps = KlarkompassProblemContent & {
  id: string;
  locale: Locale;
};

const POINT_HEADINGS = [312, 174, 81, 237];
const CYCLE_MS = 2400;
const CARDINALS = [
  { label: "N", heading: 0 },
  { label: "E", heading: 90 },
  { label: "S", heading: 180 },
  { label: "W", heading: 270 },
];
const TICKS = Array.from({ length: 60 }, (_, i) => ({
  heading: i * 6,
  major: i % 5 === 0,
}));

function headingFor(index: number): number {
  return POINT_HEADINGS[index % POINT_HEADINGS.length];
}

function formatHeading(heading: number): string {
  const normalized = ((Math.round(heading) % 360) + 360) % 360;
  return `${String(normalized).padStart(3, "0")}°`;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function onRing(radius: number, heading: number): { x: number; y: number } {
  const radians = (heading * Math.PI) / 180;
  return {
    x: round(100 + radius * Math.sin(radians)),
    y: round(100 - radius * Math.cos(radians)),
  };
}

function CompassInstrument({ activeIndex }: { activeIndex: number }) {
  const reduce = useReducedMotion();
  const activeHeading = headingFor(activeIndex);

  const rotation = useMotionValue(activeHeading);
  const needleRotation = useSpring(rotation, {
    stiffness: 46,
    damping: 11,
    mass: 1.1,
  });
  const unwrappedRef = useRef(activeHeading);

  useEffect(() => {
    if (reduce) {
      return;
    }
    const current = unwrappedRef.current;
    const delta = ((((activeHeading - current) % 360) + 540) % 360) - 180;
    unwrappedRef.current = current + delta;
    rotation.set(unwrappedRef.current);
  }, [activeHeading, reduce, rotation]);

  return (
    <div aria-hidden="true" className={styles.instrumentWrap}>
      <svg className={styles.compass} viewBox="0 0 200 200">
        <circle className={styles.face} cx="100" cy="100" r="92" />
        <circle className={styles.ring} cx="100" cy="100" r="92" />
        <circle className={styles.ringInner} cx="100" cy="100" r="58" />

        <g>
          {TICKS.map((tick) => {
            const outer = onRing(92, tick.heading);
            const inner = onRing(tick.major ? 81 : 86, tick.heading);
            return (
              <line
                className={tick.major ? styles.tickMajor : styles.tickMinor}
                key={tick.heading}
                x1={outer.x}
                x2={inner.x}
                y1={outer.y}
                y2={inner.y}
              />
            );
          })}
        </g>

        {CARDINALS.map((cardinal) => {
          const point = onRing(70, cardinal.heading);
          return (
            <text
              className={styles.cardinal}
              dominantBaseline="central"
              key={cardinal.label}
              textAnchor="middle"
              x={point.x}
              y={point.y}
            >
              {cardinal.label}
            </text>
          );
        })}

        <path
          className={styles.star}
          d="M100 30 L107 93 L170 100 L107 107 L100 170 L93 107 L30 100 L93 93 Z"
        />

        {POINT_HEADINGS.map((heading, index) => {
          const point = onRing(92, heading);
          const isActive = index === activeIndex;
          return (
            <g key={heading}>
              {isActive ? (
                <circle
                  className={styles.nodeGlow}
                  cx={point.x}
                  cy={point.y}
                  r="9"
                />
              ) : null}
              <circle
                className={isActive ? styles.nodeActive : styles.node}
                cx={point.x}
                cy={point.y}
                r={isActive ? 5 : 3.4}
              />
            </g>
          );
        })}

        <motion.g
          className={styles.needle}
          style={{ rotate: reduce ? activeHeading : needleRotation }}
        >
          <path
            className={styles.needleNorth}
            d="M100 42 L104.5 100 L95.5 100 Z"
          />
          <path
            className={styles.needleSouth}
            d="M100 158 L104.5 100 L95.5 100 Z"
          />
        </motion.g>

        <circle className={styles.hub} cx="100" cy="100" r="7" />
        <circle className={styles.hubDot} cx="100" cy="100" r="2.5" />
      </svg>

      <span className={styles.readout}>
        <span className={styles.readoutLabel} />
        <span className={styles.readoutValue}>
          {formatHeading(activeHeading)}
        </span>
      </span>
    </div>
  );
}

function MiniBearing({ heading }: { heading: number }) {
  return (
    <svg aria-hidden="true" className={styles.miniCompass} viewBox="0 0 64 64">
      <circle className={styles.miniDial} cx="32" cy="32" r="26" />
      <g className={styles.miniTicks}>
        <line x1="32" x2="32" y1="7" y2="13" />
        <line x1="32" x2="32" y1="51" y2="57" />
        <line x1="7" x2="13" y1="32" y2="32" />
        <line x1="51" x2="57" y1="32" y2="32" />
      </g>
      <g transform={`rotate(${heading} 32 32)`}>
        <path
          className={styles.miniNeedleNorth}
          d="M32 12 L35.4 33 L28.6 33 Z"
        />
        <path
          className={styles.miniNeedleSouth}
          d="M32 52 L35.4 33 L28.6 33 Z"
        />
      </g>
      <circle className={styles.miniHub} cx="32" cy="32" r="2.6" />
    </svg>
  );
}

export function ProblemSection({
  eyebrow,
  id,
  intro,
  points,
  title,
}: ProblemSectionProps) {
  const reduce = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    if (reduce) {
      return;
    }
    const timer = setInterval(() => {
      if (pausedRef.current) {
        return;
      }
      setActiveIndex((current) => (current + 1) % points.length);
    }, CYCLE_MS);
    return () => clearInterval(timer);
  }, [reduce, points.length]);

  return (
    <RevealGroup as="section" className={styles.section} id={id}>
      <Reveal as="div" className={styles.head}>
        <KlarkompassEyebrow>{eyebrow}</KlarkompassEyebrow>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.lead}>{intro}</p>
      </Reveal>

      <div className={styles.body}>
        <Reveal as="div">
          <CompassInstrument activeIndex={activeIndex} />
        </Reveal>

        <ul className={styles.points}>
          {points.map((point, index) => {
            const heading = headingFor(index);
            const isActive = index === activeIndex;

            return (
              <Reveal
                as="li"
                className={`${styles.point} ${isActive ? styles.pointActive : ""}`.trim()}
                key={point}
                onMouseEnter={() => {
                  pausedRef.current = true;
                  setActiveIndex(index);
                }}
                onMouseLeave={() => {
                  pausedRef.current = false;
                }}
              >
                <span className={styles.gauge}>
                  <MiniBearing heading={heading} />
                  <span className={styles.degree}>
                    {String(heading).padStart(3, "0")}°
                  </span>
                </span>
                <p className={styles.pointText}>{point}</p>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </RevealGroup>
  );
}
