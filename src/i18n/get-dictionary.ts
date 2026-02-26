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
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const dictionary = await import(`./dictionaries/${locale}.json`);
  return dictionary.default as Dictionary;
}
