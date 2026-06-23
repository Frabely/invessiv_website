"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { KlarkompassEyebrow } from "@/references/klarkompass-coaching/components/klarkompass-eyebrow/klarkompass-eyebrow";
import {
  Reveal,
  RevealGroup,
} from "@/references/klarkompass-coaching/components/klarkompass-reveal/klarkompass-reveal";
import type { Locale } from "@/config/i18n";
import type { KlarkompassResultsContent } from "@/references/klarkompass-coaching/i18n/content";
import styles from "./results-section.module.css";

type ResultsSectionProps = KlarkompassResultsContent & {
  id: string;
  locale: Locale;
};

const COURSE_FIXES = [
  { x: 52, y: 250 },
  { x: 108, y: 196 },
  { x: 170, y: 150 },
  { x: 244, y: 86 },
];
const LEG_BEARINGS = ["047°", "052°", "039°"];
const WAYPOINT_INDICES = ["01", "02", "03"];
const GRATICULE = [50, 100, 150, 200, 250];
const ROUTE_D = COURSE_FIXES.map(
  (point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`,
).join(" ");

function legMidpoint(index: number): { x: number; y: number } {
  const a = COURSE_FIXES[index];
  const b = COURSE_FIXES[index + 1];
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function MiniFix({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <line className={styles.markCross} x1="2" x2="22" y1="12" y2="12" />
      <line className={styles.markCross} x1="12" x2="12" y1="2" y2="22" />
      <circle className={styles.markRing} cx="12" cy="12" r="7" />
      <circle className={styles.markDot} cx="12" cy="12" r="2.4" />
    </svg>
  );
}

function CourseChart() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 82%", "end 58%"],
  });
  const drawn = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });

  const startOpacity = useTransform(drawn, [0, 0.06], [0, 1]);
  const fix1Opacity = useTransform(drawn, [0.23, 0.33], [0, 1]);
  const fix2Opacity = useTransform(drawn, [0.53, 0.63], [0, 1]);
  const fix3Opacity = useTransform(drawn, [0.9, 1], [0, 1]);
  const fixOpacities = [startOpacity, fix1Opacity, fix2Opacity, fix3Opacity];

  return (
    <div aria-hidden="true" className={styles.chart} ref={ref}>
      <svg className={styles.chartSvg} viewBox="0 0 300 300">
        <rect
          className={styles.frame}
          height="284"
          rx="6"
          width="284"
          x="8"
          y="8"
        />

        <g className={styles.graticule}>
          {GRATICULE.map((value) => (
            <line key={`v${value}`} x1={value} x2={value} y1="8" y2="292" />
          ))}
          {GRATICULE.map((value) => (
            <line key={`h${value}`} x1="8" x2="292" y1={value} y2={value} />
          ))}
        </g>

        <g className={styles.rose} transform="translate(54 58)">
          <circle className={styles.roseRing} cx="0" cy="0" r="24" />
          <g transform="scale(0.3) translate(-100 -100)">
            <path
              className={styles.roseStar}
              d="M100 30 L107 93 L170 100 L107 107 L100 170 L93 107 L30 100 L93 93 Z"
            />
          </g>
          <text className={styles.roseN} textAnchor="middle" x="0" y="-29">
            N
          </text>
        </g>

        <path className={styles.routePlan} d={ROUTE_D} />
        <motion.path
          className={styles.routeDrawn}
          d={ROUTE_D}
          style={{ pathLength: reduce ? 1 : drawn }}
        />

        {LEG_BEARINGS.map((bearing, index) => {
          const mid = legMidpoint(index);
          return (
            <text
              className={styles.legBearing}
              key={bearing}
              x={mid.x + 7}
              y={mid.y + 11}
            >
              {bearing}
            </text>
          );
        })}

        {COURSE_FIXES.map((point, index) => {
          const isStart = index === 0;
          const isDest = index === COURSE_FIXES.length - 1;
          const markClass = isStart
            ? styles.markStart
            : isDest
              ? styles.markDest
              : styles.markFix;

          return (
            <motion.g
              className={markClass}
              key={`${point.x}-${point.y}`}
              style={{ opacity: reduce ? 1 : fixOpacities[index] }}
            >
              {isStart ? null : (
                <>
                  <line
                    className={styles.markCross}
                    x1={point.x - 9}
                    x2={point.x + 9}
                    y1={point.y}
                    y2={point.y}
                  />
                  <line
                    className={styles.markCross}
                    x1={point.x}
                    x2={point.x}
                    y1={point.y - 9}
                    y2={point.y + 9}
                  />
                </>
              )}
              {isDest ? (
                <circle
                  className={styles.markOuter}
                  cx={point.x}
                  cy={point.y}
                  r="9.5"
                />
              ) : null}
              <circle
                className={styles.markRing}
                cx={point.x}
                cy={point.y}
                r={isStart ? 5 : 5.5}
              />
              <circle
                className={styles.markDot}
                cx={point.x}
                cy={point.y}
                r="1.9"
              />
              {isStart ? null : (
                <text
                  className={styles.markIndex}
                  textAnchor="end"
                  x={point.x - 12}
                  y={point.y - 11}
                >
                  {WAYPOINT_INDICES[index - 1]}
                </text>
              )}
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}

export function ResultsSection({
  destinationTag,
  eyebrow,
  id,
  items,
  lead,
  startLabel,
  title,
}: ResultsSectionProps) {
  return (
    <RevealGroup as="section" className={styles.section} id={id}>
      <Reveal as="div" className={styles.head}>
        <KlarkompassEyebrow>{eyebrow}</KlarkompassEyebrow>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.lead}>{lead}</p>
      </Reveal>

      <div className={styles.body}>
        <Reveal as="div" className={styles.chartCol}>
          <CourseChart />
        </Reveal>

        <div className={styles.plot}>
          <p className={styles.startCue}>
            <span aria-hidden="true" className={styles.startCueDot} />
            {startLabel}
          </p>

          <ul className={styles.waypoints}>
            {items.map((item, index) => {
              const isDest = index === items.length - 1;
              return (
                <Reveal
                  as="li"
                  className={`${styles.card} ${isDest ? styles.cardDest : ""}`.trim()}
                  key={item.title}
                >
                  <div className={styles.cardHead}>
                    <span aria-hidden="true" className={styles.fixBadge}>
                      <MiniFix
                        className={isDest ? styles.miniFixDest : styles.miniFix}
                      />
                    </span>
                    <span className={styles.cardIndex}>
                      {WAYPOINT_INDICES[index]}
                    </span>
                    <span className={styles.cardBearing}>
                      {LEG_BEARINGS[index]}
                    </span>
                    {isDest ? (
                      <span className={styles.destTag}>{destinationTag}</span>
                    ) : null}
                  </div>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  <p className={styles.cardText}>{item.description}</p>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </div>
    </RevealGroup>
  );
}
