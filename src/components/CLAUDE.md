# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

This directory contains all reusable React UI components shared across routes.

## What belongs here

- Shared React components (client and server) reused across multiple routes
- Presentation building blocks for pages and layouts
- Section components for marketing, legal, and shared UI

## What does not belong here

- Route-level orchestration → `src/app/`
- Database access → `src/server/db/`
- Translation sources → `src/i18n/`

## Structure

```
components/
├── marketing/   # Landing page sections (hero, services, proof, process, contact, footer)
├── legal/       # Legal page components (breadcrumbs, etc.)
└── shared/      # Common UI (button, locale-switch, theme-switch, providers)
```

## Component conventions

- Every productive component lives in its **own folder**: `component-name/component-name.tsx`
- Styles go in a **separate file** (`component-name.css` or `component-name.module.css`) — never inline styles in `.tsx`
- The main component file uses the same name as the folder
- Co-locate tests: `component-name/component-name.test.tsx` for components with interaction logic
- Use meaningful, domain-oriented names that match the component's purpose

## Server vs. Client

- Default to **Server Components**; add `"use client"` only when interactivity requires it
- Animation, scroll, and observer logic belongs in `src/hooks/`, not in render files
- Breadcrumbs must use the central `src/components/legal/breadcrumbs/breadcrumbs.tsx` component — never rebuild breadcrumb markup locally in a page or layout
