# Executive Cars — QA Remediation Implementation Plan

**Plan status:** Implemented and verified for the authorized FYP/demo scope; operational production follow-ups remain
**Prepared:** 2026-09-03 (Asia/Karachi)
**Source of truth:** `QA_TEST_REPORT.md`
**Scope:** All 24 audit findings: 8 high-priority defects, 9 medium-priority defects, 1 low-priority defect, and 6 production-readiness risks
**Payment decision:** Retain the current explicit demo-payment flow. Do not enable or depend on Stripe.

## Implementation progress — 2026-09-03

All planned code-remediation packages have been implemented and tested. Status is deliberately based on automated and live evidence, not code completion alone. Two items remain outside the authorized implementation: applying the reviewed legacy-data migration, and integrating a real payment provider for production.

| Work package | Status | Evidence/result |
|---|---|---|
| WP-1 / QA-019 | **Complete** | Shared server-backed save flow, rollback/error test, live cross-page save/remove verification. |
| WP-2 / QA-021 | **Code complete; apply pending** | Schema invariant, API normalization, shared UI predicate, corrected seed, tests, and backup-first migration are complete. The final dry run reached the configured 8-product/5-auction Atlas inventory and identified 3 products plus 1 auction. No apply was authorized or performed. |
| WP-3 / QA-005 | **Complete in code/tests** | Private storage, magic-byte validation, random names, short-lived signed access, owner/admin matrix, and authenticated Cloudinary delivery pass. Live file selection is blocked by Chrome's file-access permission. |
| WP-4 / QA-020 | **Complete for current FYP scope** | Configurable working Groq model, stable provider failure handling, unit tests, and successful live replies. Exact startup health/monitoring remains a deployment enhancement. |
| WP-5 / QA-001 | **Complete** | Shared fallback is used across the reported auction surfaces; component/build/live checks passed. |
| WP-6 / QA-004 | **Complete** | Server-side membership authorization and safe auction DTO tests pass for anonymous, inactive, active, and administrator roles. |
| WP-7 / QA-002, QA-010 | **Complete for reported surfaces** | Auction, marketplace, administrator, and seller dashboards now separate loading/error/empty/content states; delayed component tests and live Atlas-latency review passed. |
| WP-8 / QA-003 | **Complete** | My Bids mobile information architecture and responsive rendering were rebuilt and verified. |
| WP-9 / QA-007, QA-024 | **Complete** | Shared accessible modal/drawer provides naming, focus management, trap, Escape, focus restore, inert background, and scroll lock; live mobile drawer checks passed. |
| WP-10 / QA-008 | **Complete** | Six seller/admin record surfaces use responsive labelled cards; live administrator mobile review found no hidden actions or page overflow. |
| WP-11 / QA-006 | **Complete** | Required-state copy, field error, ARIA state, component test, and successful live prediction passed. |
| WP-12 / QA-009, QA-023 | **Complete** | Data & Models separates active provenance from import corpus and remains usable on desktop/mobile. |
| WP-13 / QA-011 | **Complete** | Route allowlist plus accessible desktop dialog/mobile bottom sheet; live focus, Escape, scroll-lock, and overflow checks passed. |
| WP-14 / QA-012 | **Complete** | Shared legal-page structure and parity tests cover Privacy and Terms. |
| WP-15 / QA-022 | **Complete** | Shared 0/1/many formatter tests and live `1 bid` evidence passed. |
| WP-16 / QA-013 | **Complete** | HttpOnly cookie session, restore/logout endpoints, CSRF/origin checks, credentialed Axios/Socket.IO, and production non-disclosure are covered by backend/frontend tests and live refresh/logout. |
| WP-17 / QA-018 | **Complete** | Explicit application mode and startup validation prevent demo credentials, OTP/reset helpers, fixture routes, or demo payment from leaking into production. |
| WP-18 / QA-014, QA-015 | **Complete for demo scope** | Stripe was removed; demo payment is explicit, server-priced, atomic, authenticated, idempotent, and production-gated. A real provider remains a separate production project. |
| WP-19 / QA-016 | **Complete** | Responsive AVIF/WebP hero assets are 8.32–69.65 KB, live source selection/crops passed, and the 1.78 MB PNG is absent from production output. |
| WP-20 / QA-017 | **Complete** | Dependency compatibility/lock, supported ASGI tests, full model-registry validation, and clean 10/10 ML tests passed. |

Final integrated quality gates: frontend 22 files / 59 tests passed, backend 36/36 passed, ML 10/10 passed with no warnings, frontend production build passed with 1,719 modules, and backend syntax passed for 78 JavaScript files. Production-bundle inspection found no `ec_token`, `ec_user`, demo passwords, Stripe strings, or original hero PNG reference. Evidence is recorded under `qa-evidence/implementation/` and in `QA_TEST_REPORT.md`.

## 1. Objective

The objective is to move the current application through three clearly different quality levels:

1. **Stable FYP demonstration:** Core journeys work reliably, visible contradictions are removed, mobile layouts are usable, and demo-only behavior is unmistakable.
2. **Safe controlled deployment:** Auction and document authorization is enforced by the backend, personal documents are not publicly addressable, and development conveniences cannot leak into a production configuration.
3. **Production-ready foundation:** Authentication is hardened, a real Pakistan-supported payment provider can be integrated later, performance budgets are met, dependency warnings are controlled, and the full regression suite passes.

This plan does not assume that passing UI route guards is sufficient security. Authorization, privacy, and state invariants must be enforced in the backend and database-facing layer.

## 2. Decisions used by this plan

These decisions remove ambiguity from implementation. If the team changes one, the affected work package must be redesigned before coding.

