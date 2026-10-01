import "server-only";

import type { z } from "zod";

import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { QuestionnaireBlocksConstraintName } from "@invessiv/db/constraint-names/crm/questionnaire-blocks-constraint-names";
import { QuestionnaireFieldsConstraintName } from "@invessiv/db/constraint-names/crm/questionnaire-fields-constraint-names";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
  PostgresErrorCode,
} from "@invessiv/db/core";
import { postgresErrorService } from "@/server/workspace/shared/services/postgres-error-service";

const KEY_CONSTRAINTS: readonly string[] = [
  QuestionnaireBlocksConstraintName.CatalogKeyUnique,
  QuestionnaireFieldsConstraintName.BlockKeyUnique,
];

type KeyTaken = {
  ok: false;
  code: typeof QuestionnaireErrorCode.KeyTaken;
};

type Parsed<TSchema extends z.ZodType> =
  | { ok: true; data: z.output<TSchema> }
  | {
      ok: false;
      result: {
        ok: false;
        code: typeof QuestionnaireErrorCode.ValidationError;
        errors: z.ZodError["issues"];
      };
    };

function parse<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown,
): Parsed<TSchema> {
  const parsed = schema.safeParse(input);
  return parsed.success
    ? { ok: true, data: parsed.data }
    : {
        ok: false,
        result: {
          ok: false,
          code: QuestionnaireErrorCode.ValidationError,
          errors: parsed.error.issues,
        },
      };
}

/**
 * Runs a command in one transaction. The key checks before a write keep the common case
 * friendly; a parallel write that takes the same key in between still ends as `KEY_TAKEN`.
 * The result type is the caller's: form commands answer with their own, wider result.
 */
async function run<TResult>(
  command: (tx: ContactDatabaseTransaction) => Promise<TResult>,
): Promise<TResult | KeyTaken> {
  try {
    return await getDrizzleDatabaseClient().transaction(command);
  } catch (error: unknown) {
    const constraint = postgresErrorService.getViolatedConstraint(
      error,
      PostgresErrorCode.UniqueViolation,
    );
    if (!constraint || !KEY_CONSTRAINTS.includes(constraint)) throw error;
    return {
      ok: false,
      code: QuestionnaireErrorCode.KeyTaken,
    };
  }
}

export const questionnaireCommandSupport = { parse, run } as const;
