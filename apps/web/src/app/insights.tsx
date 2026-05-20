"use client";

import { usePathname } from "next/navigation";
import { SpeedInsights } from "@vercel/speed-insights/react";

export function Insights() {
  const pathname = usePathname();
  return <SpeedInsights route={pathname} />;
}
