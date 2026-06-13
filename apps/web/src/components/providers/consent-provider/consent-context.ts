import { createContext } from "react";
import type { ConsentContextValue } from "@/common/contracts/consent/consent-context-value";

export const ConsentContext = createContext<ConsentContextValue | null>(null);