| Area | Decision |
|---|---|
| Auction data | Detailed auction inventory, auction detail, bidder history, and live state are membership-only. `/auction` may remain a public promotional/gate page, but `/api/cars` detail data will not remain anonymously readable. |
| Vehicle images | Marketing/listing images may be public and cacheable. Broken or absent images must use the shared `VehicleImage` fallback. |
| Identity documents | CNIC and registration documents are private. Only the submitting account and administrators may access them. |
| Inspection reports | Reports are private assets. Administrators always have access; a listing owner has access to their own report; signed-in marketplace users may access a used-car report; active auction members may access an auction report. No permanent public report URL is returned. |
| Saved cars | Guests use browser-local storage. Signed-in customer accounts use the server-backed shortlist everywhere. |
| AI provider | The Groq model identifier is configuration, not a source constant. Deployment health must reflect whether that exact configured model is usable. |
| Payments | Demo payment remains the only active flow for this FYP. Stripe endpoints and inactive Stripe UI logic should be removed or hard-disabled. A real provider is a separate production project. |
| Authentication | The FYP stabilization can retain bearer tokens temporarily, but production release requires an HTTP-only cookie/session design and CSRF protection. |
| Test data | All state-changing remediation tests continue against an isolated database and synthetic records. No real CNIC or registration document is used. |

## 3. Definition of done

An issue is not complete when the code merely changes. Every finding is closed only when all applicable conditions are met:

- The root cause is changed in the appropriate layer rather than hidden with UI copy.
- Unit/component/API tests reproduce the old failure and pass with the fix.
- The frontend production build, backend syntax check, backend test suite, frontend test suite, and ML test suite pass.
- The relevant live flow is retested in Chrome at 1440×900 and 390×844; tablet is repeated where layout is involved.
- Loading, empty, success, failure, keyboard, and unauthorized states are checked where applicable.
- Database changes include a migration or deterministic repair script and a rollback/backup note.
- Security-sensitive endpoints have explicit anonymous, wrong-role, correct-role, and cross-owner tests.
- `QA_TEST_REPORT.md` is updated with the retest result, evidence, and issue status.
- No secret, personal document, real payment data, or production record is committed as test evidence.

## 4. Delivery order and dependency map

The work should be delivered in the following order because several issues share a root cause:

```text
Baseline and safety
    |
    +-- Inspection/document data contract ------ QA-005, QA-021
    |
    +-- Shared saved-car contract --------------- QA-019
    |
    +-- AI configuration and health ------------ QA-020
    |
    +-- Shared image + async UI primitives ------ QA-001, QA-002, QA-010
    |
    +-- Shared accessible overlays/actions ------ QA-007, QA-024
    |
    +-- Responsive information architecture ----- QA-003, QA-008, QA-009, QA-011, QA-012
    |
    +-- Data provenance and copy ---------------- QA-006, QA-022, QA-023
    |
    +-- Backend/security hardening -------------- QA-004, QA-013, QA-018
    |
    +-- Payment deployment boundary ------------- QA-014, QA-015
    |
    +-- Performance/dependency maintenance ------ QA-016, QA-017
    |
    `-- Full regression and release gates
