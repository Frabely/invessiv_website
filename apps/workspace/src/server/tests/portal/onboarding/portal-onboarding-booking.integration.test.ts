import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { QuestionnaireFieldType as T } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { BookingProvider } from "@invessiv/common/constants/portal/booking-providers";
import {
  projects,
  users,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import { getPortalOnboardingBooking } from "@/server/portal/query-handler/get-portal-onboarding-booking.query-handler";
import { createPortalSessionFixture } from "@/server/tests/support/portal-session-fixture";
import { startProjectOnboarding } from "@/server/workspace/crm/command-handler/start-project-onboarding.command-handler";
import { createOnboardingIntegrationFixture } from "../../workspace/crm/support/onboarding-integration-fixture";

vi.mock("server-only", () => ({}));
// Every test talks to the development database several dozen times.
vi.setConfig({ testTimeout: 60_000 });

const CUSTOMER_OWNER_LINK = "https://calendly.com/integration-owner/call";
const PROJECT_OWNER_LINK = "https://cal.com/integration-project/call";

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "portal onboarding booking link with real portal sessions",
  () => {
    const f = createOnboardingIntegrationFixture();
    const PREFIX = `integration:onboarding-booking:${crypto.randomUUID()}:`;
    const sessions = createPortalSessionFixture(
      () => f.database(),
      f.memberId,
      PREFIX,
    );
    const extraMembers: { memberId: string; userId: string }[] = [];
    let templateId: string;

    /** A further member; `f.memberId` owns both customers of the fixture. */
    async function member(
      name: string,
      bookingUrl: string | null,
      active = true,
    ): Promise<string> {
      const userId = crypto.randomUUID();
      const memberId = crypto.randomUUID();
      extraMembers.push({ memberId, userId });
      await f
        .database()
        .insert(users)
        .values({
          id: userId,
          clerk_user_id: PREFIX + userId,
          primary_email: `${userId}@example.test`,
          display_name: name,
          active: true,
          version: 1,
        });
      await f.database().insert(workspaceMembers).values({
        id: memberId,
        user_id: userId,
        active,
        version: 1,
        booking_url: bookingUrl,
      });
      return memberId;
    }

    async function setCustomerOwnerLink(bookingUrl: string | null) {
      await f
        .database()
        .update(workspaceMembers)
        .set({ booking_url: bookingUrl })
        .where(eq(workspaceMembers.id, f.memberId));
    }

    /** A form on a fresh project of the given customer, owned by the given member. */
    async function form(
      status: OnboardingFormStatus,
      options: { ownerMemberId?: string; customerId?: string } = {},
    ): Promise<string> {
      const projectId = await f.project({ customerId: options.customerId });
      const started = f.value(
        await startProjectOnboarding(projectId, { templateId }, f.member()),
      );
      if (options.ownerMemberId) {
        await f
          .database()
          .update(projects)
          .set({ owner_member_id: options.ownerMemberId })
          .where(eq(projects.id, projectId));
      }
      await f.setFormStatus(started.id, status);
      return started.id;
    }

    beforeAll(async () => {
      await f.setup();
      const block = await f.catalogBlock([{ key: "name", type: T.ShortText }]);
      templateId = (await f.template([block.id])).id;
      await setCustomerOwnerLink(CUSTOMER_OWNER_LINK);
    }, 60_000);

    afterAll(async () => {
      await f.cleanup();
      await sessions.cleanup();
      const db = f.database();
      if (!db || extraMembers.length === 0) return;
      await db.delete(workspaceMembers).where(
        inArray(
          workspaceMembers.id,
          extraMembers.map((entry) => entry.memberId),
        ),
      );
      await db.delete(users).where(
        inArray(
          users.id,
          extraMembers.map((entry) => entry.userId),
        ),
      );
    }, 60_000);

    it("shows each customer the link of the member who owns its project", async () => {
      const projectOwner = await member("Petra Projekt", PROJECT_OWNER_LINK);
      const ownForm = await form(OnboardingFormStatus.Submitted);
      const foreignForm = await form(OnboardingFormStatus.Submitted, {
        customerId: f.foreignCustomerId,
        ownerMemberId: projectOwner,
      });
      const contact = await sessions.session(f.customerId);
      const foreignContact = await sessions.session(f.foreignCustomerId);

      expect(await getPortalOnboardingBooking(contact, ownForm)).toMatchObject({
        bookingUrl: CUSTOMER_OWNER_LINK,
        provider: BookingProvider.Calendly,
      });
      expect(
        await getPortalOnboardingBooking(foreignContact, foreignForm),
      ).toEqual({
        memberDisplayName: "Petra Projekt",
        bookingUrl: PROJECT_OWNER_LINK,
        provider: BookingProvider.CalCom,
      });

      // A form of the other company yields nothing, whoever offers a link there.
      expect(await getPortalOnboardingBooking(contact, foreignForm)).toBeNull();
      expect(
        await getPortalOnboardingBooking(foreignContact, ownForm),
      ).toBeNull();
    });

    it("falls back to the customer owner when the project owner offers no link", async () => {
      const withoutLink = await member("Ohne Link", null);
      const formId = await form(OnboardingFormStatus.Submitted, {
        ownerMemberId: withoutLink,
      });
      const contact = await sessions.session(f.customerId);

      expect(await getPortalOnboardingBooking(contact, formId)).toMatchObject({
        bookingUrl: CUSTOMER_OWNER_LINK,
      });
    });

    it("never offers the link of an inactive member and answers nothing when no link is left", async () => {
      const inactive = await member("Inaktiv", PROJECT_OWNER_LINK, false);
      const formId = await form(OnboardingFormStatus.Submitted, {
        ownerMemberId: inactive,
      });
      const contact = await sessions.session(f.customerId);

      expect(await getPortalOnboardingBooking(contact, formId)).toMatchObject({
        bookingUrl: CUSTOMER_OWNER_LINK,
      });

      await setCustomerOwnerLink(null);
      try {
        expect(await getPortalOnboardingBooking(contact, formId)).toBeNull();
      } finally {
        await setCustomerOwnerLink(CUSTOMER_OWNER_LINK);
      }
    });

    it("offers the link from the submission until the completion, not before and not after", async () => {
      const contact = await sessions.session(f.customerId);
      const expected: [OnboardingFormStatus, boolean][] = [
        [OnboardingFormStatus.Open, false],
        [OnboardingFormStatus.Submitted, true],
        [OnboardingFormStatus.ChangesRequested, true],
        [OnboardingFormStatus.Completed, false],
      ];
      const formId = await form(OnboardingFormStatus.Draft);
      expect(await getPortalOnboardingBooking(contact, formId)).toBeNull();

      for (const [status, offered] of expected) {
        await f.setFormStatus(formId, status);
        const booking = await getPortalOnboardingBooking(contact, formId);
        expect(booking !== null, status).toBe(offered);
      }
    });

    it("needs portal.onboarding.read and a real form id", async () => {
      const formId = await form(OnboardingFormStatus.Submitted);
      const withoutOnboarding = f.contact([
        Permission.PortalAccess,
        Permission.PortalProjectsRead,
      ]);
      const contact = await sessions.session(f.customerId);

      expect(
        await getPortalOnboardingBooking(withoutOnboarding, formId),
      ).toBeNull();
      expect(
        await getPortalOnboardingBooking(contact, crypto.randomUUID()),
      ).toBeNull();
      expect(await getPortalOnboardingBooking(contact, "no-uuid")).toBeNull();
    });
  },
);
