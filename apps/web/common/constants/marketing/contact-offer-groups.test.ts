import { CONTACT_OFFER_KEY } from "@invessiv/common/constants/contact/contact-offer-keys";
import { describe, expect, it } from "vitest";

import {
  CONTACT_OFFER_GROUP,
  CONTACT_OFFER_GROUP_BY_KEY,
  getCanonicalContactOfferKey,
  getContactOfferGroup,
} from "./contact-offer-groups";

describe("contact offer groups", () => {
  it.each([
    CONTACT_OFFER_KEY.Landing,
    CONTACT_OFFER_KEY.Web,
    CONTACT_OFFER_KEY.Upgrade,
  ])("maps %s to the web offer group", (offerKey) => {
    expect(CONTACT_OFFER_GROUP_BY_KEY[offerKey]).toBe(CONTACT_OFFER_GROUP.Web);
    expect(getContactOfferGroup(offerKey)).toBe(CONTACT_OFFER_GROUP.Web);
  });

  it("maps process and maintenance to their dedicated offer groups", () => {
    expect(getContactOfferGroup(CONTACT_OFFER_KEY.Process)).toBe(
      CONTACT_OFFER_GROUP.Process,
    );
    expect(getContactOfferGroup(CONTACT_OFFER_KEY.Maintenance)).toBe(
      CONTACT_OFFER_GROUP.Support,
    );
  });

  it.each([
    CONTACT_OFFER_KEY.Landing,
    CONTACT_OFFER_KEY.Web,
    CONTACT_OFFER_KEY.Upgrade,
  ])("canonicalizes %s to landing for the web offer", (offerKey) => {
    expect(getCanonicalContactOfferKey(offerKey)).toBe(
      CONTACT_OFFER_KEY.Landing,
    );
  });

  it.each([
    [CONTACT_OFFER_KEY.Process, CONTACT_OFFER_KEY.Process],
    [CONTACT_OFFER_KEY.Maintenance, CONTACT_OFFER_KEY.Maintenance],
  ])("keeps %s as its canonical offer key", (offerKey, expectedOfferKey) => {
    expect(getCanonicalContactOfferKey(offerKey)).toBe(expectedOfferKey);
  });
});
