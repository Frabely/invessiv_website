import "server-only";
import type { Locale } from "@/config/i18n";

export type Dictionary = {
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
          legalForm: string;
          representedBy: string;
          address: string;
        };
        notePlaceholder: string;
      };
      contact: {
        title: string;
        labels: {
          email: string;
          phone: string;
        };
      };
      commercialRegister: {
        title: string;
        emptyEntry: string;
        notePlaceholder: string;
      };
      vatId: {
        title: string;
        notePlaceholder: string;
      };
      responsibleContent: {
        title: string;
        labels: {
          name: string;
          address: string;
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
      euDispute: {
        title: string;
        textBeforeLink: string;
        linkLabel: string;
        textAfterLink: string;
      };
      consumerDispute: {
        title: string;
        body: string;
      };
    };
    values: {
      legalForm: string;
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
      };
      scope: {
        title: string;
        body: string;
      };
      services: {
        title: string;
        body: string;
      };
      payment: {
        title: string;
        body: string;
      };
      usageRights: {
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
      contactRequests: {
        title: string;
        body: string;
      };
      cookies: {
        title: string;
        body: string;
      };
      rights: {
        title: string;
        body: string;
      };
    };
  };
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const [imprint, terms, privacy] = await Promise.all([
    import(`./dictionaries/legal/imprint/${locale}.json`),
    import(`./dictionaries/legal/terms/${locale}.json`),
    import(`./dictionaries/legal/privacy/${locale}.json`),
  ]);

  return {
    imprint: imprint.default.imprint,
    terms: terms.default.terms,
    privacy: privacy.default.privacy,
  };
}
