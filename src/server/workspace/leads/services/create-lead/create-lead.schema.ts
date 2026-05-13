import { z } from "zod";
import { leadSchema } from "@/server/workspace/leads/shared/lead-schema";

export const createLeadSchema = z.object(leadSchema);
