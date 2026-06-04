# LinkedIn Post Generator Mock Removal

Use this checklist when the LinkedIn post generator no longer needs server-side mock generation.

Current state:

- The client no longer contains mock-generation logic.
- The request DTO and validation schema no longer expose a `mode` field.
- Mock/API selection is controlled only in `generate-linkedin-post.command-handler.ts` through
  `NEXT_PUBLIC_LINKEDIN_POST_GENERATOR_USE_MOCK`.

Removal steps:

1. Remove `NEXT_PUBLIC_LINKEDIN_POST_GENERATOR_USE_MOCK` from `apps/web/.env.example`, any root env examples that still
   contain it, and all deployment environments.
2. In `generate-linkedin-post.command-handler.ts`, remove the env-based ternary and call
   `generateLinkedInPost(generatorRequest)` directly.
3. Remove the `linkedinPostGeneratorMockService` import from `generate-linkedin-post.command-handler.ts`.
4. Delete `linkedin-post-generator-mock-service.ts`.
5. In `route.test.ts`, remove the server-side mock-service mock and the env-enabled mock generator test, or rewrite it
   as an API-only orchestration test.
6. Run
   `rg 'linkedinPostGeneratorMockService|LINKEDIN_POST_GENERATOR_USE_MOCK|linkedin-post-generator-mock-service' apps/web packages .env.example`
   and remove remaining productive mock references.
