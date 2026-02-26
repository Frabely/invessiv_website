import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalLayout } from "@/components/legal/legal-layout/legal-layout";
import {
  COMPANY,
  COMPANY_MAILTO,
  COMPANY_SOCIAL_INSTAGRAM,
  COMPANY_SOCIAL_LINKEDIN,
  COMPANY_SOCIAL_X,
  COMPANY_TEL,
} from "@/config/company";
import { isSupportedLocale, SUPPORTED_LOCALES } from "@/config/i18n";
import { getDictionary } from "@/i18n/get-dictionary";
import { SITE_URL } from "@/lib/site-metadata";

type ImprintPageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: ImprintPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }

  const dict = await getDictionary(locale);
  const languages = Object.fromEntries(
    SUPPORTED_LOCALES.map((supportedLocale) => [
      supportedLocale,
      `/${supportedLocale}/imprint`,
    ]),
  );

  return {
    title: dict.imprint.meta.title,
    description: dict.imprint.meta.description,
    alternates: {
      canonical: `/${locale}/imprint`,
      languages,
    },
    openGraph: {
      title: dict.imprint.meta.openGraphTitle,
      description: dict.imprint.meta.description,
      url: `${SITE_URL}/${locale}/imprint`,
      locale: dict.imprint.meta.openGraphLocale,
      type: "website",
    },
  };
}

export default async function ImprintPage({ params }: ImprintPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dict = await getDictionary(locale);
  const imprint = dict.imprint;

  return (
    <LegalLayout
      lead={imprint.page.lead}
      locale={locale}
      slug="imprint"
      title={imprint.page.title}
    >
      <section id="company-details">
        <h2>{imprint.sections.provider.title}</h2>
        <dl className="legal-kv">
          <div className="legal-kv__row">
            <dt>{imprint.sections.provider.labels.company}</dt>
            <dd>{COMPANY.brandName}</dd>
          </div>
          <div className="legal-kv__row">
            <dt>{imprint.sections.provider.labels.legalForm}</dt>
            <dd>{imprint.values.legalForm}</dd>
          </div>
          <div className="legal-kv__row">
            <dt>{imprint.sections.provider.labels.representedBy}</dt>
            <dd>{COMPANY.owner}</dd>
          </div>
          <div className="legal-kv__row">
            <dt>{imprint.sections.provider.labels.address}</dt>
            <dd>{imprint.values.addressLine}</dd>
          </div>
        </dl>
        <p className="legal-placeholder">{imprint.sections.provider.notePlaceholder}</p>
      </section>

      <section>
        <h2>{imprint.sections.contact.title}</h2>
        <dl className="legal-kv">
          <div className="legal-kv__row">
            <dt>{imprint.sections.contact.labels.email}</dt>
            <dd>
              <a href={COMPANY_MAILTO}>{COMPANY.contact.email}</a>
            </dd>
          </div>
          <div className="legal-kv__row">
            <dt>{imprint.sections.contact.labels.phone}</dt>
            <dd>
              <a href={COMPANY_TEL}>{imprint.values.phoneDisplay}</a>
            </dd>
          </div>
        </dl>
      </section>

      <section>
        <h2>{imprint.sections.commercialRegister.title}</h2>
        <p>{imprint.sections.commercialRegister.emptyEntry}</p>
        <p className="legal-placeholder">{imprint.sections.commercialRegister.notePlaceholder}</p>
      </section>

      <section>
        <h2>{imprint.sections.vatId.title}</h2>
        <p className="legal-placeholder">{imprint.sections.vatId.notePlaceholder}</p>
      </section>

      <section>
        <h2>{imprint.sections.responsibleContent.title}</h2>
        <dl className="legal-kv">
          <div className="legal-kv__row">
            <dt>{imprint.sections.responsibleContent.labels.name}</dt>
            <dd>{COMPANY.owner}</dd>
          </div>
          <div className="legal-kv__row">
            <dt>{imprint.sections.responsibleContent.labels.address}</dt>
            <dd>{imprint.values.addressLine}</dd>
          </div>
        </dl>
      </section>

      <section id="placeholder-social-linkedin">
        <h2>{imprint.sections.social.title}</h2>
        <ul>
          <li>
            <a href={COMPANY_SOCIAL_LINKEDIN} rel="noreferrer" target="_blank">
              LinkedIn
            </a>
          </li>
          <li id="placeholder-social-x">
            <a href={COMPANY_SOCIAL_X} rel="noreferrer" target="_blank">
              X
            </a>
          </li>
          <li id="placeholder-social-instagram">
            <a href={COMPANY_SOCIAL_INSTAGRAM} rel="noreferrer" target="_blank">
              Instagram
            </a>
          </li>
        </ul>
      </section>

      <section>
        <h2>{imprint.sections.euDispute.title}</h2>
        <p>
          {imprint.sections.euDispute.textBeforeLink}{" "}
          <a href="https://ec.europa.eu/consumers/odr/" rel="noreferrer" target="_blank">
            {imprint.sections.euDispute.linkLabel}
          </a>
          . {imprint.sections.euDispute.textAfterLink}
        </p>
      </section>

      <section>
        <h2>{imprint.sections.consumerDispute.title}</h2>
        <p>{imprint.sections.consumerDispute.body}</p>
      </section>
    </LegalLayout>
  );
}
