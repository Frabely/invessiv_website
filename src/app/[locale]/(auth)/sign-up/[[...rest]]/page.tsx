import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthClerkPage } from "@/components/auth/auth-clerk-page/auth-clerk-page";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import { getAuthContent } from "@/i18n/dictionaries/auth";
import {
  signInPathFor,
  signUpPathFor,
  workspacePathFor,
} from "@/lib/auth/routes";
import {
  AuthRouteKind,
  generateAuthMetadata,
  generateAuthStaticParams,
} from "../../auth-route-metadata";

type SignUpPageProps = {
  params: Promise<{ locale: string; rest?: string[] }>;
};

export function generateStaticParams() {
  return generateAuthStaticParams();
}

export async function generateMetadata({
  params,
}: SignUpPageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateAuthMetadata(locale, AuthRouteKind.SignUp);
}

export default async function SignUpPage({ params }: SignUpPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const activeLocale = locale as Locale;
  const content = getAuthContent(activeLocale);

  return (
    <AuthClerkPage
      content={content.signUp}
      footerHref={signInPathFor(activeLocale)}
    >
      <SignUp
        fallbackRedirectUrl={workspacePathFor(activeLocale)}
        path={signUpPathFor(activeLocale)}
        routing="path"
        signInUrl={signInPathFor(activeLocale)}
      />
    </AuthClerkPage>
  );
}
