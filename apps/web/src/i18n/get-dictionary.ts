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
    quickContactNotification: {
      detailsLabel: string;
      emailLabel: string;
      heading: string;
      nameLabel: string;
      subjectPrefix: string;
    };
  };
  imprint: {
    meta: {
      title: string;
      description: string;
      openGraphTitle: string;
    };
    page: {
      title: string;
      lead: string;
      updatedAt: string;
      breadcrumbAriaLabel: string;
      homeLabel: string;
      tocLabel: string;
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
    };
    page: {
      title: string;
      lead: string;
      updatedAt: string;
      breadcrumbAriaLabel: string;
      homeLabel: string;
      tocLabel: string;
    };
    sections: {
      provider: {
        title: string;
        labels: {
          company: string;
          owner: string;
          address: string;
          email: string;
        };
        addressLine: string;
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
      consumerContracts: {
        title: string;
        body: string;
      };
      acceptance: {
        title: string;
        body: string;
      };
      customerContentRights?: {
        title: string;
        body: string;
      };
      legalTextsReview?: {
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
      ongoingSupportAvailability?: {
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
    };
    page: {
      title: string;
      lead: string;
      updatedAt: string;
      breadcrumbAriaLabel: string;
      homeLabel: string;
      tocLabel: string;
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
      generator: {
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
  const [mail, quickContactMail, imprint, terms, privacy] = await Promise.all([
    import(`./dictionaries/mail/contact-notification/${locale}.json`),
    import(`./dictionaries/mail/quick-contact-notification/${locale}.json`),
    import(`./dictionaries/legal/imprint/${locale}.json`),
    import(`./dictionaries/legal/terms/${locale}.json`),
    import(`./dictionaries/legal/privacy/${locale}.json`),
  ]);

  return {
    mail: {
      ...mail.default.mail,
      ...quickContactMail.default.mail,
    },
    imprint: imprint.default.imprint,
    terms: terms.default.terms,
    privacy: privacy.default.privacy,
  };
}
