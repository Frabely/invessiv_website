export type SiteDictionary = {
  navigation: {
    main: Array<{ href: string; label: string }>;
    legal: Array<{ href: string; label: string }>;
  };
  cta: {
    primary: string;
    secondary: string;
  };
  preferences: {
    theme: {
      light: string;
      dark: string;
      label: string;
    };
    language: {
      label: string;
      de: string;
      en: string;
    };
  };
  pages: {
    home: {
      metaTitle: string;
      metaDescription: string;
      badge: string;
      title: string;
      description: string;
      differenceHeading: string;
      differenceHint: string;
      differenceItems: Array<{ title: string; description: string }>;
      foundationHeading: string;
      foundationItems: Array<{ title: string; description: string }>;
      flowHeading: string;
      flowSteps: string[];
      casesHeading: string;
      casesHint: string;
      cases: Array<{
        title: string;
        description: string;
        metrics: string[];
      }>;
      pricingHeading: string;
      pricingHint: string;
      pricingPlans: Array<{
        title: string;
        price: string;
        features: string[];
      }>;
      pricingMockNote: string;
      pricingButton: string;
      portalHeading: string;
      portalHint: string;
      portalLoginButton: string;
      portalRegisterButton: string;
      portalMockNote: string;
    };
    leistungen: {
      metaTitle: string;
      metaDescription: string;
      badge: string;
      title: string;
      description: string;
      hint: string;
      sectionHeading: string;
    };
    vorlagen: {
      metaTitle: string;
      metaDescription: string;
      badge: string;
      title: string;
      description: string;
      hint: string;
      sectionHeading: string;
    };
    kontakt: {
      metaTitle: string;
      metaDescription: string;
      badge: string;
      title: string;
      description: string;
      hint: string;
      optionsHeading: string;
      optionsDescription: string;
      emailLabel: string;
      form: {
        title: string;
        description: string;
        nameLabel: string;
        emailLabel: string;
        messageLabel: string;
        submitLabel: string;
        successMessage: string;
        errors: {
          requiredName: string;
          requiredEmail: string;
          invalidEmail: string;
          requiredMessage: string;
        };
      };
    };
    impressum: {
      metaTitle: string;
      metaDescription: string;
      title: string;
      description: string;
    };
    datenschutz: {
      metaTitle: string;
      metaDescription: string;
      title: string;
      description: string;
    };
  };
  offers: {
    servicePackages: Array<{
      name: string;
      priceFrom: string;
      summary: string;
      bullets: string[];
    }>;
    templateProducts: Array<{
      title: string;
      price: string;
      format: string;
    }>;
  };
};