```

Recommended merge units are the work packages below. Avoid one very large change containing UI, authentication, storage, and ML dependency changes together.

## 5. Phase 0 — Baseline, change safety, and regression harness

### 5.1 Preserve the starting point

The workspace root is not currently a Git repository. Before implementation:

- Restore the project’s real repository metadata or initialize a repository at the agreed root.
- Commit the current frontend, backend, ML service, audit report, and evidence manifest as a baseline.
- Keep `_comparison_lone_er` and the remaining zip outside the implementation diff unless the team explicitly decides to archive them.
- Record sanitized environment-variable names, never values, in `.env.example` files.
- Retain the isolated QA database for state-changing regression.

### 5.2 Establish one repeatable quality gate

Run and record these commands from their respective project directories:

- Frontend: `npm test` and `npm run build`
- Backend: `npm test` and `npm run check`
- ML: `.venv\Scripts\python.exe -m pytest -q`

Add a browser E2E project, preferably Playwright, for repeatability. The live Chrome extension remains valuable for exploratory and visual review, but it is not a source-controlled regression suite. The first automated browser smoke suite should cover:

- Guest navigation and protected-route redirects
- Customer login and saved cars
- Seller booking with mocked/development email delivery
- Demo membership activation
- Two-context auction bid update
- Admin login and listing edit/cancel
- Price prediction

### 5.3 Baseline acceptance

- Existing baseline remains at backend 25/25 and ML 10/10 passing.
- Existing focused frontend tests pass in a single deterministic run; investigate or configure the previous batch timeout instead of relying only on individual-suite runs.
- Test commands exit cleanly and produce machine-readable failure status.

## 6. Phase 1 — Critical data, trust, and core-function fixes

### WP-1 — Unify saved-car behavior (QA-019, High)

**Root cause confirmed:** `UsedCarDetailPage.jsx` maintains its own `saved` state and writes `ec_wishlist` directly. Marketplace cards and `SavedCarsPage.jsx` use `useSavedCars`, which switches signed-in customers to `/member/saved-cars`.

**Files primarily affected:**

- `executive-cars-frontend-main/src/pages/UsedCarDetailPage.jsx`
- `executive-cars-frontend-main/src/hooks/useSavedCars.js`
- New `UsedCarDetailPage.test.jsx` and expanded hook/page tests

**Implementation:**

1. Remove the page-local `saved` state and both direct `localStorage` effects/functions from `UsedCarDetailPage.jsx`.
2. Consume `savedIds`, `syncing`, `toggleSaved`, and `serverBacked` from `useSavedCars`.
3. Derive the button state from `savedIds.includes(id)`.
4. Disable or mark the button busy while the initial shortlist or mutation is synchronizing.
5. Await `toggleSaved(id)` before showing success. Use account-specific copy for signed-in users and browser-shortlist copy for guests.
6. Show an error toast when synchronization fails and allow the hook’s rollback to restore the button state.
7. Consider a provider/context if independent hook instances cause duplicate fetching or transient inconsistency across mounted components. If retained as a hook, add a small request cache or explicitly reload on navigation.

**Acceptance tests:**

- Guest detail save survives navigation in the same browser.
- Signed-in detail save issues exactly one POST, appears in `/saved-cars`, and remains after refresh and a second browser session.
- Signed-in remove issues DELETE and disappears everywhere.
- A forced 500/timeout rolls back optimistic state and shows an error, never a success toast.
- Marketplace-card behavior continues to pass.

### WP-2 — Repair inspection-report truth and data invariants (QA-021, High)

**Root cause confirmed:** Status badges use `inspectionStatus`, while actions/messages use `pdfUrl`. `Car` and `Product` permit `report_available` with an empty `pdfUrl`. `seedDemo.js` creates several such records.

**Files primarily affected:**

- `executive-cars-backend-main/src/models/Car.js`
- `executive-cars-backend-main/src/models/Product.js`
- `executive-cars-backend-main/src/controllers/adminController.js`
- `executive-cars-backend-main/scripts/seedDemo.js`
- `executive-cars-frontend-main/src/components/VehicleCard.jsx`
- `executive-cars-frontend-main/src/pages/UsedCarDetailPage.jsx`
- `executive-cars-frontend-main/src/pages/auction/AuctionCarDetailPage.jsx`
- New migration/repair script and model/API/UI tests

**Implementation:**

1. Introduce one canonical report representation. With WP-3, prefer `inspectionReportAsset` metadata rather than a permanent `pdfUrl`.
2. Derive `hasInspectionReport` from the existence of a valid report asset. Do not accept `inspectionStatus=report_available` independently from an admin payload.
3. Add backend validation: a record cannot save as `report_available` without an asset; an attached report sets the derived status; removal returns it to `not_available` or `pending` according to workflow.
4. Remove `inspectionStatus` from generic admin update allowlists unless an explicit inspection workflow needs `pending`.
5. Repair seeded data. Records without an actual legal fixture report must be `not_available` or `pending`; only records with a real synthetic report fixture may say available.
6. Add a one-time database repair in dry-run and apply modes. Report counts before modifying records, back up affected IDs, and never infer that a missing report exists.
7. Make every badge, button, warning, card tag, and email derive from the same `hasInspectionReport` response field.

**Acceptance tests:**

- Model/API rejects or normalizes `report_available` without an asset.
- A record with no report shows only the amber/no-report state.
- A record with an authorized report shows only the available/download state.
- Seed operation is idempotent and creates no contradictory records.
- Existing contradictory QA record is repaired and the saved evidence scenario no longer reproduces.

### WP-3 — Make uploaded documents private (QA-005, High)

**Root cause confirmed:** Local fallback storage places all file categories in one `uploads` directory, and `server/app.js` exposes the entire directory with `express.static`. Cloudinary document uploads store direct secure URLs without application authorization.

**Files primarily affected:**

- `executive-cars-backend-main/src/config/cloudinary.js`
- `executive-cars-backend-main/server/app.js`
- `executive-cars-backend-main/src/models/Booking.js`
- `executive-cars-backend-main/src/models/Car.js`
- `executive-cars-backend-main/src/models/Product.js`
- `executive-cars-backend-main/src/controllers/bookingController.js`
- `executive-cars-backend-main/src/controllers/adminController.js`
- `executive-cars-backend-main/src/routes/admin.js`
- New authenticated document controller/routes and tests

**Implementation:**

1. Split asset classes:
   - Public vehicle images: optimized public Cloudinary image URLs or a dedicated `/uploads/public/images` fallback.
   - Private identity and inspection documents: store provider, private asset/public ID, resource type, content type, size, owner/reference ID, and upload timestamp—not a permanent public URL.
2. Configure Cloudinary document assets for authenticated/private delivery. For local development, store private files outside every static mount.
3. Remove the blanket `app.use('/uploads', express.static(...))`. If local public images remain, expose only the explicit public-image directory.
4. Add authorized download endpoints that validate role and ownership, then issue a short-lived signed Cloudinary URL or stream a local private file. Suggested lifetime: 60–300 seconds.
5. Apply the access matrix from section 2 for CNIC, registration documents, used-car reports, and auction reports.
6. Validate magic bytes as well as MIME type, reject SVG/executable/polyglot content, keep size/count limits, and generate server-side filenames.
7. Never return identity-document references from public listing, auction, or general booking DTOs.
8. Add deletion cleanup for replaced/deleted assets so Cloudinary/private disk does not retain orphaned sensitive files.
9. Inventory existing URLs. Migrate known private assets to private IDs and revoke/delete public copies. Treat unknown legacy URLs as unavailable until reviewed.

**Acceptance tests:**

- Anonymous and wrong-owner document requests return 401/403 without leaking existence or URLs.
- Correct owner/admin/member entitlement returns a short-lived authorized response.
- Expired signed URLs fail.
- Public listing images still render and cache.
- Direct `/uploads/<filename>` access to private documents returns 404.
- Invalid type, renamed executable, oversize file, and excessive file count are rejected.
- Cloudinary and local-development storage paths both pass the same authorization contract.

**Operational gate:** Until this work package passes, do not upload real CNIC or registration documents and do not describe the document flow as production-safe.

### WP-4 — Restore the AI assistant with validated configuration (QA-020, High)

**Root cause confirmed:** `chatController.js` hard-codes `llama-3.3-70b-versatile`, which the configured Groq project cannot use. The key and provider connectivity work.

**Files primarily affected:**

- `executive-cars-backend-main/src/controllers/chatController.js`
- `executive-cars-backend-main/src/routes/chat.js`
- Backend `.env.example`
- `executive-cars-frontend-main/src/components/AIAssistantWidget.jsx`
- Chat controller and widget tests

**Implementation:**

1. Replace `MODEL` with required/validated `GROQ_MODEL` configuration. Select a currently available model only after confirming that it supports the tool-calling contract used by this controller.
2. Add a chat capability/health endpoint that reports configured, provider reachable, and model usable without revealing keys or provider internals.
3. Perform a lightweight exact-model validation at startup or first use with caching. Do not make the whole backend unavailable when only chat is unavailable.
4. Validate provider responses defensively: choices, message content, tool-call arguments, timeouts, 429s, 5xx, and `model_not_found`.
5. Log a request correlation ID and safe provider error category server-side. Keep secrets, full prompts, and personal information out of logs.
6. Return a stable 503/502 application error shape. Let the widget show `Temporarily unavailable` instead of displaying `Online` before health is known.
7. Preserve the current deterministic no-key fallback only when explicitly configured for demo mode; do not silently mask a broken production model.
8. Review public chatbot auction responses together with WP-6 so guest AI queries do not bypass auction membership rules.

**Acceptance tests:**

- Available configured model returns an ordinary response.
- Used-car and auction tool calls execute and return formatted results.
- Invalid tool JSON, timeout, 429, provider 5xx, and unavailable model produce stable recovery behavior.
- Missing key behaves according to explicit demo/production mode.
- Widget badge and fallback message reflect actual service state.
- No secret appears in API responses, UI, or logs.

### WP-5 — Standardize auction imagery (QA-001, High)

**Root cause confirmed:** Live Auctions uses `VehicleImage`; Auction Dashboard and My Bids use raw `<img>` elements. Seeded records intentionally have empty image arrays.

**Files primarily affected:**

- `executive-cars-frontend-main/src/components/VehicleImage.jsx`
- `executive-cars-frontend-main/src/pages/auction/AuctionDashboardPage.jsx`
- `executive-cars-frontend-main/src/pages/auction/AuctionMyBidsPage.jsx`
- Review all remaining raw vehicle `<img>` uses

**Implementation:**

1. Replace raw auction/listing image elements with `VehicleImage`.
2. Define consistent fallback aspect ratio, icon size, background, and accessible label.
3. Keep meaningful alt text for real images and an explicit `image unavailable` label for fallbacks.
4. Test `undefined`, empty string, invalid URL, network error, and source changes.
5. Do not insert fake third-party image URLs into seed data merely to conceal missing images.

**Acceptance tests:**

- No broken-image browser icon or raw alt-text spill appears on any auction page.
- Fallback works at desktop and mobile sizes without changing card height.
- An image that fails and is then replaced by a valid source recovers correctly.

## 7. Phase 2 — Loading, responsive design, accessibility, and clarity

### WP-6 — Enforce the auction API boundary (QA-004, High)

**Root cause confirmed:** `src/routes/cars.js` exposes full `Car` documents anonymously, including detail records, while all auction inventory pages are capability-protected in React.

**Files primarily affected:**

- `executive-cars-backend-main/src/routes/cars.js`
- `executive-cars-backend-main/src/controllers/carController.js`
- `executive-cars-backend-main/src/middleware/auth.js`
- `executive-cars-backend-main/src/middleware/memberOnly.js`
- `executive-cars-backend-main/src/controllers/chatController.js`
- Backend authorization/API tests

**Implementation:**

1. Apply `protect` and `memberOnly` to detailed car list/detail routes, or relocate them beneath an explicit `/api/member/auctions` namespace. Prefer the explicit namespace for long-term clarity.
2. Return DTOs with only required auction fields. Exclude `demoKey`, unrestricted seller email, internal ownership fields, and bidder identity details.
3. Keep a separate public teaser endpoint only if the public gate page genuinely needs it; return a deliberately minimal schema.
4. Ensure admin continues through `/api/admin/cars` and seller ownership views through `/api/seller/...`.
5. Prevent the public AI endpoint from returning protected live-auction details. It may explain membership or provide a sanitized public teaser.
6. Keep bid history protected and masked as it currently is; add regression coverage.

**Acceptance tests:**

- Anonymous detailed list/detail: 401.
- Signed-in customer without active membership: 403.
- Active member: 200 with approved fields only.
- Seller/customer cannot retrieve another user’s private data.
- Admin and seller workflows continue through their intended endpoints.
- Chat cannot be used as an authorization bypass.

### WP-7 — Correct all misleading loading and empty states (QA-002 and QA-010, Medium)

**Root cause confirmed:** Auction Dashboard renders initialized zero values immediately; Used Cars renders a computed zero count while loading; My Bids renders its empty state independently from `loading`.

**Files primarily affected:**

- `executive-cars-frontend-main/src/pages/auction/AuctionDashboardPage.jsx`
- `executive-cars-frontend-main/src/pages/auction/AuctionMyBidsPage.jsx`
- `executive-cars-frontend-main/src/pages/UsedCarsPage.jsx`
- Shared `Feedback.jsx`/new async-state helpers

**Implementation:**

1. Add explicit dashboard `loading` state covering all three requests. Render statistic and card skeletons until the required data settles.
2. Do not substitute zero or an em dash for unknown values. Render zero only after a successful response says zero.
3. In Used Cars, replace the count with a loading label/skeleton until inventory loads.
4. In My Bids, use mutually exclusive `loading`, `error`, `empty`, and `content` branches. Do not render empty copy while loading.
5. On partial dashboard failure, either show the successful sections with labelled unavailable states or fail the combined dashboard consistently; never mix stale zero values with an error banner.
6. Preserve current data during refresh when appropriate and expose `aria-busy`/live status for assistive technology.

**Acceptance tests:**

- Delayed API responses never show false zero/empty assertions.
- Genuine empty responses show the correct empty state after loading.
- One rejected dashboard request produces a clear partial/full failure state.
- Retry transitions from error to skeleton to settled content.

### WP-8 — Redesign My Bids for mobile (QA-003, High; supports QA-001)

**Primary file:** `executive-cars-frontend-main/src/pages/auction/AuctionMyBidsPage.jsx`

**Implementation:**

1. Use a stacked card below the `sm` breakpoint rather than forcing image, identity, bid values, status, and action into one row.
2. Give the image/fallback a predictable mobile aspect ratio.
3. Put vehicle identity and status in a wrapping header; do not rely on truncation to communicate the auction.
4. Present My bid, Current bid, and Time remaining in a small labelled grid.
5. Make Rebid/View full-width or clearly reachable on mobile.
6. Allow filter tabs to scroll or wrap and reduce the three-stat card padding/type scale at 390 px.
7. Verify long make/model/year names, seven/eight-digit PKR amounts, all statuses, and missing images.

**Acceptance tests:**

- At 320, 390, 768, and 1440 px, no content overlap or document-level overflow occurs.
- Full vehicle identity, current bid, personal bid, status, time, and action remain available without horizontal scrolling.
- Keyboard focus order follows the visual order.

### WP-9 — Replace inaccessible admin overlays and controls (QA-007 Medium; QA-024 High)

**Root cause confirmed:** `AdminUsedCarsListPage.jsx` and `AdminAuctionListPage.jsx` duplicate custom fixed `<div>` overlays. The shared `Modal`/`Drawer` is better but still lacks a complete focus trap, focus restoration, unique label IDs, and background inertness.

**Files primarily affected:**

- `executive-cars-frontend-main/src/components/ui/Overlays.jsx`
- New `IconButton.jsx` or an extended `Button.jsx`
- `executive-cars-frontend-main/src/pages/admin/AdminUsedCarsListPage.jsx`
- `executive-cars-frontend-main/src/pages/admin/AdminAuctionListPage.jsx`
- Audit other administrator icon actions

**Implementation:**

1. Complete shared Modal/Drawer behavior:
   - Unique `aria-labelledby` and optional `aria-describedby` IDs via `useId`
   - Initial focus on the first meaningful control or supplied ref
   - Tab/Shift+Tab focus trap
   - Escape dismissal when safe
   - Background inertness and body scroll lock
   - Restoration to the exact trigger on close
   - Portal rendering to avoid stacking-context defects
2. Replace used-car edit/delete overlays with shared Drawer and ConfirmationDialog.
3. Replace auction edit/delete/results overlays and `window.confirm` with the same primitives.
4. Add accessible names such as `Edit Toyota Corolla` and `Delete Toyota Corolla` to every icon-only action.
5. Associate each input with its label using stable IDs/FormField and connect errors through `aria-describedby`.
6. Ensure destructive dialogs name the target, identify consequences, disable double submission, and retain focus while loading.
7. Add `eslint-plugin-jsx-a11y` or an equivalent static rule set so unnamed interactive controls fail CI.

**Acceptance tests:**

- Role/name queries find every action and field.
- Opening moves focus inside; Tab and Shift+Tab cannot escape; Escape closes; focus returns to the trigger.
- Screen-reader structure exposes one labelled dialog.
- Background controls cannot be clicked or focused while modal.
- Save, cancel, failure, and destructive-confirmation behavior still works.

### WP-10 — Make seller/admin data usable on mobile (QA-008, Medium)

**Files affected:**

- `SellerBookingsPage.jsx`
- `SellerAuctionStatusPage.jsx`
- `AdminUsersPage.jsx`
- `AdminBookingsPage.jsx`
- `AdminAuctionListPage.jsx`
- `AdminUsedCarsListPage.jsx`

**Implementation:**

1. Keep semantic tables at desktop widths.
2. Below the chosen breakpoint, render compact cards or definition lists with identity, primary status, key values, and actions visible without horizontal scrolling.
3. Extract a shared responsive record-list pattern to avoid six unrelated implementations.
4. If any secondary table remains horizontally scrollable, add an explicit scroll affordance, sticky identity/actions, and keyboard-accessible container.
5. Preserve status filters, sort/search behavior, empty states, and action names in both layouts.

**Acceptance tests:**

- No essential action or status requires horizontal scrolling at 320/390 px.
- Desktop tables retain headers and alignment.
- Same filtered record count and actions appear in mobile and desktop representations.
- Voice/screen-reader labels do not duplicate hidden desktop controls.

### WP-11 — Align Price Predictor validation and accessibility (QA-006, Medium)

**Root cause confirmed:** A verified catalog vehicle conditionally requires a variant, but the label does not expose a required marker and the variant Select does not receive its field error.

**Files primarily affected:**

- `executive-cars-frontend-main/src/pages/PricePredictorPage.jsx`
- `executive-cars-frontend-main/src/components/ui/FormControls.jsx`
- `PricePredictorPage.test.jsx`

**Implementation:**

1. Retain the intended conditional contract: variant is required when a verified make/model/year supplies verified variants; it remains optional for dataset-only/manual entries.
2. Pass `required` and `error={fieldErrors.variant}` to FormField/Select in the required case.
3. Use copy such as `Variant *` and a hint explaining that it determines engine/transmission for verified catalog vehicles.
4. Extend FormField/control primitives so hint/error IDs are referenced by `aria-describedby`; keep `aria-invalid=true` on invalid fields.
5. Move focus to the first invalid field or an error summary containing links after submission.

**Acceptance tests:**

- Verified vehicle without variant shows a field-level error and accessible invalid state.
- Dataset-supported vehicle can predict with a blank optional variant when other required specifications are present.
- Selecting a variant still derives its specifications and changing identity clears dependent values.

### WP-12 — Improve Data & Models layout and provenance (QA-009 and QA-023, Medium)

**Root cause confirmed:** The page puts import and model management side by side at XL width, uses `break-all` for version IDs, and labels MongoDB `VehicleRecord` count as generic usable rows while registry versions report their historical dataset sizes.

**Files primarily affected:**

- `executive-cars-frontend-main/src/pages/admin/AdminDataModelsPage.jsx`
- `executive-cars-backend-main/src/controllers/datasetController.js`
- `executive-cars-backend-main/src/controllers/modelController.js`
- `ml-service/app/training.py`
- Existing registry metadata/backfill script

**Implementation:**

1. Rename the summary to `Admin-imported training rows` and add explicit text: the Train action uses these MongoDB rows.
2. Show active-model provenance separately: original dataset name/source category, immutable fingerprint, dataset rows, trained rows, training date, model version, and metrics.
3. Extend registry entries/API responses with safe provenance fields. Backfill existing versions from each version’s `metadata.json` where possible; show `Legacy metadata unavailable` rather than guessing.
4. Stack Import and Model Training until very wide layouts, and place model actions in their own row.
5. Display shortened version IDs with full accessible text/tooltips and copy action instead of aggressive `break-all`.
6. Use responsive model-version cards on narrower admin widths or a table with deliberate minimum widths/sticky action column.
7. Add a disabled-button explanation when fewer than 30 imported rows exist.

**Acceptance tests:**

- An administrator can state which dataset the active model used and which dataset a new Train action will use.
- Zero imported rows and a 72,179-row active model no longer appear contradictory.
- Layout remains scannable at 390, 768, 1024, and 1440 px.
- Legacy registry records render safely when optional provenance is absent.

### WP-13 — Prevent the floating assistant from obscuring content (QA-011, Medium)

**Files primarily affected:**

- `executive-cars-frontend-main/src/App.jsx`
- `executive-cars-frontend-main/src/components/AIAssistantWidget.jsx`
- Shared layout/footer styles

**Implementation:**

1. Replace the current prefix list with an explicit route policy. Recommended visibility: home, used-car marketplace/detail, sell guidance, and price predictor. Exclude login/signup/reset, legal, error, payment, admin, seller portal, and auction portal routes.
2. At mobile width, use a bottom sheet or viewport-bounded panel (`max-height` using dynamic viewport units) rather than a fixed 480 px desktop panel.
3. Respect `env(safe-area-inset-bottom)` and reserve sufficient bottom space on pages where the trigger is present.
4. Ensure the trigger does not cover sticky CTAs, cookie/accessibility controls, or modal content.
5. Apply accessible dialog/focus behavior to the open chat panel and announce new assistant messages politely.

**Acceptance tests:**

- Trigger is absent from excluded routes.
- No important content/action is hidden at 320/390 px or desktop.
- Chat opens, traps/restores focus appropriately, and remains usable with the virtual keyboard.

### WP-14 — Verify and normalize legal-page navigation (QA-012, Medium)

**Important analysis note:** Current source renders the same `LegalPage` component with `Navbar` and `Footer` for both routes. This finding must be reproduced cleanly before changing layout code; it may involve breakpoint/menu state, lazy-loading timing, or stale evidence rather than separate templates.

**Implementation:**

1. Add a component test that renders both `type="privacy"` and `type="terms"` and asserts the same landmarks/navigation.
2. Reproduce both routes from a clean guest session at all three audited viewports after load has settled.
3. If the mismatch reproduces, isolate whether Navbar responsive state, route transition state, or CSS stacking/visibility causes it, then fix the shared cause.
4. If it does not reproduce, retain the parity test, capture replacement evidence, and close the finding as not reproducible in the current build rather than making speculative markup changes.

**Acceptance tests:**

- Privacy and Terms expose identical header/footer landmarks and return navigation at every supported viewport.
- Direct load, client-side navigation, refresh, and browser Back behave consistently.

### WP-15 — Correct singular bid copy (QA-022, Low)

**Files primarily affected:**

- `AuctionLiveAuctionsPage.jsx`
- `AuctionCarDetailPage.jsx`
- `AuctionDashboardPage.jsx` and any other bid-count renderers found by search

**Implementation:**

Create a small shared formatter such as `formatBidCount(count)` that returns `0 bids`, `1 bid`, and `n bids`. Use it in all auction surfaces and accessible labels.

**Acceptance tests:** zero, one, and multiple bids render correct grammar everywhere.

## 8. Phase 3 — Authentication, environment, and payment boundaries

### WP-16 — Replace localStorage JWTs for production (QA-013, Production risk)

**Current flow affected:** `authContext.jsx`, `api.js`, `socket.js`, backend login responses, `auth` middleware, and Socket.IO handshake all depend on a bearer token stored in `localStorage`.

**Implementation:**

1. Prefer serving frontend and API under the same site in deployment.
2. Set the signed access/session token as `HttpOnly`, `Secure` in production, and appropriate `SameSite` cookie from login/register endpoints. Do not return it to JavaScript.
3. Add `/api/auth/session` to restore the current user and `/api/auth/logout` to invalidate/clear the cookie.
4. Configure Axios `withCredentials`, remove the token request interceptor, and keep only non-sensitive user display state in memory. `AuthProvider` needs an explicit initial session-loading state.
5. Add CSRF protection for state-changing cookie-authenticated endpoints using same-site deployment plus an origin check and a CSRF token strategy.
6. Update Socket.IO to authenticate via the protected cookie when same-site, or issue a very short-lived socket-specific token from an authenticated endpoint. Do not reintroduce a long-lived token into localStorage.
7. Define token rotation/expiry and ensure password change/reset and account deletion invalidate existing sessions if the chosen session model supports it.
8. Run this as an isolated migration because it affects every protected flow and CORS configuration.

**Acceptance tests:**

- No auth token is readable from localStorage/sessionStorage.
- Refresh restores a valid session without flashing protected content incorrectly.
- Logout clears HTTP and Socket.IO access.
- Missing/expired/tampered cookie returns 401.
- Cross-site state-changing requests fail CSRF/origin protection.
- Customer, auction, seller, admin, password, and live-bid flows all regress successfully.

### WP-17 — Harden demo/development feature gates (QA-018, Production risk)

**Files primarily affected:**

- Frontend Login/Admin Login demo helpers
- `BecomeSellerPage.jsx` development OTP display
- Backend auction-membership, email, auth, booking, and server startup configuration
- Vite and backend environment validation

**Implementation:**

1. Introduce an explicit application mode (`APP_MODE=demo|production`) in addition to `NODE_ENV`.
2. Make frontend demo helpers require both `import.meta.env.DEV` or an explicitly branded demo build and `VITE_ENABLE_DEMO_ACCOUNTS=true`.
3. Keep demo credentials out of production bundles. Prefer a non-production backend fixture endpoint or build-time dead-code elimination over shipping hard-coded credentials in component source.
4. Keep OTP/reset-link response fields impossible in production and add response-shape tests.
5. Add startup validation that refuses a production mode with development email delivery, demo-admin seeding, placeholder secrets, unsafe client origins, or an unsupported payment configuration.
6. Display a persistent `Demonstration system — no real payment` environment banner in deployed demo builds.
7. Document the exact safe demo configuration and exact production prohibitions in `.env.example` and deployment documentation.

**Acceptance tests:**

- Production build contains no demo credential strings or demo account buttons.
- Production API never returns `devOtp` or `developmentResetUrl`.
- Unsafe production combinations fail startup with a clear configuration error.
- Demo mode retains the deliberate FYP experience and labels it accurately.

### WP-18 — Keep demo payment honest and remove dormant Stripe risk (QA-014 and QA-015)

**Direction from the project owner:** Do not use Stripe. Continue the current demo flow.

**Implementation now:**

1. Remove or hard-disable `/create-checkout-session`, `/verify-session`, and `/payments/webhook` from the active router/app when the project is in demo scope.
2. Prefer removing the unused Stripe dependency and unreachable controller/UI branches from this FYP branch so an accidental environment value cannot activate an untested provider.
3. Keep `/demo-complete` available only in explicit demo mode, authenticated, with price/plan/expiry set exclusively by the server as it is now.
4. Make demo payment records and UI copy unambiguously non-financial: no card, no charge, no receipt language that implies settlement.
5. Add an idempotency guard to demo completion so repeat requests cannot create duplicate payment records or extend active membership; current active-subscription 409 behavior should be covered by tests.
6. A production mode must refuse to start or disable membership purchasing until a supported real provider is configured.

**Future real-payment project:**

- Select a provider that legally and reliably supports the Pakistan deployment.
- Create a provider-neutral payment service, immutable transaction table, unique provider event/session ID, verified webhook signature, idempotent event processing, amount/currency/plan validation, audit trail, refund/cancellation policy, and reconciliation job.
- Activate membership once for a unique successful transaction. Replaying a verification or webhook must return the existing result without changing dates.
- This future work closes the production payment blocker; it is not part of the current demo-payment implementation and must not use Stripe unless the owner changes direction.

**Acceptance tests now:**

- Anonymous demo completion is 401.
- First eligible completion activates one year and records one demo event.
- Repeat completion returns conflict/idempotent result without extending expiry or duplicating records.
- Stripe routes return 404/disabled and no Stripe code is reachable.
- Production mode cannot expose demo completion.

## 9. Phase 4 — Performance and dependency maintenance

### WP-19 — Optimize the hero asset and LCP path (QA-016, Production risk)

**Root cause confirmed:** `HomePage.jsx` imports a 1746×901 PNG of 1,785,061 bytes as a CSS background, so it cannot provide responsive `srcset` selection.

**Files primarily affected:**

- `executive-cars-frontend-main/src/assets/executive-cars-hero.png`
- Generated WebP/AVIF variants
- `executive-cars-frontend-main/src/pages/HomePage.jsx`
- Build/performance budget configuration

**Implementation:**

1. Generate visually reviewed AVIF/WebP variants around 640, 960, and 1440 px, retaining the original only as a fallback/source asset.
2. Replace the CSS background with an absolutely positioned semantic-neutral `<picture>`/`<img>` so `srcset` and `sizes` work while preserving the overlay/crop.
3. Mark the real LCP image appropriately (`fetchPriority="high"`, no lazy loading); do not preload every variant.
4. Set explicit dimensions/aspect ratio to prevent layout shift.
5. Add bundle/asset budgets. Initial targets: mobile hero under roughly 100–150 KB, desktop hero under roughly 250–350 KB, subject to visual comparison.
6. Measure cold-cache LCP at mobile throttling after implementation; optimize fonts and critical CSS only if the image change is insufficient.

**Acceptance tests:**

- Visual crop remains correct at mobile, tablet, and desktop.
- Browser selects an appropriately sized modern asset.
- No layout shift is introduced.
- Production build no longer ships the 1.78 MB PNG as the default hero request.

### WP-20 — Remove ML deprecation noise through compatibility fixes (QA-017, Production risk)

**Root cause confirmed by rerun:** 10 tests pass with 2,897 warnings. Of these, 2,896 are `joblib` NumPy-pickle warnings caused by setting array shape under installed NumPy 2.5.2/joblib 1.5.3 paths; one is FastAPI/Starlette TestClient’s deprecated `httpx` integration.

**Files primarily affected:**

- `ml-service/requirements.txt`
- A new reproducible constraints/lock file
- Serialized model artifacts if compatibility requires regeneration
- `ml-service/tests/test_api.py`
- CI warning policy

**Implementation:**

1. Create a compatibility branch and test the supported combinations rather than globally suppressing warnings.
2. Immediate safe option: constrain NumPy below the version that triggers the joblib path, if all prediction/training tests and model artifacts pass. Preferred long-term option: upgrade to a joblib/NumPy combination where the deprecation is fixed, then reserialize model artifacts in that environment.
3. Verify loading every registered model artifact, not only the active model, before changing the dependency range.
4. Replace the deprecated TestClient path with the officially supported current ASGI test client/transport for the selected FastAPI/Starlette stack, or pin a mutually supported set until migration is complete.
5. Produce a fully pinned reproducible environment file with hashes/version review appropriate to the project.
6. Add a CI warnings policy: fail on new application/runtime deprecations, with a short documented temporary allowlist only if an upstream warning cannot yet be removed.

**Acceptance tests:**

- ML 10/10 tests pass with zero unexpected deprecation warnings.
- Active and every rollback model artifact loads and predicts.
- Training a small legal fixture, activating it, and rolling back pass in the target environment.
- Prediction outputs remain within documented tolerances; no silent model serialization incompatibility occurs.

## 10. Traceability matrix

| Finding | Severity/type | Work package | Primary owner | Required closure evidence |
|---|---|---:|---|---|
| QA-001 | High | WP-5 | Frontend | Broken/missing image component tests and responsive screenshots |
| QA-002 | Medium | WP-7 | Frontend | Delayed dashboard API test showing skeleton then settled values |
| QA-003 | High | WP-8 | Frontend/UX | 320/390/768/1440 My Bids evidence for all statuses |
| QA-004 | High | WP-6 | Backend/Security | Anonymous 401, inactive 403, active 200, DTO field assertions |
| QA-005 | High | WP-3 | Backend/Security | Private asset authorization matrix and direct-URL denial |
| QA-006 | Medium | WP-11 | Frontend | Conditional variant validation and accessibility tests |
| QA-007 | Medium | WP-9 | Frontend/A11y | Named controls/labels plus static a11y gate |
| QA-008 | Medium | WP-10 | Frontend/UX | Six mobile record surfaces without hidden actions |
| QA-009 | Medium | WP-12 | Frontend/UX | Responsive Data & Models screenshots and usability check |
| QA-010 | Medium | WP-7 | Frontend | Mutually exclusive loading/error/empty/content tests |
| QA-011 | Medium | WP-13 | Frontend/UX | Route policy tests and overlap screenshots |
| QA-012 | Medium | WP-14 | Frontend | Legal route parity test and replacement evidence |
| QA-013 | Production risk | WP-16 | Full stack/Security | No JS-readable auth token; CSRF/session/socket regression |
| QA-014 | Production blocker | WP-18 | Backend/Product | Explicit demo boundary; real provider remains separate gate |
| QA-015 | Dormant risk | WP-18 | Backend | Stripe routes/code unreachable or removed; no replay path |
| QA-016 | Performance risk | WP-19 | Frontend | Asset-size budget and cold-cache LCP evidence |
| QA-017 | Maintenance risk | WP-20 | ML/DevOps | 10/10 tests and zero unexpected warnings |
| QA-018 | Production risk | WP-17 | Full stack/DevOps | Unsafe production config rejection and bundle inspection |
| QA-019 | High | WP-1 | Frontend | Cross-page/device server synchronization test |
| QA-020 | High | WP-4 | Backend/Frontend | Exact-model health plus response/tool/failure tests |
| QA-021 | High | WP-2 + WP-3 | Full stack/Data | Schema invariant, migration report, consistent UI evidence |
| QA-022 | Low | WP-15 | Frontend | 0/1/many formatter tests |
| QA-023 | Medium | WP-12 | Full stack/ML | Provenance metadata/API/UI assertions |
| QA-024 | High | WP-9 | Frontend/A11y | Dialog role, trap, Escape, inert background, focus restore |

## 11. Recommended implementation slices

### Slice A — Immediate FYP trust repair

Implement WP-1, WP-2, WP-4, WP-5, WP-7, WP-11, and WP-15. This removes the false saved-car success, AI outage, report contradiction, broken imagery, false-zero states, predictor confusion, and visible grammar defect.

**Estimated effort for one experienced developer:** approximately 4–7 focused working days including tests and live retesting.

### Slice B — Mobile and accessibility quality

Implement WP-8, WP-9, WP-10, WP-12, WP-13, and WP-14.

**Estimated effort:** approximately 5–8 working days including responsive and keyboard regression.

### Slice C — Safe data and environment boundary

Implement WP-3, WP-6, and WP-17. WP-3 is the largest uncertainty because existing Cloudinary assets and deployment storage behavior must be inventoried.

**Estimated effort:** approximately 5–9 working days including migrations and authorization tests.

### Slice D — Production foundation

Implement WP-16, WP-18, WP-19, and WP-20.

**Estimated effort excluding a real payment gateway:** approximately 5–9 working days. A new real payment-provider integration, compliance review, reconciliation, and failure testing should be estimated separately after provider selection.

**Overall one-developer estimate:** roughly 19–33 focused working days for all current code remediations, full regression, and evidence updates, excluding an actual production payment integration. A team can parallelize frontend responsive work, backend document security, and ML compatibility after Phase 0, but the final regression must use integrated builds.

## 12. Regression matrix after implementation

### Automated

- Frontend unit/component suites, including every new regression case
- Frontend production build with asset budget
- Backend syntax and complete API tests using isolated/in-memory MongoDB
- Authorization matrix for guest, customer, inactive member, active member, owner, wrong owner, and admin
- Upload type/size/privacy tests for local and mocked Cloudinary modes
- Chat provider mocks for ordinary, tool, unavailable, rate-limit, timeout, and malformed responses
- Payment demo idempotency and environment-gate tests
- ML prediction/training/model-registry tests with warnings policy
- Browser E2E smoke suite across at least guest, customer, active auction member, and admin

### Live Chrome

- Repeat all 42 route patterns in relevant access states.
- Re-run the visual matrix at 1440×900, 768×900, and 390×844.
- Repeat saved cars from card and detail, including refresh and second tab.
- Repeat normal AI and inventory/auction tool questions.
- Repeat two-user bidding, self-bid rejection, outbid alert, stale simultaneous bid, and reconnect/resubscribe.
- Repeat every admin overlay with keyboard only.
- Repeat upload/download with synthetic image, synthetic report, and synthetic identity fixtures after Chrome local-file permission is available.
- Confirm private document direct URLs fail in a signed-out tab.
- Repeat demo payment twice to verify non-extension/idempotency.
- Inspect console errors, failed requests, CORS, CSP, cookie flags, and response headers.
- Measure cold-cache home loading and mobile layout.

## 13. Release gates

### FYP demonstration gate

- QA-001, QA-002, QA-003, QA-006, QA-007, QA-009, QA-010, QA-011, QA-019, QA-020, QA-021, QA-022, QA-023, and QA-024 are fixed or explicitly waived with visible limitations.
- Demo payment is clearly labelled and Stripe remains unused.
- Only synthetic documents/data are used if WP-3 is not complete.
- Core live flows and all automated baseline commands pass.

### Controlled hosted-demo gate

- WP-3, WP-6, and WP-17 are mandatory.
- No private document is publicly addressable.
- Auction API policy is enforced server-side.
- Demo credentials/OTP behavior is intentionally enabled only for the branded demo environment.
- Database, Cloudinary, SMTP, Groq, allowed origins, rate limits, backups, and secret rotation are documented.

### Production gate

- All 24 findings meet their closure criteria.
- WP-16 authentication migration and CSRF protection pass.
- Demo payment cannot activate in production; an approved real provider is implemented separately before charging users.
- Performance and ML dependency budgets pass.
- No unresolved high finding, no public sensitive asset, no demo credential in the bundle, and no unexpected test warning remains.
- Final QA report is signed off against the deployed production configuration, not only the Vite development server.

## 14. Rollback and migration safeguards

- Back up affected MongoDB collections before report-asset or authentication migrations.
- Run every data repair first in dry-run mode and record affected IDs/counts without document contents.
- Make migrations idempotent and safe to re-run.
- Keep legacy read compatibility only for the shortest necessary transition; never fall back to serving a legacy private URL publicly.
- Deploy backend support before frontend code that requires new DTO/cookie/asset fields.
- For authentication migration, provide a controlled logout/re-login transition rather than trying to transform localStorage tokens silently.
- For ML dependency changes, preserve the current virtual environment/model artifacts until every registered version loads in the new environment.
- For hero assets, retain the original source image for rollback but do not ship it as the default production request.

## 15. Reporting workflow during implementation

For every work package:

1. Mark it `In progress` in this plan or the project tracker.
2. Add regression tests that demonstrate the old failure.
3. Implement the smallest coherent fix.
4. Run focused tests, then the relevant project suite.
5. Rebuild and test the integrated application in Chrome.
6. Save sanitized evidence under `qa-evidence/remediation/<qa-id>/`.
7. Update the corresponding finding in `QA_TEST_REPORT.md` to `Fixed — awaiting retest`, `Verified fixed`, `Partially fixed`, `Not reproducible`, or `Accepted risk`.
8. Record any changed interpretation rather than deleting historical audit evidence.

The remediation effort is complete only when the traceability matrix has no unreviewed row and the selected release gate is satisfied.
