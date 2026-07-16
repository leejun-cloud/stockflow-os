# StockFlow OS Full Build Backend Plan

> **For Hermes:** implement this as a real working build, not a mock landing page. Prioritize runnable code and verified flows.

**Goal:** Add a working backend with local database persistence, real file upload handling, asset listing, and per-platform adapter exports for Adobe Stock, Shutterstock, Alamy, and Getty/iStock.

**Architecture:** Keep the existing Next.js app, add server-side route handlers under `src/app/api`, persist data in a local SQLite database through a thin repository layer, and generate platform-specific export packages from a shared asset metadata model. Direct remote upload to each marketplace is intentionally out of scope until authenticated stable APIs exist; the adapters will be real code that transforms metadata and emits actual submission packages/downloads.

**Tech Stack:** Next.js App Router, TypeScript, SQLite (`better-sqlite3`), file storage on disk, zip export (`jszip`), schema SQL bootstrap, Vitest.

---

## Build order
1. Add dependencies and test runner.
2. Write failing tests for adapter rules and package generation.
3. Add database bootstrap and schema.
4. Add repository/service layer for assets, releases, and submissions.
5. Add upload route and asset list route.
6. Add adapter implementations for Adobe, Shutterstock, Alamy, Getty.
7. Add submit/export route and download route.
8. Replace the simple homepage with a working upload dashboard.
9. Run tests, build, local smoke checks.

## Deliverables
- `db/schema.sql`
- `src/lib/db.ts`
- `src/lib/repositories/*`
- `src/lib/adapters/*`
- `src/app/api/assets/upload/route.ts`
- `src/app/api/assets/route.ts`
- `src/app/api/assets/[assetId]/submit/route.ts`
- `src/app/api/submissions/[submissionId]/download/route.ts`
- working dashboard UI on `/`
- tests that actually run

## Verification standard
- `npm test` passes
- `npm run build` passes
- upload endpoint saves a real file
- asset list endpoint returns saved records
- submit endpoint creates a real zip export package
- download endpoint returns the exported package
