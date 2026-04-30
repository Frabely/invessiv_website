# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

This directory contains only Next.js App Router entry points and route orchestration.

## What belongs here

- `page.tsx`, `layout.tsx`, `template.tsx`, `loading.tsx`, `error.tsx`
- Route handlers and metadata generation (`generateMetadata`, `generateStaticParams`)
- Page-level composition that assembles server components and passes data down

## What does not belong here

- Reusable presentation components → `src/components/`
- Shared server-side business logic → `src/server/`
- Database persistence → `src/server/db/`
- Translation sources → `src/i18n/`

## Conventions

- `page.tsx` files orchestrate only — no large render switches, no inline business logic, no locale-specific string objects
- Route-local helpers only if they are truly exclusive to that single route
- Route file names must match the path segment they serve
- Route groups use parentheses to separate concerns: `(landing)`, `(legal)`, `(auth)`, `(dashboard)`. Public Clerk sign-in/sign-up routes belong in `(auth)`; protected authenticated dashboard flows belong in `(dashboard)`.
- All locale-dependent text comes from dictionaries loaded via `src/i18n/get-dictionary.ts`; never inline translated strings in page files
