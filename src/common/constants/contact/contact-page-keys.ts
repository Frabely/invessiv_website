export const CONTACT_PAGE_KEY = {
  About: "about",
  Blog: "blog",
  Careers: "careers",
  Contact: "contact",
  Home: "home",
  LandingPage: "landing_page",
  Services: "services",
} as const;

export const CONTACT_PAGE_KEYS = [
  CONTACT_PAGE_KEY.Home,
  CONTACT_PAGE_KEY.Services,
  CONTACT_PAGE_KEY.About,
  CONTACT_PAGE_KEY.Contact,
  CONTACT_PAGE_KEY.Careers,
  CONTACT_PAGE_KEY.Blog,
  CONTACT_PAGE_KEY.LandingPage,
] as const;

export type ContactPageKey = (typeof CONTACT_PAGE_KEYS)[number];
