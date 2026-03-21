import "server-only";
import { getServerEnv } from "@/server/config/env";
import type {
  MailMessage,
  MailProvider,
} from "@/server/services/mail/mail-provider";
import { ResendMailProvider } from "@/server/services/mail/providers/resend-provider";

function resolveMailProvider(): MailProvider | null {
  const env = getServerEnv();

  if (
    env.contactMailProvider === "resend" &&
    env.contactMailFrom &&
    env.resendApiKey
  ) {
    return new ResendMailProvider({
      apiKey: env.resendApiKey,
      from: env.contactMailFrom,
    });
  }

  return null;
}

export async function sendMail(message: MailMessage) {
  const provider = resolveMailProvider();
  if (!provider) {
    return {
      ok: false as const,
      reason: "delivery_unavailable" as const,
    };
  }

  try {
    await provider.send(message);
  } catch {
    return {
      ok: false as const,
      reason: "delivery_unavailable" as const,
    };
  }

  return {
    ok: true as const,
  };
}
