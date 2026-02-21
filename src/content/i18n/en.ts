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
  actions: {
    menu: "Menu",
    login: "Login",
    call: "Call via Calendly",
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
      differenceHeading: "Why this is not a standard template website",
      differenceHint:
        "The focus is fast delivery, low buyer effort and measurable outcomes.",
      differenceItems: [
        {
          title: "Time-to-launch SLA",
          description:
            "First clickable version in 5 business days with a clear go-live plan per package.",
        },
        {
          title: "Upgrade over rebuild",
          description:
            "Existing websites are modernized strategically without starting from scratch.",
        },
        {
          title: "KPI-driven",
          description:
            "Defined goals such as load time, leads, or conversion instead of design-only output.",
        },
      ],
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
      flowHint: "Click a step to inspect scope, execution mode, and output.",
      flowSteps: [
        {
          title: "Define scope and target outcome",
          detail:
            "Business goal, audience, and success metrics are fixed before execution.",
          output: "Output: Briefing canvas + prioritized goals",
        },
        {
          title: "Set design and content system",
          detail:
            "Visual signature, copy structure, and page rhythm are turned into a working system.",
          output: "Output: UI concept + content architecture",
        },
        {
          title: "Implement feature-oriented modules",
          detail:
            "Components and logic are delivered in small, testable modules.",
          output: "Output: Reviewable increments with clear ownership",
        },
        {
          title: "Run tests, review, and controlled release",
          detail:
            "Core flows are validated before a controlled rollout.",
          output: "Output: Release candidate with rollback path",
        },
      ],
      casesHeading: "Mini cases",
      casesHint:
        "Short Problem -> Action -> Result summaries instead of a generic portfolio wall.",
      caseLabels: {
        problem: "Problem",
        action: "Action",
        result: "Result",
      },
      cases: [
        {
          title: "Case: Lead page upgrade",
          problem: "High bounce rate on the entry page.",
          action:
            "Sharpened hero message, rebuilt CTA hierarchy, and reduced above-the-fold noise.",
          result: "More stable conversion trend with clearer user direction.",
          metrics: ["-28% bounce (placeholder)", "+19% leads (placeholder)"],
        },
        {
          title: "Case: Service website relaunch",
          problem: "Unclear value proposition and too much navigation friction.",
          action:
            "Focused offer modules, reduced contact flow, and reprioritized navigation.",
          result: "Shorter time-to-first-call and better inquiry quality.",
          metrics: [
            "-35% time-to-first-call (placeholder)",
            "+22% inquiry rate (placeholder)",
          ],
        },
        {
          title: "Case: Internal process flow",
          problem: "Manual routine tasks with a high error surface.",
          action:
            "Mapped the workflow into a small guided internal tool.",
          result: "Clear time savings and more reliable daily operations.",
          metrics: [
            "-6h/week manual work (placeholder)",
            "-41% error rate (placeholder)",
          ],
        },
      ],
      pricingHeading: "Pricing and checkout",
      pricingHint: "UI is final-looking. Checkout is intentionally mock-only for now.",
      pricingPlans: [
        {
          title: "Starter Landing",
          price: "EUR 490",
          features: ["One-pager + contact", "Responsive design", "Fast go-live"],
        },
        {
          title: "Business Website",
          price: "EUR 1,490",
          features: [
            "Multi-page structure",
            "SEO + legal baseline",
            "Conversion focus",
          ],
        },
        {
          title: "Process Tool",
          price: "EUR 2,900",
          features: ["Task automation", "Clear ROI goals", "Login-ready extension"],
        },
      ],
      pricingMockNote: "Mockup: payment will be added later.",
      pricingButton: "Book now (soon)",
      portalHeading: "Client login",
      portalHint: "UI is visible, authentication logic is still disabled.",
      portalLoginButton: "Log in (soon)",
      portalRegisterButton: "Create account (soon)",
      portalMockNote: "Mockup: login will be added later with secure backend.",
    },
    leistungen: {
      metaTitle: "Services | invessiv",
      metaDescription: "Service packages, delivery scope, and comparison logic.",
      badge: "Service Focus",
      title: "Services",
      description: "Service packages, delivery scope, and comparison logic.",
      hint: "Clear offer modules with low coordination overhead.",
      sectionHeading: "Service models across growth stages",
    },
    vorlagen: {
      metaTitle: "Templates | invessiv",
      metaDescription:
        "Sellable roadmap assets, AGENTS bundles, and conversion template previews.",
      badge: "Template Products",
      title: "Templates",
      description:
        "Sellable roadmap assets, AGENTS bundles, and conversion template previews.",
      hint: "Ready-to-use assets with explicit pricing and delivery scope.",
      sectionHeading: "Ready-to-deploy template products",
    },
    kontakt: {
      metaTitle: "Contact | invessiv",
      metaDescription: "Direct contact flow with booking and project request form.",
      badge: "Direct Contact",
      title: "Contact",
      description: "Direct contact flow with booking and project request form.",
      hint: "Book an intro call or send a short request - both are immediately available.",
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
