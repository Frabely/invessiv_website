import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthClerkPage } from "@/components/auth/auth-clerk-page/auth-clerk-page";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import { getAuthContent } from "@/i18n/dictionaries/auth";
import {
  workspacePathFor,
  signInPathFor,
  signUpPathFor,
} from "@/lib/auth/routes";
import {
  generateAuthMetadata,
  generateAuthStaticParams,
} from "../../auth-route-metadata";

type SignInPageProps = {
  params: Promise<{ locale: string; rest?: string[] }>;
};

export function generateStaticParams() {
  return generateAuthStaticParams();
}

export async function generateMetadata({
  params,
}: SignInPageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateAuthMetadata(locale, "signIn");
}

export default async function SignInPage({ params }: SignInPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const activeLocale = locale as Locale;
  const content = getAuthContent(activeLocale);

  return (
    <AuthClerkPage
      content={content.signIn}
      footerHref={signUpPathFor(activeLocale)}
    >
      <SignIn
        fallbackRedirectUrl={workspacePathFor(activeLocale)}
        path={signInPathFor(activeLocale)}
        routing="path"
        signUpUrl={signUpPathFor(activeLocale)}
      />
    </AuthClerkPage>
  );
}
