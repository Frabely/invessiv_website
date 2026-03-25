import "server-only";
import type { Locale } from "@/config/i18n";

export type Dictionary = {
  mail: {
    contactNotification: {
      detailsLabel: string;
      heading: string;
      labels: Record<string, string>;
      subjectPrefix: string;
      values: Record<string, Record<string, string>>;
    };
  };
  imprint: {
    meta: {
      title: string;
      description: string;
      openGraphTitle: string;
      openGraphLocale: string;
    };
    page: {
      title: string;
      lead: string;
      updatedAt: string;
      breadcrumbAriaLabel: string;
      homeLabel: string;
      tocLabel: string;
      sectionLinkLabel: string;
      copySectionLinkLabel: string;
      sectionLinkCopiedLabel: string;
    };
    sections: {
      provider: {
        title: string;
        labels: {
          company: string;
          representedBy: string;
          address: string;
        };
      };
      contact: {
        labels: {
          email: string;
          phone: string;
        };
      };
      social: {
        title: string;
        placeholders: {
          linkedin: string;
          x: string;
          instagram: string;
        };
      };
    };
    values: {
      addressLine: string;
      phoneDisplay: string;
    };
  };
  terms: {
    meta: {
      title: string;
      description: string;
      openGraphTitle: string;
      openGraphLocale: string;
    };
    page: {
      title: string;
      lead: string;
      updatedAt: string;
      breadcrumbAriaLabel: string;
      homeLabel: string;
      tocLabel: string;
      sectionLinkLabel: string;
      copySectionLinkLabel: string;
      sectionLinkCopiedLabel: string;
    };
    sections: {
      provider: {
        title: string;
        contractPrefix: string;
        representedByLabel: string;
        addressLine: string;
        emailLabel: string;
      };
      scope: {
        title: string;
        body: string;
      };
      contractConclusion: {
        title: string;
        body: string;
      };
      servicesScope: {
        title: string;
        body: string;
      };
      clientCooperation: {
        title: string;
        body: string;
      };
      payment: {
        title: string;
        body: string;
      };
      acceptance: {
        title: string;
        body: string;
      };
      usageRights: {
        title: string;
        body: string;
      };
      thirdPartyServices: {
        title: string;
        body: string;
      };
      liability: {
        title: string;
        body: string;
      };
      confidentiality: {
        title: string;
        body: string;
      };
      finalProvisions: {
        title: string;
        body: string;
      };
    };
  };
  privacy: {
    meta: {
      title: string;
      description: string;
      openGraphTitle: string;
      openGraphLocale: string;
    };
    page: {
      title: string;
      lead: string;
      updatedAt: string;
      breadcrumbAriaLabel: string;
      homeLabel: string;
      tocLabel: string;
      sectionLinkLabel: string;
      copySectionLinkLabel: string;
      sectionLinkCopiedLabel: string;
    };
    sections: {
      controller: {
        title: string;
        ownerLabel: string;
        addressLine: string;
        emailLabel: string;
        phoneLabel: string;
        phoneDisplay: string;
      };
      hosting: {
        title: string;
        body: string;
      };
      vercelAnalytics: {
        title: string;
        body: string;
      };
      speedInsights: {
        title: string;
        body: string;
      };
      contact: {
        title: string;
        body: string;
      };
      appointments: {
        title: string;
        body: string;
      };
      cookies: {
        title: string;
        body: string;
      };
      recipients: {
        title: string;
        body: string;
      };
      storage: {
        title: string;
        body: string;
      };
      thirdCountryTransfers: {
        title: string;
        body: string;
      };
      rights: {
        title: string;
        body: string;
      };
      complaints: {
        title: string;
        body: string;
      };
    };
  };
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const [mail, imprint, terms, privacy] = await Promise.all([
    import(`./dictionaries/mail/contact-notification/${locale}.json`),
    import(`./dictionaries/legal/imprint/${locale}.json`),
    import(`./dictionaries/legal/terms/${locale}.json`),
    import(`./dictionaries/legal/privacy/${locale}.json`),
  ]);

  return {
    mail: mail.default.mail,
    imprint: imprint.default.imprint,
    terms: terms.default.terms,
    privacy: privacy.default.privacy,
  };
}
