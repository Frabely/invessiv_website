import { inArray, like } from "drizzle-orm";
import type { ContactDatabaseTransaction } from "../core";
import { getDrizzleDatabaseClient } from "../core";
import {
  configureDatabaseUrlFromTarget,
  type DatabaseTarget,
  parseDatabaseTarget,
} from "./database-target";
import {
  leadActivities,
  leadCallContacts,
  leadCategories,
  leadEmailContacts,
  leadProjectRequests,
  leads,
  leadSocialProfiles,
  leadSubmissions,
} from "../record-configuration";
import type { ContactLeadStatus as ContactLeadStatusValue } from "@/common/constants/contact/contact-lead-statuses";
import { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import { CONTACT_BUDGET_KEY } from "@/common/constants/contact/contact-budget-keys";
import { CONTACT_GOAL_KEY } from "@/common/constants/contact/contact-goal-keys";
import { CONTACT_OFFER_KEY } from "@/common/constants/contact/contact-offer-keys";
import { CONTACT_REQUEST_KIND } from "@/common/constants/contact/contact-request-kind";
import { CONTACT_START_KEY } from "@/common/constants/contact/contact-start-keys";
import { CONTACT_WORKFLOW_KEY } from "@/common/constants/contact/contact-workflow-keys";
import { LeadActorType } from "@/common/constants/leads/activity/lead-actor-types";
import { LeadActivityType } from "@/common/constants/leads/activity/lead-activity-types";
import { LeadSocialPlatform } from "@/common/constants/leads/social/lead-social-platforms";
import { LeadSource } from "@/common/constants/leads/sources/lead-sources";
import { normalizeLeadProfileUrl } from "@/server/workspace/leads/shared/lead-url-normalization-service";

const FIXTURE_PREFIX = "fixture:workspace-leads:";
const ALLOWED_SEED_TARGETS: DatabaseTarget[] = ["development", "preview"];

const CATEGORY_FIXTURES = [
  { slug: "consultants", labelKey: "consultants", sortOrder: 50 },
  { slug: "coaches", labelKey: "coaches", sortOrder: 10 },
  { slug: "photographers", labelKey: "photographers", sortOrder: 60 },
  {
    slug: "small-b2b-providers",
    labelKey: "small-b2b-providers",
    sortOrder: 40,
  },
  {
    slug: "local-service-providers",
    labelKey: "local-service-providers",
    sortOrder: 30,
  },
  { slug: "craftspeople", labelKey: "craftspeople", sortOrder: 20 },
] as const;

type CategorySlug = (typeof CATEGORY_FIXTURES)[number]["slug"];

type LeadFixture = {
  categorySlug: CategorySlug;
  companyName: string;
  email: string;
  externalGuid: string;
  firstName: string;
  improvements: string[];
  lastName: string;
  leadStatus: ContactLeadStatusValue;
  notes: string;
  owner: string;
  phone?: string;
  score: number;
  socialProfiles: Array<{
    platform: (typeof LeadSocialPlatform)[keyof typeof LeadSocialPlatform];
    profileUrl: string;
  }>;
  source: (typeof LeadSource)[keyof typeof LeadSource];
  submission?:
    | {
        kind: "project_request";
        budgetKey: (typeof CONTACT_BUDGET_KEY)[keyof typeof CONTACT_BUDGET_KEY];
        goalKey: (typeof CONTACT_GOAL_KEY)[keyof typeof CONTACT_GOAL_KEY];
        offerKey: (typeof CONTACT_OFFER_KEY)[keyof typeof CONTACT_OFFER_KEY];
        pageKeys: string[];
        preferredStartKey: (typeof CONTACT_START_KEY)[keyof typeof CONTACT_START_KEY];
        projectDetails: string;
        requestId: string;
        workflowKey: (typeof CONTACT_WORKFLOW_KEY)[keyof typeof CONTACT_WORKFLOW_KEY];
      }
    | {
        kind: "quick_contact";
        message: string;
        requestId: string;
      }
    | {
        kind: "discovery_call";
        message: string;
        requestId: string;
      };
  websiteUrl?: string;
};

type LeadRow = {
  category_id: string;
  company_name: string;
  created_at: Date;
  email: string;
  external_guid: string;
  first_name: string;
  improvements: string[];
  id: string;
  lead_status: ContactLeadStatusValue;
  last_name: string;
  notes: string;
  owner: string;
  phone: string | null;
  score: number;
  source: (typeof LeadSource)[keyof typeof LeadSource];
  updated_at: Date;
  website_url: string | null;
};

function minutesBefore(date: Date, minutes: number): Date {
  return new Date(date.getTime() - minutes * 60_000);
}

function minutesAfter(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function buildLeadFixtures(): LeadFixture[] {
  return [
    {
      categorySlug: "consultants",
      companyName: "Neumann Beratung",
      email: "mara.neumann.fixture@invessiv.test",
      externalGuid: `${FIXTURE_PREFIX}01`,
      firstName: "Mara",
      improvements: ["klarere Angebotsstruktur", "stärkerer Call-to-Action"],
      lastName: "Neumann",
      leadStatus: ContactLeadStatus.New,
      notes:
        "Braucht eine fokussierte Beratungsseite mit klarer Leistungstiefe.",
      owner: "Lisa Huber",
      phone: "+49 30 5551001",
      score: 92,
      socialProfiles: [
        {
          platform: LeadSocialPlatform.Linkedin,
          profileUrl: "https://www.linkedin.com/in/mara-neumann/",
        },
      ],
      source: LeadSource.Webform,
      submission: {
        kind: "project_request",
        budgetKey: CONTACT_BUDGET_KEY.Above10000,
        goalKey: CONTACT_GOAL_KEY.GenerateInquiries,
        offerKey: CONTACT_OFFER_KEY.Web,
        pageKeys: ["home", "services", "contact"],
        preferredStartKey: CONTACT_START_KEY.WithinOneMonth,
        projectDetails:
          "Benötigt eine neue Unternehmensseite mit klarer Positionierung, Referenzen und einem kurzen Anfrageflow.",
        requestId: `${FIXTURE_PREFIX}req-01`,
        workflowKey: CONTACT_WORKFLOW_KEY.ConnectDataOrSystems,
      },
      websiteUrl: "https://neumann-beratung.example.com",
    },
    {
      categorySlug: "photographers",
      companyName: "Bauer Studio",
      email: "tobias.bauer.fixture@invessiv.test",
      externalGuid: `${FIXTURE_PREFIX}02`,
      firstName: "Tobias",
      improvements: [
        "Portfolio stärker priorisieren",
        "Terminbuchung sichtbarer machen",
      ],
      lastName: "Bauer",
      leadStatus: ContactLeadStatus.Contacted,
      notes:
        "Will Anfragen über ein hochwertiges Portfolio besser vorqualifizieren.",
      owner: "Miriam Koch",
      phone: "+49 40 5551002",
      score: 81,
      socialProfiles: [
        {
          platform: LeadSocialPlatform.Linkedin,
          profileUrl: "https://www.linkedin.com/in/tobias-bauer-studio/",
        },
        {
          platform: LeadSocialPlatform.Instagram,
          profileUrl: "https://www.instagram.com/bauer.studio/",
        },
      ],
      source: LeadSource.Webform,
      submission: {
        kind: "project_request",
        budgetKey: CONTACT_BUDGET_KEY.Between5000And10000,
        goalKey: CONTACT_GOAL_KEY.IncreaseBookings,
        offerKey: CONTACT_OFFER_KEY.Landing,
        pageKeys: ["home", "contact", "blog"],
        preferredStartKey: CONTACT_START_KEY.Immediately,
        projectDetails:
          "Eine reduzierte Landingpage soll Shootings, Pakete und Verfügbarkeiten klarer darstellen.",
        requestId: `${FIXTURE_PREFIX}req-02`,
        workflowKey: CONTACT_WORKFLOW_KEY.ImproveExistingTool,
      },
      websiteUrl: "https://bauer-studio.example.com",
    },
    {
      categorySlug: "small-b2b-providers",
      companyName: "Kaya Marketing",
      email: "elif.kaya.fixture@invessiv.test",
      externalGuid: `${FIXTURE_PREFIX}03`,
      firstName: "Elif",
      improvements: ["kürzere Formularstrecke", "stärkere Vertrauenssignale"],
      lastName: "Kaya",
      leadStatus: ContactLeadStatus.Qualified,
      notes:
        "Möchte mehr Erstgespräche über eine fokussierte Webform-Conversion.",
      owner: "Sven Richter",
      phone: "+49 89 5551003",
      score: 74,
      socialProfiles: [
        {
          platform: LeadSocialPlatform.Linkedin,
          profileUrl: "https://www.linkedin.com/in/elif-kaya-marketing/",
        },
      ],
      source: LeadSource.Webform,
      submission: {
        kind: "project_request",
        budgetKey: CONTACT_BUDGET_KEY.Between2500And5000,
        goalKey: CONTACT_GOAL_KEY.GenerateInquiries,
        offerKey: CONTACT_OFFER_KEY.Process,
        pageKeys: ["home", "services", "contact", "blog"],
        preferredStartKey: CONTACT_START_KEY.WithinTwoWeeks,
        projectDetails:
          "Die Website soll Leads strukturierter erfassen und die Angebotsanfrage vereinfachen.",
        requestId: `${FIXTURE_PREFIX}req-03`,
        workflowKey: CONTACT_WORKFLOW_KEY.DigitizeExistingProcess,
      },
      websiteUrl: "https://kaya-marketing.example.com",
    },
    {
      categorySlug: "local-service-providers",
      companyName: "Fischer Dachtechnik",
      email: "jonas.fischer.fixture@invessiv.test",
      externalGuid: `${FIXTURE_PREFIX}04`,
      firstName: "Jonas",
      improvements: ["kompaktere Angebotsdarstellung", "mehr mobile Klarheit"],
      lastName: "Fischer",
      leadStatus: ContactLeadStatus.Proposal,
      notes: "Braucht eine schlanke Kontaktmöglichkeit für schnelle Rückrufe.",
      owner: "Anne Vogel",
      phone: "+49 711 5551004",
      score: 68,
      socialProfiles: [
        {
          platform: LeadSocialPlatform.Instagram,
          profileUrl: "https://www.instagram.com/fischer.dachtechnik/",
        },
      ],
      source: LeadSource.Webform,
      submission: {
        kind: "quick_contact",
        message:
          "Bitte kurz zurückrufen. Wir brauchen eine kompakte Startseite und eine bessere Lead-Erfassung.",
        requestId: `${FIXTURE_PREFIX}req-04`,
      },
      websiteUrl: "https://fischer-dachtechnik.example.com",
    },
    {
      categorySlug: "coaches",
      companyName: "Wolf Coaching",
      email: "sophie.wolf.fixture@invessiv.test",
      externalGuid: `${FIXTURE_PREFIX}05`,
      firstName: "Sophie",
      improvements: ["mehr Termin-CTA", "klarere Positionierung"],
      lastName: "Wolf",
      leadStatus: ContactLeadStatus.OnHold,
      notes:
        "Will ein Coaching-Angebot mit mehr Vertrauen und klarer Funnel-Führung.",
      owner: "Daniel Braun",
      phone: "+49 151 5551005",
      score: 57,
      socialProfiles: [
        {
          platform: LeadSocialPlatform.Youtube,
          profileUrl: "https://www.youtube.com/@wolf-coaching",
        },
      ],
      source: LeadSource.Webform,
      submission: {
        kind: "quick_contact",
        message:
          "Die aktuelle Seite ist zu lang. Wir wollen eine klarere Struktur und bessere Anfragen.",
        requestId: `${FIXTURE_PREFIX}req-05`,
      },
      websiteUrl: "https://wolf-coaching.example.com",
    },
    {
      categorySlug: "craftspeople",
      companyName: "Hartmann Werkstatt",
      email: "noah.hartmann.fixture@invessiv.test",
      externalGuid: `${FIXTURE_PREFIX}06`,
      firstName: "Noah",
      improvements: ["Referenzen stärker sichtbar", "weniger Textwände"],
      lastName: "Hartmann",
      leadStatus: ContactLeadStatus.Won,
      notes:
        "Möchte die Werkstatt-Webseite direkt für Termin- und Auftragsanfragen nutzen.",
      owner: "Julia Stein",
      phone: "+49 30 5551006",
      score: 89,
      socialProfiles: [
        {
          platform: LeadSocialPlatform.Linkedin,
          profileUrl: "https://www.linkedin.com/in/noah-hartmann-werkstatt/",
        },
      ],
      source: LeadSource.Webform,
      submission: {
        kind: "quick_contact",
        message:
          "Wir möchten auf eine klare Seite wechseln, die vor allem Rückfragen reduziert.",
        requestId: `${FIXTURE_PREFIX}req-06`,
      },
      websiteUrl: "https://hartmann-werkstatt.example.com",
    },
    {
      categorySlug: "consultants",
      companyName: "Brandt Strategie",
      email: "lea.brandt.fixture@invessiv.test",
      externalGuid: `${FIXTURE_PREFIX}07`,
      firstName: "Lea",
      improvements: ["case studies hervorheben", "Trust-Elemente aufwerten"],
      lastName: "Brandt",
      leadStatus: ContactLeadStatus.Lost,
      notes: "Hat einen Rückruf für eine Discovery-Session angefragt.",
      owner: "Nina Seidel",
      phone: "+49 40 5551007",
      score: 44,
      socialProfiles: [
        {
          platform: LeadSocialPlatform.Linkedin,
          profileUrl: "https://www.linkedin.com/in/lea-brandt-strategie/",
        },
      ],
      source: LeadSource.Webform,
      submission: {
        kind: "discovery_call",
        message:
          "Bitte Rückruf am Dienstagvormittag, um das neue Setup kurz zu besprechen.",
        requestId: `${FIXTURE_PREFIX}req-07`,
      },
      websiteUrl: "https://brandt-strategie.example.com",
    },
    {
      categorySlug: "local-service-providers",
      companyName: "Özdemir Innenausbau",
      email: "emre.oezdemir.fixture@invessiv.test",
      externalGuid: `${FIXTURE_PREFIX}08`,
      firstName: "Emre",
      improvements: ["weniger Klicks bis zur Anfrage", "mobile Kontaktfläche"],
      lastName: "Özdemir",
      leadStatus: ContactLeadStatus.Contacted,
      notes:
        "Der Lead kam über eine schnelle Terminanfrage im Mobile-Flow rein.",
      owner: "Markus Krüger",
      phone: "+49 89 5551008",
      score: 63,
      socialProfiles: [
        {
          platform: LeadSocialPlatform.Instagram,
          profileUrl: "https://www.instagram.com/oezdemir.innenausbau/",
        },
      ],
      source: LeadSource.Webform,
      submission: {
        kind: "discovery_call",
        message:
          "Rückruf zur Einschätzung, welches Angebot für kleine Umbauten passt.",
        requestId: `${FIXTURE_PREFIX}req-08`,
      },
      websiteUrl: "https://oezdemir-innenausbau.example.com",
    },
    {
      categorySlug: "photographers",
      companyName: "Keller Atelier",
      email: "anna.keller.fixture@invessiv.test",
      externalGuid: `${FIXTURE_PREFIX}09`,
      firstName: "Anna",
      improvements: [
        "Portfolio auf einen Blick",
        "stärkerer visueller Einstieg",
      ],
      lastName: "Keller",
      leadStatus: ContactLeadStatus.Qualified,
      notes:
        "Wurde manuell erfasst, weil die Social-Profile schon konkrete Hinweise liefern.",
      owner: "Katharina Brand",
      phone: "+49 221 5551009",
      score: 71,
      socialProfiles: [
        {
          platform: LeadSocialPlatform.Instagram,
          profileUrl: "https://www.instagram.com/keller.atelier/",
        },
        {
          platform: LeadSocialPlatform.Linkedin,
          profileUrl: "https://www.linkedin.com/in/anna-keller-atelier/",
        },
      ],
      source: LeadSource.Import,
      websiteUrl: "https://keller-atelier.example.com",
    },
    {
      categorySlug: "small-b2b-providers",
      companyName: "Reinhardt Web",
      email: "paul.reinhardt.fixture@invessiv.test",
      externalGuid: `${FIXTURE_PREFIX}10`,
      firstName: "Paul",
      improvements: ["klarerer Angebots-CTA", "schnelleres Erstgespräch"],
      lastName: "Reinhardt",
      leadStatus: ContactLeadStatus.Proposal,
      notes:
        "Manueller Lead für einen späteren Angebotsvergleich mit echten Kontakten.",
      owner: "Tobias Meier",
      phone: "+49 69 5551010",
      score: 77,
      socialProfiles: [
        {
          platform: LeadSocialPlatform.Linkedin,
          profileUrl: "https://www.linkedin.com/in/paul-reinhardt-web/",
        },
      ],
      source: LeadSource.Manual,
      websiteUrl: "https://reinhardt-web.example.com",
    },
  ];
}

function createLeadRows(
  fixtures: LeadFixture[],
  categoryIdsBySlug: Record<CategorySlug, string>,
  now: Date,
): LeadRow[] {
  return fixtures.map((fixture, index) => {
    const createdAt = minutesBefore(now, index * 720);
    const updatedAt = minutesAfter(createdAt, 20);

    return {
      category_id: categoryIdsBySlug[fixture.categorySlug],
      company_name: fixture.companyName,
      created_at: createdAt,
      email: fixture.email,
      external_guid: fixture.externalGuid,
      first_name: fixture.firstName,
      improvements: fixture.improvements,
      id: crypto.randomUUID(),
      lead_status: fixture.leadStatus,
      last_name: fixture.lastName,
      notes: fixture.notes,
      owner: fixture.owner,
      phone: fixture.phone ?? null,
      score: fixture.score,
      source: fixture.source,
      updated_at: updatedAt,
      website_url: fixture.websiteUrl ?? null,
    };
  });
}

function createSocialProfileRows(fixtures: LeadFixture[], leadRows: LeadRow[]) {
  return fixtures.flatMap((fixture, index) => {
    const leadRow = leadRows[index];
    const createdAt = minutesAfter(leadRow.created_at, 3);

    return fixture.socialProfiles.map((profile) => ({
      created_at: createdAt,
      id: crypto.randomUUID(),
      lead_id: leadRow.id,
      normalized_url: normalizeLeadProfileUrl(profile.profileUrl),
      platform: profile.platform,
      profile_url: profile.profileUrl,
      updated_at: createdAt,
    }));
  });
}

function createSubmissionRows(fixtures: LeadFixture[], leadRows: LeadRow[]) {
  const submissionRows: Array<{
    channel: (typeof CONTACT_REQUEST_KIND)[keyof typeof CONTACT_REQUEST_KIND];
    consent_accepted_at: Date;
    created_at: Date;
    id: string;
    lead_id: string;
    locale: "de" | "en";
    request_id: string;
    submission_started_at: Date | null;
    updated_at: Date;
  }> = [];

  const projectRequestRows: Array<{
    budget_key: (typeof CONTACT_BUDGET_KEY)[keyof typeof CONTACT_BUDGET_KEY];
    company: string | null;
    created_at: Date;
    custom_page_names: string[] | null;
    goal_key: (typeof CONTACT_GOAL_KEY)[keyof typeof CONTACT_GOAL_KEY] | null;
    id: string;
    lead_submission_id: string;
    offer_key: (typeof CONTACT_OFFER_KEY)[keyof typeof CONTACT_OFFER_KEY];
    page_keys: string[] | null;
    phone: string | null;
    preferred_start_key:
      | (typeof CONTACT_START_KEY)[keyof typeof CONTACT_START_KEY]
      | null;
    project_details: string;
    role: string | null;
    updated_at: Date;
    website: string | null;
    workflow_key:
      | (typeof CONTACT_WORKFLOW_KEY)[keyof typeof CONTACT_WORKFLOW_KEY]
      | null;
  }> = [];

  const emailContactRows: Array<{
    created_at: Date;
    id: string;
    lead_submission_id: string;
    message: string;
    updated_at: Date;
  }> = [];

  const callContactRows: Array<{
    created_at: Date;
    id: string;
    lead_submission_id: string;
    message: string | null;
    updated_at: Date;
  }> = [];

  fixtures.forEach((fixture, index) => {
    if (!fixture.submission) {
      return;
    }

    const leadRow = leadRows[index];
    const submissionCreatedAt = minutesAfter(leadRow.created_at, 1);
    const consentAcceptedAt = minutesBefore(submissionCreatedAt, 12);

    submissionRows.push({
      channel: fixture.submission.kind,
      consent_accepted_at: consentAcceptedAt,
      created_at: submissionCreatedAt,
      id: crypto.randomUUID(),
      lead_id: leadRow.id,
      locale: fixture.submission.kind === "quick_contact" ? "en" : "de",
      request_id: fixture.submission.requestId,
      submission_started_at: minutesBefore(submissionCreatedAt, 5),
      updated_at: submissionCreatedAt,
    });

    const submissionRow = submissionRows[submissionRows.length - 1];

    if (fixture.submission.kind === "project_request") {
      projectRequestRows.push({
        budget_key: fixture.submission.budgetKey,
        company: leadRow.company_name,
        created_at: minutesAfter(submissionCreatedAt, 1),
        custom_page_names: ["Klarer Angebotsbereich", "Referenzen"],
        goal_key: fixture.submission.goalKey,
        id: crypto.randomUUID(),
        lead_submission_id: submissionRow.id,
        offer_key: fixture.submission.offerKey,
        page_keys: fixture.submission.pageKeys,
        phone: leadRow.phone,
        preferred_start_key: fixture.submission.preferredStartKey,
        project_details: fixture.submission.projectDetails,
        role: "Ansprechpartner",
        updated_at: minutesAfter(submissionCreatedAt, 1),
        website: leadRow.website_url,
        workflow_key: fixture.submission.workflowKey,
      });
    }

    if (fixture.submission.kind === "quick_contact") {
      emailContactRows.push({
        created_at: minutesAfter(submissionCreatedAt, 1),
        id: crypto.randomUUID(),
        lead_submission_id: submissionRow.id,
        message: fixture.submission.message,
        updated_at: minutesAfter(submissionCreatedAt, 1),
      });
    }

    if (fixture.submission.kind === "discovery_call") {
      callContactRows.push({
        created_at: minutesAfter(submissionCreatedAt, 1),
        id: crypto.randomUUID(),
        lead_submission_id: submissionRow.id,
        message: fixture.submission.message,
        updated_at: minutesAfter(submissionCreatedAt, 1),
      });
    }
  });

  return {
    callContactRows,
    emailContactRows,
    projectRequestRows,
    submissionRows,
  };
}

function createActivityRows(fixtures: LeadFixture[], leadRows: LeadRow[]) {
  const activityRows: Array<{
    actor_id: string | null;
    actor_label: string | null;
    actor_type: (typeof LeadActorType)[keyof typeof LeadActorType];
    body: string | null;
    created_at: Date;
    id: string;
    lead_id: string;
    metadata: Record<string, unknown> | null;
    occurred_at: Date;
    title: string | null;
    type: (typeof LeadActivityType)[keyof typeof LeadActivityType];
  }> = [];

  fixtures.forEach((fixture, index) => {
    const leadRow = leadRows[index];
    const noteAt = minutesAfter(leadRow.created_at, 5);

    activityRows.push({
      actor_id: null,
      actor_label: "Fixture Seeder",
      actor_type: LeadActorType.System,
      body: fixture.notes,
      created_at: noteAt,
      id: crypto.randomUUID(),
      lead_id: leadRow.id,
      metadata: null,
      occurred_at: noteAt,
      title: "Fixture lead angelegt",
      type: LeadActivityType.Note,
    });

    if (fixture.source === LeadSource.Import) {
      const importAt = minutesAfter(leadRow.created_at, 8);
      activityRows.push({
        actor_id: null,
        actor_label: "Fixture Seeder",
        actor_type: LeadActorType.System,
        body: "Lead wurde für das Listen- und Detailtesting importiert.",
        created_at: importAt,
        id: crypto.randomUUID(),
        lead_id: leadRow.id,
        metadata: {
          categorySlug: fixture.categorySlug,
          source: fixture.source,
        },
        occurred_at: importAt,
        title: "Import verarbeitet",
        type: LeadActivityType.Import,
      });
    }

    if (fixture.leadStatus !== ContactLeadStatus.New) {
      const statusChangeAt = minutesAfter(leadRow.created_at, 12);
      activityRows.push({
        actor_id: null,
        actor_label: "Fixture Seeder",
        actor_type: LeadActorType.System,
        body: `${ContactLeadStatus.New} -> ${fixture.leadStatus}`,
        created_at: statusChangeAt,
        id: crypto.randomUUID(),
        lead_id: leadRow.id,
        metadata: {
          from: ContactLeadStatus.New,
          to: fixture.leadStatus,
        },
        occurred_at: statusChangeAt,
        title: "Status aktualisiert",
        type: LeadActivityType.StatusChange,
      });
    }

    if (fixture.submission) {
      const submissionAt = minutesAfter(leadRow.created_at, 2);
      activityRows.push({
        actor_id: null,
        actor_label: "Fixture Seeder",
        actor_type: LeadActorType.System,
        body: `Eingehende ${fixture.submission.kind} mit Request ${fixture.submission.requestId}`,
        created_at: submissionAt,
        id: crypto.randomUUID(),
        lead_id: leadRow.id,
        metadata: {
          requestId: fixture.submission.requestId,
          kind: fixture.submission.kind,
        },
        occurred_at: submissionAt,
        title: "Submission eingegangen",
        type: LeadActivityType.InboundSubmission,
      });
    }
  });

  return activityRows;
}

async function ensureCategoryIds(
  tx: ContactDatabaseTransaction,
): Promise<Record<CategorySlug, string>> {
  await tx
    .insert(leadCategories)
    .values(
      CATEGORY_FIXTURES.map((category) => ({
        id: crypto.randomUUID(),
        label_key: category.labelKey,
        slug: category.slug,
        sort_order: category.sortOrder,
      })),
    )
    .onConflictDoNothing();

  const categoryRows = await tx
    .select({
      id: leadCategories.id,
      slug: leadCategories.slug,
    })
    .from(leadCategories)
    .where(
      inArray(
        leadCategories.slug,
        CATEGORY_FIXTURES.map((category) => category.slug),
      ),
    );

  const categoryIds = Object.fromEntries(
    categoryRows.map((row) => [row.slug, row.id]),
  ) as Record<CategorySlug, string>;

  for (const category of CATEGORY_FIXTURES) {
    if (!categoryIds[category.slug]) {
      throw new Error(`Category "${category.slug}" is missing after seeding.`);
    }
  }

  return categoryIds;
}

async function resetFixtureLeads(tx: ContactDatabaseTransaction) {
  await tx.delete(leads).where(like(leads.external_guid, `${FIXTURE_PREFIX}%`));
}

async function run() {
  const target = parseDatabaseTarget(process.argv);
  if (!target) {
    throw new Error(
      `A database target is required. Use one of: ${ALLOWED_SEED_TARGETS.join(", ")}.`,
    );
  }

  if (!ALLOWED_SEED_TARGETS.includes(target)) {
    throw new Error(
      `Seeding is only allowed for: ${ALLOWED_SEED_TARGETS.join(", ")}.`,
    );
  }

  configureDatabaseUrlFromTarget(target);
  const db = getDrizzleDatabaseClient();
  const fixtures = buildLeadFixtures();
  const now = new Date();

  await db.transaction(async (tx) => {
    const categoryIds = await ensureCategoryIds(tx);
    await resetFixtureLeads(tx);

    const leadRows = createLeadRows(fixtures, categoryIds, now);
    const socialProfileRows = createSocialProfileRows(fixtures, leadRows);
    const submissionRowsPayload = createSubmissionRows(fixtures, leadRows);
    const activityRows = createActivityRows(fixtures, leadRows);

    await tx.insert(leads).values(leadRows);
    await tx.insert(leadSocialProfiles).values(socialProfileRows);
    await tx
      .insert(leadSubmissions)
      .values(submissionRowsPayload.submissionRows);
    await tx
      .insert(leadProjectRequests)
      .values(submissionRowsPayload.projectRequestRows);
    await tx
      .insert(leadEmailContacts)
      .values(submissionRowsPayload.emailContactRows);
    await tx
      .insert(leadCallContacts)
      .values(submissionRowsPayload.callContactRows);
    await tx.insert(leadActivities).values(activityRows);
  });

  console.log(`Seeded ${fixtures.length} leads with related fixture data.`);
  console.log(`Fixture prefix: ${FIXTURE_PREFIX}`);
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
