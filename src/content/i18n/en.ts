import { SiteDictionary } from "@/content/i18n/types";

export const enDictionary: SiteDictionary = {
  navigation: {
    main: [
      { href: "/", label: "Home" },
      { href: "/leistungen", label: "Services" },
      { href: "/vorlagen", label: "Templates" },
      { href: "/kontakt", label: "Contact" },
    ],
    legal: [
      { href: "/impressum", label: "Legal Notice" },
      { href: "/datenschutz", label: "Privacy" },
    ],
  },
  cta: {
    primary: "Book a free intro call",
    secondary: "Request project",
  },
  preferences: {
    theme: {
      light: "Light",
      dark: "Dark",
      label: "Theme",
    },
    language: {
      label: "Language",
      de: "German",
      en: "English",
    },
  },
  pages: {
    home: {
      metaTitle: "Home | invessiv",
      metaDescription:
        "Multi-page website foundation for scalable landing and product experiences.",
      badge: "Next.js Foundation",
      title:
        "Multi-page website foundation for scalable landing and product experiences.",
      description:
        "This baseline separates marketing, legal, and shared components for maintainable growth.",
      foundationHeading: "Architecture principles for sustainable delivery",
      foundationItems: [
        {
          title: "Clear ownership boundaries",
          description:
            "Marketing, legal, and shared layers stay isolated to avoid technical sprawl as the product grows.",
        },
        {
          title: "Centralized content",
          description:
            "Core copy and messaging live in structured config files and are rendered by components.",
        },
        {
          title: "Scalable structure",
          description:
            "New capabilities are added as modules instead of overloading existing folders.",
        },
      ],
      flowHeading: "Delivery in small, reliable increments",
      flowSteps: [
        "Define scope and target outcome",
        "Set design and content system",
        "Implement feature-oriented modules",
        "Run tests, review, and controlled release",
      ],
    },
    leistungen: {
      metaTitle: "Services | invessiv",
      metaDescription: "Service packages, delivery scope, and comparison logic.",
      title: "Services",
      description: "Service packages, delivery scope, and comparison logic.",
      sectionHeading: "Service models across growth stages",
    },
    vorlagen: {
      metaTitle: "Templates | invessiv",
      metaDescription:
        "Sellable roadmap assets, AGENTS bundles, and conversion template previews.",
      title: "Templates",
      description:
        "Sellable roadmap assets, AGENTS bundles, and conversion template previews.",
      sectionHeading: "Ready-to-deploy template products",
    },
    kontakt: {
      metaTitle: "Contact | invessiv",
      metaDescription: "Direct contact flow with booking and project request form.",
      title: "Contact",
      description: "Direct contact flow with booking and project request form.",
      optionsHeading: "Direct contact with minimal friction",
      optionsDescription:
        "For fast alignment: book an intro call or send a direct request. Both routes feed the same project backlog.",
      emailLabel: "kontakt@invessiv.de",
      form: {
        title: "Request a project",
        description:
          "Mock flow: the form validates inputs and shows status without sending.",
        nameLabel: "Name",
        emailLabel: "Email",
        messageLabel: "Request",
        submitLabel: "Send request",
        successMessage:
          "Thanks, request validated. Delivery integration comes next.",
        errors: {
          requiredName: "Please enter your name.",
          requiredEmail: "Please enter your email.",
          invalidEmail: "Please enter a valid email address.",
          requiredMessage: "Please add a short project request.",
        },
      },
    },
    impressum: {
      metaTitle: "Legal Notice | invessiv",
      metaDescription: "Placeholder for legal notice content.",
      title: "Legal Notice",
      description: "Placeholder for legal notice content.",
    },
    datenschutz: {
      metaTitle: "Privacy | invessiv",
      metaDescription: "Placeholder for privacy policy content.",
      title: "Privacy",
      description: "Placeholder for privacy policy content.",
    },
  },
  offers: {
    servicePackages: [
      {
        name: "Launch Sprint",
        priceFrom: "from EUR 1,490",
        summary:
          "Landing strategy, baseline copy, and conversion-focused UI in a short iteration cycle.",
        bullets: [
          "Positioning + page structure",
          "Responsive UI delivery",
          "CTA and tracking baseline",
        ],
      },
      {
        name: "Growth System",
        priceFrom: "from EUR 2,900",
        summary:
          "Scalable website architecture with modular sections and explicit release gates.",
        bullets: [
          "Modular component architecture",
          "Content and SEO layer",
          "Testing and CI setup",
        ],
      },
      {
        name: "Authority Platform",
        priceFrom: "from EUR 4,900",
        summary:
          "Premium presence with distinctive design language, trust assets, and clear pipeline.",
        bullets: [
          "Custom visual direction",
          "Trust/proof integration",
          "Technical scaling baseline",
        ],
      },
    ],
    templateProducts: [
      {
        title: "Craft Premium Onepager",
        price: "EUR 149",
        format: "Next.js + Tailwind",
      },
      {
        title: "Coach Conversion Template",
        price: "EUR 129",
        format: "Next.js + Tailwind",
      },
      {
        title: "Service Funnel Starter Kit",
        price: "EUR 179",
        format: "Next.js + Tailwind",
      },
    ],
  },
};
