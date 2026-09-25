# Executive Cars — Comprehensive QA Test Report

**Report status:** Completed for the local FYP/demo scope; production follow-ups remain
**Last updated:** 2026-09-17 (Asia/Karachi)
**Test target:** Current implementation in this workspace  
**Tester:** Codex, using the configured Chrome extension plus direct service/test commands  

## 1. Purpose and scope

This report records the testing performed on the Executive Cars final-year project. It is intentionally evidence-based: completed items are separated from pending items, environment limitations, and code-review risks.

The agreed scope includes:

- Complete customer, seller, auction-member, and administrator journeys.
- Guest, regular-user, premium-member, auction-bidder, seller, and administrator access states.
- Desktop, tablet, and mobile visual review.
- Validation, loading, empty, success, error, and recovery states.
- MongoDB Atlas, Cloudinary, SMTP configuration, Groq, backend, frontend, and ML-service connectivity.
- Stateful tests using synthetic data in an isolated Atlas database.
- Production-readiness, accessibility, security, performance, and UX review.
- Stripe is explicitly excluded. The current no-card demonstration payment flow is the payment target.

## 2. Safety and test isolation

State-changing tests are running against the isolated Atlas database:

`executive_cars_e2e_codex_20260902`

The backend process receives this database name at launch, so synthetic test records do not intentionally alter the project's normal application database. Email delivery remains in development mode, and the payment mode is `demo`.

No secrets are written to this report. Stripe credentials were not imported, validated, or used.

### Synthetic records created so far

| Record | Details | Result |
|---|---|---|
| Customer account | `Codex QA User`, synthetic `.test` email and Pakistani-format test phone | Created successfully |
| Auction-path account | `Codex Auction QA`, separate synthetic `.test` email and Pakistani-format test phone | Created successfully through `/auction/signup` |
| Seller profile | Synthetic phone, CNIC-format value, and test address | Updated successfully |
| Inspection booking | Demo User; Toyota Corolla QA 2020; 2026-09-10; Rawalpindi Stadium Road; development OTP | Submitted successfully |
| Auction membership | Demo User; PKR 4,999 test checkout; no card or money | Activated successfully |
| Auction-path membership | Codex Auction QA; PKR 4,999 test checkout; no card or money | Activated successfully |
| Bid | Demo User; Honda Civic 2020; PKR 4,900,000 | Recorded successfully |
| Cross-user bid sequence | Codex Auction QA and Auction Bidder demo member; Honda Civic 2020; final test bid PKR 5,150,000 | Real-time updates and outbid alert verified |
| Used-car listing | Toyota Corolla 2020; PKR 5,250,000; assigned to Codex QA User | Created successfully |
| Auction listing | Honda Civic 2021; assigned to Codex QA User | Created successfully |
| Auction update | Model changed to Honda Civic QA; price changed to PKR 4,820,000 | Updated successfully |
| Booking status | New Toyota Corolla QA booking | Changed from Pending to Approved |

No test records have been deleted.

## 3. Runtime environment

| Service | Command style | Address | Latest verified state |
|---|---|---|---|
| Frontend | `npm` development command | `http://127.0.0.1:5173` | HTTP 200 |
| Backend | `npm` development command | `http://127.0.0.1:5082` | Health endpoint HTTP 200 |
| ML service | Python virtual-environment command | `http://127.0.0.1:8000` | Health endpoint HTTP 200 |
| MongoDB | Atlas test database | Isolated database named above | Authenticated ping and application reads/writes passed |

The user requested that the project be run through direct npm and Python commands, not through repository wrapper scripts. That requirement has been followed.

### ML metadata verified

- Model loaded: yes.
- Model: `extra_trees_320_regularized`.
- Version: `ec-20260820-100203-13d9e2ba`.
- Training rows: 57,743.
- Dataset rows: 72,179.

### Cloud configuration verified without revealing secrets

| Integration | Verification performed | Result |
|---|---|---|
| MongoDB Atlas | Authenticated ping and application CRUD in isolated DB | Pass |
| Cloudinary | Credential-authentication check | Pass |
| Gmail SMTP | Authentication check | Pass |
| Groq | Models endpoint request | HTTP 200 |
| Stripe | Intentionally excluded | Not tested |

The current backend `.env` received the project-specific MongoDB, Cloudinary, SMTP, and Groq values from the team's alternate implementation. `PAYMENT_MODE=demo` and `EMAIL_DELIVERY_MODE=development` remain intentional.

## 4. Automated baseline

The following baseline was completed before the live state-changing pass:

| Area | Result |
|---|---|
| Backend tests | 25/25 passed |
| ML tests | 10/10 passed |
| Frontend production build | Passed; 1,711 modules transformed |
| Backend JavaScript syntax check | 65 files passed |
| Frontend focused tests | Sell Car 1/1 and Price Predictor 9/9 passed individually |

One frontend batch run encountered environment timeouts; the affected focused suites passed when run individually. ML tests emitted approximately 2,897 deprecation warnings, which does not currently fail the suite but is a maintenance risk.

### Remediation verification batch — 2026-09-03

| Gate | Result |
|---|---|
| Frontend complete test suite | 14 files, 34/34 tests passed |
| Frontend production build | Passed; 1,712 modules transformed |
| Backend complete test suite | 31/31 tests passed against MongoDB Memory Server |
| Backend JavaScript syntax check | 69 files passed |
| Focused frontend remediation tests | 21/21 passed across saved cars, report truth, predictor validation, image fallback, bid copy, dashboard loading, and My Bids loading |
| Focused backend remediation tests | 6/6 passed across report invariants/serialization and AI model handling |

The first complete backend run needed a one-time MongoDB Memory Server binary download. Its cache is stored in the workspace at `.mongodb-binaries`; the successful rerun used an ephemeral test database and did not touch application records.

## 5. Route inventory and access-control coverage

The frontend defines 42 route patterns, including the wildcard route. The route source was enumerated from `executive-cars-frontend-main/src/App.jsx`.

### Public and customer routes

- `/`
- `/login`
- `/forgot-password`
- `/reset-password`
- `/signup`
- `/account`
- `/sell-car`
- `/become-a-seller`
- `/used-cars`
- `/used-cars/:id`
- `/price-predictor`
- `/booking-confirmed`
- `/privacy`
- `/terms`
- `/saved-cars`

### Auction routes

- `/auction`
- `/auction/signup`
- `/auction/payment`
- `/auction/payment-success`
- `/auction/dashboard`
- `/auction/live`
- `/auction/my-bids`
- `/auction/won-cars`
- `/auction/profile`
- `/auction/car/:id`

### Seller routes

- `/seller/dashboard`
- `/seller/book-inspection`
- `/seller/bookings`
- `/seller/listings`
- `/seller/auction-status`
- `/seller/profile`

### Administrator routes

- `/admin`
- `/admin/login`
- `/admin/dashboard`
- `/admin/users`
- `/admin/bookings`
- `/admin/data-models`
- `/admin/auction-list`
- `/admin/used-cars-list`
- `/admin/upload-auction`
- `/admin/upload-used-car`

### Confirmed access-control behavior

| Scenario | Result |
|---|---|
| Guest opens `/booking-confirmed` | Redirected to customer login |
| Guest opens `/become-a-seller` | Redirected to customer login with booking context |
| Regular user opens auction-only dashboard/live/bids/wins/profile | Redirected to membership payment |
| Direct payment-success route without a valid session | Safe `Verification failed` state |
| Premium member opens all auction portal routes | Allowed |
| Administrator opens admin routes | Allowed |
| `/admin` while authenticated as administrator | Redirected to `/admin/dashboard` |

## 6. Visual and responsive coverage

The live browser audit executed 109 route/state iterations, plus settled-state recaptures where initial lazy-loading frames were ambiguous.

| Surface | Desktop | Tablet | Mobile |
|---|---:|---:|---:|
| Guest/public routes | 16 | 16 | 16 |
| Used-car detail | 1 | 1 | 1 |
| Regular customer/seller routes | 16 | Guest tablet baseline used | 11 |
| Premium auction routes | 7 | Guest tablet baseline used | 5 |
| Auction detail | 1 | Not separately required after responsive baseline | 1 |
| Administrator routes | 9 | Guest tablet baseline used | 8 |

Evidence is stored under:

- `qa-evidence/desktop/guest/`
- `qa-evidence/tablet/guest/`
- `qa-evidence/mobile/guest/`
- `qa-evidence/details/`
- `qa-evidence/desktop/regular/`
- `qa-evidence/mobile/regular/`
- `qa-evidence/desktop/premium/`
- `qa-evidence/mobile/premium/`
- `qa-evidence/auction-detail/`
- `qa-evidence/desktop/admin/`
- `qa-evidence/mobile/admin/`
- `qa-evidence/implementation/`

### Responsive measurements

- Guest routes showed no document-level horizontal overflow at 1440×900, 768×900, or 390×844.
- Used-car and auction detail pages showed no document-level horizontal overflow.
- Authenticated seller, auction, and admin pages showed no document-level overflow in the measured viewports.
- Several data tables intentionally create inner horizontal scroll containers on mobile. These keep the page width valid but reduce mobile usability.
- No broken `<img>` elements were found on most public pages. Broken auction images were confirmed on specific authenticated pages listed below.

## 7. Functional flows completed

### 7.1 Account and authentication

- Customer demo login: passed.
- Premium demo login: passed.
- Administrator demo login: passed with the test-runtime admin password override.
- New synthetic account creation: passed.
- Sign out and sign back in with the new account: passed.
- Protected-route redirection: passed for tested customer, auction, seller, and admin cases.

### 7.2 Customer account and seller profile

- Account dashboard rendered correct identity and capabilities.
- Synthetic seller profile edit and save: passed.
- Updated synthetic phone, CNIC-format value, and address persisted.
- Admin-created used-car and auction records assigned to the synthetic customer appeared in that customer's seller portal.

### 7.3 Inspection booking and OTP

- Three-step form progression: passed.
- Personal and vehicle-detail entry: passed.
- Native date, time, and branch selection: passed.
- Booking submission: passed.
- Development OTP modal: passed.
- OTP verification: passed.
- Success redirect to `/seller/bookings`: passed.
- New booking appeared in both seller and administrator booking tables.
- Administrator approval changed the booking to Approved.
- Document inputs are optional; booking succeeds without CNIC or registration uploads.

### 7.4 Demo payment and auction membership

- Regular user redirected to membership checkout: passed.
- Checkout clearly identified itself as Test Mode with no card collection.
- PKR 4,999 demo completion: passed.
- Payment-success page displayed the activated plan, amount, and Test payment mode.
- Auction capability became available to the user.
- The independent `/auction/signup` journey was also completed with a second synthetic account.
- That route created the unified account, advanced to the two-step annual-membership checkout, completed the PKR 4,999 demo payment, and granted auction-dashboard access.

### 7.5 Live auction and bid

- Premium live-auction list: passed.
- Auction detail page: passed.
- Bid confirmation modal: passed.
- PKR 4,900,000 bid submission: passed.
- Current highest bid changed from PKR 4,850,000 to PKR 4,900,000.
- Bid count changed from 3 to 4.
- The user's new bid appeared at the top of the live feed with a success state.
- Owner self-bid protection: passed; the premium demo owner was rejected with `You cannot bid on your own vehicle`.
- Two-member WebSocket update: passed across two Chrome tabs without reloading the listening tab.
- The first cross-user bid changed the listening tab from PKR 4,900,000 / 4 bids to PKR 4,950,000 / 5 bids and inserted the masked bidder at the top of the feed.
- Outbid notification: passed. Codex Auction QA took the lead at PKR 5,100,000; the Auction Bidder demo member then bid PKR 5,150,000. The listening tab immediately showed the new amount, 9 bids, `Ha*** just bid PKR 5,150,000!`, and `You've been outbid! Place a higher bid to stay in the lead.`
- Persisted live-state evidence: `qa-evidence/functional/cross-user-live-bid-state.png`.

### 7.6 Admin listing management

- Empty-form native validation: triggered seven invalid controls on the used-car form.
- Used-car creation without optional images/report: passed.
- New used car appeared in administrator inventory and public marketplace.
- Auction creation without optional images/report: passed.
- Native `datetime-local` fields worked through segment-by-segment browser input; direct ISO fill was rejected.
- Auction update through the edit modal: passed.
- Updated auction values appeared in the administrator list and owner seller portal.
- The synthetic inspection booking was transitioned from Approved to Rejected through the status dropdown, the counters and row updated, and the booking was then restored to Approved successfully.
- Administrator dashboard data settled to 5 members, 5 bookings, 1 active auction, 6 used cars, and 12 auction bids after initially rendering empty/zero data; this is another instance of QA-010.
- Synthetic used-car edit: passed. Price changed from PKR 5,250,000 to PKR 5,260,000 and persisted in the inventory table.
- State restoration: passed. The synthetic used-car price was restored to PKR 5,250,000.
- Used-car deletion safeguard: passed. `Delete Car?` named the Toyota Corolla and required explicit confirmation; the dialog was cancelled and the record remains intact.
- Focus/modal check on the Used Cars edit overlay: failed. Focus remained on the underlying table action, Tab moved behind the overlay, no dialog semantics were present, and Escape did not close it.

### 7.7 ML price prediction

- Dynamic make/model/year options loaded from metadata.
- A complete Toyota Corolla 2020 valuation request succeeded.
- Returned range: PKR 42.5 lacs–52.0 lacs.
- Returned midpoint: PKR 4,733,000.
- Returned factors included engine size, vehicle age, year, engine category, and transmission.
- Selecting a concrete variant automatically normalized related specifications (for example, 1.3 Gasoline mapped to 1,298 cc, Manual, Local).

### 7.8 Saved cars

- Saving the synthetic Toyota listing from its marketplace card: passed.
- The listing appeared in `/saved-cars` after server synchronization: passed.
- Removing the listing from `/saved-cars`: passed; the empty state returned.
- Saving the same listing from its detail page: failed functionally. The detail page showed a success toast and changed its button state, but `/saved-cars` remained empty.
- Temporary local and server-backed saved state created by these tests was removed.
- Persisted evidence: `qa-evidence/functional/saved-car-detail-success.png` and `qa-evidence/functional/saved-cars-empty-after-success.png`.

### 7.9 In-app AI assistant

- Widget open/close presentation: opened successfully.
- Empty-input behavior: Send remained disabled.
- User-message submission: passed at the UI layer.
- Loading/failure recovery: the page remained stable and displayed the configured support-email fallback.
- Actual AI response: failed. The backend returned an AI service error because its configured Groq model is unavailable to the project account.
- Direct provider isolation check: the configured key reached Groq successfully, and a minimal completion against an available model returned success.
- Persisted evidence: `qa-evidence/functional/ai-assistant-service-error.png`.

### 7.10 Password recovery

- Native email-format validation blocked an invalid email value.
- A reset request for the synthetic QA account returned the privacy-preserving success message.
- Development delivery exposed a local reset link only for the synthetic existing account, as configured.
- The valid synthetic reset token opened the new-password form.
- Mismatched passwords produced the inline `Passwords do not match.` alert.
- A deliberately invalid token produced `Invalid or expired reset link` without changing a password.
- An unknown synthetic email returned the same generic success copy and did not expose a reset link, preventing account enumeration through the response UI.
- No password was changed during this test batch.

### 7.11 Used-car marketplace discovery

- Text search for `Toyota`: passed; three matching listings were shown.
- Make filter for `Honda`: passed; one Honda listing was shown.
- Price sort from low to high: passed; Toyota results were ordered PKR 4.90m, 5.25m, then 6.95m.
- Grid/list view toggles: passed; each control correctly exposed its pressed state.
- Empty search state: passed with `No cars match those filters` and a clear-filter action.
- Malformed used-car detail ID: passed safely with `Car details unavailable` and `Invalid record identifier` rather than a crash.
- Save-search action: passed and clearly stated that the criteria are stored in the current browser.
- The initial `0 cars found` message displayed during loading remains covered by QA-010.

### 7.12 Auction discovery and closed-auction behavior

- Live, Upcoming, and Ended phase tabs: passed.
- Live inventory showed one auction; Upcoming showed two, including the synthetic Honda Civic QA; Ended showed two seeded auctions.
- Auction search with a non-matching term: passed with a phase-specific empty state.
- Ended-auction detail: bidding was correctly closed, the countdown was zeroed, and historical bid data remained visible.
- Malformed auction detail ID: passed safely with `Invalid record identifier` and a return link.
- The ended-auction pass exposed an inspection-metadata contradiction (QA-021) and singular bid-count copy defect (QA-022).
- Persisted evidence: `qa-evidence/functional/auction-ended-report-contradiction.png`.

### 7.13 Dataset and model administration

- Prediction service status loaded as `Model ready`.
- Active version and six registered model versions loaded with model names, dataset sizes, MAE, and R².
- Empty import submission: passed validation with `Choose a dataset, describe its source, and confirm usage rights.`
- Rights-confirmation copy explicitly warns against scraped, private, or terms-violating data.
- Train model remained disabled because the MongoDB import corpus contains 0 usable rows; the backend independently requires at least 30.
- Rollback action opened a confirmation dialog naming the previous version; cancelled without mutation.
- Older-version activation opened a confirmation dialog naming the selected version; cancelled without mutation.
- No dataset was imported and no model was trained, activated, or rolled back because local file attachment is still blocked and model-registry mutation was not necessary for validation coverage.

### 7.14 Browser diagnostic log sweep

- Customer/auction tab log history: no console warning or error entries were recorded during the tested flows.
- Administrator tab log history: no console warning or error entries were recorded during the tested flows.
- Remaining entries were expected Vite connection debug messages and the React development-build DevTools suggestion.
- The AI-assistant HTTP failure is still a confirmed functional defect (QA-020); it is handled by the widget and was not emitted as a browser-console error.

### 7.15 Read-only API boundary, error handling, CORS, and security headers

- Public marketplace endpoints `/api/cars?phase=all` and `/api/products` returned HTTP 200 without an access token, confirming the current public-data boundary rather than inferring it only from UI behavior.
- Malformed object identifiers on the car and product detail APIs returned HTTP 400 instead of causing an unhandled server failure.
- Protected administrator, member, seller, bid, and payment endpoints returned HTTP 401 when called without authentication.
- An unknown `/api/...` route returned HTTP 404.
- A request from the configured local frontend origin was accepted and returned the matching `Access-Control-Allow-Origin` header; an unapproved origin was rejected with HTTP 403.
- A request without an `Origin` header remained usable for non-browser clients.
- Normal responses included Helmet protections observed during the check, including Content Security Policy, frame protection, and `X-Content-Type-Options: nosniff`.
- These checks support QA-004 and QA-005: authentication works on sampled private endpoints, but `/api/cars` and the static `/uploads` mount still need an explicit production data-classification decision.

## 8. Confirmed defects and risks

Severity reflects likely project impact, not an external security certification.

### High priority

#### QA-001 — Broken auction images are handled inconsistently

**Observed:** Auction Dashboard and My Bids render broken image elements/alt text for seeded auctions, while Live Auctions correctly renders a designed placeholder.  
**Impact:** Visible production-quality defect and inconsistent fallback behavior. My Bids becomes especially difficult to read on mobile.  
**Evidence:** `qa-evidence/desktop/premium/03.png`, `qa-evidence/mobile/premium/01.png`, and `qa-evidence/mobile/premium/03.png`.

#### QA-003 — Mobile My Bids layout truncates and overlaps essential information

**Observed:** Vehicle names, prices, image fallbacks, status badges, and action controls compete for the same narrow row. Text is ellipsized or overlaps.  
**Impact:** Bid identity and state can be ambiguous on mobile.  
**Evidence:** `qa-evidence/mobile/premium/03.png`.

#### QA-004 — Auction/API authorization boundary requires production review

**Observed in code review:** Auction-related car data is presented as members-only in the UI, while `/api/cars` data routes are publicly reachable.  
**Impact:** UI gating alone does not enforce data confidentiality.  
**Required decision:** Decide which auction/listing fields are public and enforce that boundary in backend authorization.

#### QA-005 — Uploaded-file exposure requires production review

**Observed in code review:** The backend publicly serves `/uploads`. Inspection documents may include CNIC and registration files.  
**Impact:** Sensitive documents could be exposed if stored below a public static path or if URLs are predictable.  
**Required fix:** Private object storage, authenticated access, short-lived signed URLs, and explicit document authorization.

#### QA-019 — Used-car detail saves only to browser storage and contradicts the account shortlist

**Observed live:** While signed in as the synthetic customer, selecting **Save car** on a used-car detail page produced a `Car saved` success toast and changed the control to `Remove from saved cars`. Navigating immediately to `/saved-cars` showed `No saved cars yet`. Saving from the marketplace card did persist to the server and appeared on `/saved-cars`, so the defect is isolated to the detail-page implementation.  
**Confirmed source cause:** `UsedCarDetailPage.jsx` directly reads and writes the `localStorage` key `ec_wishlist`. It does not use the server-backed `useSavedCars` hook used by marketplace cards and `SavedCarsPage.jsx`. Signed-in users therefore receive a false success state on the detail page.  
**Impact:** A core customer action silently fails to synchronize across the application and devices.  
**Evidence:** `qa-evidence/functional/saved-car-detail-success.png` and `qa-evidence/functional/saved-cars-empty-after-success.png`.  
**Recommendation:** Use the shared `useSavedCars` hook on the detail page, render its synchronization/error state, and show success only after the API request succeeds.

#### QA-020 — In-app AI assistant is non-functional because the Groq model is unavailable

**Observed live:** Submitting `How do I book a vehicle inspection on Executive Cars?` displayed `Sorry, I'm having trouble right now. Please email info@executivecars.pk for help.`  
**Confirmed provider response:** The backend hard-codes `llama-3.3-70b-versatile`. Groq returned HTTP 404 with `model_not_found`, stating that the model does not exist or the project account cannot access it.  
**Isolation result:** The same project key listed the account's available models, and a minimal completion using `openai/gpt-oss-20b` reached the provider successfully. This rules out a missing key or general Groq-connectivity failure.  
**Impact:** Every production AI-assistant request takes the failure path, so the advertised assistant functionality is unavailable.  
**Evidence:** `qa-evidence/functional/ai-assistant-service-error.png` and `executive-cars-backend-main/src/controllers/chatController.js`.  
**Recommendation:** Move the model ID to validated environment configuration, select a tool-capable model available to the account, add a startup/provider health check for that exact model, and cover `model_not_found` with a clear operational error and monitoring.

#### QA-021 — Auction inspection status can claim a report exists when no document is attached

**Observed live:** The ended Toyota Corolla 2018 auction displayed a green `Report available` badge while the same section disabled the action as `No Report` and warned `No inspection report is attached.`  
**Confirmed source/data cause:** The badge is driven by `car.inspectionStatus === 'report_available'`, while the download and explanatory content are driven independently by `car.pdfUrl`. The data model does not enforce that `report_available` requires a non-empty report URL.  
**Impact:** Contradictory inspection claims undermine a safety-critical trust signal and may mislead bidders about due diligence.  
**Evidence:** `qa-evidence/functional/auction-ended-report-contradiction.png`.  
**Recommendation:** Enforce a single backend invariant for report availability, validate imported/seeded/admin data, and derive every UI signal from the same verified report object.

#### QA-024 — Administrator used-car overlays do not manage keyboard focus or expose dialog semantics

**Observed live:** Opening the Used Cars edit drawer left focus on the underlying unnamed table button. The overlay exposed zero `dialog`/`role="dialog"` elements, the next Tab remained behind the overlay, and Escape did not dismiss it.  
**Confirmed source:** `AdminUsedCarsListPage.jsx` implements edit/delete overlays as generic fixed-position `<div>` elements without dialog roles, accessible labels, initial focus, focus trapping, Escape handling, or focus restoration.  
**Impact:** Keyboard and screen-reader users can become disoriented, interact with obscured background controls, and may be unable to operate the edit flow reliably.  
**Recommendation:** Replace both custom overlays with the shared accessible dialog component or implement complete WAI-ARIA modal behavior, including labelled dialog semantics, initial/trapped focus, Escape dismissal, background inertness, and focus restoration.

### Medium priority

#### QA-006 — Price Predictor calls Variant optional but rejects an otherwise complete form

**Observed:** With Toyota Corolla 2020 and all other required fields selected, leaving Variant empty produced `Please correct the highlighted vehicle details.` Selecting a variant allowed prediction.  
**Impact:** Copy and validation contract disagree; users cannot tell what must be fixed.  
**Accessibility detail:** No control was exposed as `aria-invalid=true`; only a generic alert appeared.

#### QA-007 — Administrator icon actions lack accessible names

**Observed:** Edit/delete buttons in Used Cars List have no visible label or accessible name. Auction List edit/delete buttons are also unnamed; view and close buttons are named. The Used Cars edit drawer's five text inputs are not programmatically associated with their visible labels, and its close button is unnamed.  
**Impact:** Screen-reader users cannot determine several actions or edit fields, and keyboard/automated UI testing is unnecessarily brittle.

#### QA-008 — Mobile seller/admin tables rely on horizontal scrolling

**Observed:** Seller Bookings, Seller Auction Status, Admin Customer Accounts, Admin Bookings, Auction List, and Used Cars List use horizontally scrollable tables/cards.  
**Impact:** Status/actions can be off-screen with a subtle scrollbar.  
**Evidence:** `qa-evidence/mobile/regular/05.png`, `qa-evidence/mobile/regular/07.png`, and multiple `qa-evidence/mobile/admin/` captures.

#### QA-009 — Data & Models desktop layout is cramped

**Observed:** Long model version strings wrap aggressively, model columns are compressed, and Roll back / Train model controls crowd the card header.  
**Impact:** Difficult scanning and increased chance of choosing the wrong model version.  
**Evidence:** `qa-evidence/desktop/admin/04.png`.

#### QA-010 — Loading behavior creates blank or misleading intermediate states

**Observed:** Some routes show a full-page `Loading Executive Cars…` state long enough to be captured after navigation. Used Cars can show skeletons while simultaneously saying `0 cars found`. My Bids briefly showed both loading and empty-state messaging during one pass.  
**Impact:** Users may interpret the page as empty or broken on slower devices/networks.

#### QA-002 — Auction dashboard renders false zero/empty data while requests are loading

**Corrected interpretation:** Immediately after demo membership activation, `/auction/dashboard` showed zero active auctions, no active auctions, zeroed member statistics, and an em dash for membership days. A settled-state recheck after the three dashboard requests completed showed one active Honda Civic auction and 365 days remaining, matching `/auction/live`.  
**Confirmed source cause:** `AuctionDashboardPage.jsx` initializes `cars` as an empty array and the other data as `null`, has no loading state, and immediately renders those initial values while `Promise.all([/cars, /member/stats, /member/profile])` is pending.  
**Impact:** Users see authoritative-looking but false account and inventory data during normal loading, especially on first entry after payment.  
**Severity/status:** Downgraded from high-priority data inconsistency to medium-priority loading UX after the settled-state correction. This overlaps the broader QA-010 pattern.  
**Recommendation:** Add an explicit dashboard loading state or skeletons and do not render numeric/empty-state claims until all required data has settled.

#### QA-011 — Floating AI button overlaps page content

**Observed:** The fixed lower-right chat button overlaps cards, actions, legal-page content, and mobile viewport content. It also appears on authentication, legal, payment, and error pages.  
**Impact:** Obscures content and creates accidental interaction risk.  
**Evidence:** Repeated across public, payment, detail, and mobile screenshots.

#### QA-012 — Legal-page navigation is inconsistent

**Observed:** Terms includes the normal navigation header, while Privacy can render without the full navigation header.  
**Impact:** Inconsistent route affordance and back-navigation experience.  
**Evidence:** `qa-evidence/tablet/guest/12.png` and `qa-evidence/tablet/guest/13.png`.

#### QA-023 — Dataset provenance is ambiguous on the model-administration screen

**Observed:** The summary says `Usable dataset rows: 0`, while every registered model row says it used 72,179 rows. Both can be technically correct—the zero is the MongoDB admin-import corpus and 72,179 is ML registry metadata—but the UI does not explain that distinction.  
**Impact:** An administrator can reasonably conclude that model metadata or dataset state is inconsistent and may not know which corpus retraining will use.  
**Recommendation:** Rename the metric to `Admin-imported training rows`, show the active model's immutable training dataset metadata separately, and document which source the Train action will submit.

### Low priority

#### QA-022 — Singular bid counts use plural copy

**Observed:** Auction list/detail views render `1 bids` instead of `1 bid`.  
**Impact:** Small but visible polish defect in a core auction metric.  
**Confirmed source:** Both `AuctionLiveAuctionsPage.jsx` and `AuctionCarDetailPage.jsx` append the literal word `bids` without singular handling.

## 8.1 Remediation status snapshot — 2026-09-03 (final integrated pass)

| Finding | Current status | Verification |
|---|---|---|
| QA-001 | **Verified fixed** for the reported auction surfaces | Shared `VehicleImage` fallback is used on Dashboard, My Bids, Won Cars, and auction-detail thumbnails; component tests passed; live Dashboard, My Bids, and ended-auction captures show designed placeholders instead of broken images. |
| QA-002 | **Verified fixed** | Dashboard now renders one mutually exclusive skeleton/error/content state. Delayed-promise and rejected-request component tests prove that false zeroes and premature empty content are not shown. Live settled values remain correct. |
| QA-003 | **Verified fixed** | My Bids uses a mobile card layout with complete bid, status, car, and action information; responsive live review found no document-level overflow. |
| QA-004 | **Verified fixed** | Auction inventory/detail APIs enforce authenticated active membership server-side and return an approved DTO. Anonymous, inactive-member, active-member, and admin cases are covered by backend tests. |
| QA-005 | **Verified fixed in code and expanded automated tests** | Documents are stored outside the static mount, validated by magic bytes, given random names, and served through short-lived signed links with owner/admin authorization. Size/count boundaries and cleanup after a later controller rejection are now tested; failed Cloudinary-backed responses invoke provider cleanup through the same lifecycle. Live Cloudinary and UI upload/download proof remains pending. |
| QA-006 | **Verified fixed** | Verified catalog variants are visibly marked required, expose their field error with `aria-invalid`, block submission, programmatically reference their hint/error text, and receive focus when first invalid. Live Suzuki Cultus validation failed clearly without a variant and completed an ML valuation after selecting VXR. |
| QA-007 | **Verified fixed** | Administrator icon actions have accessible names and shared overlays expose named dialog/drawer semantics. The remaining native auction-close confirmation was replaced with the shared focus-managed confirmation dialog and is covered for confirm, cancel, and focus restoration. A source-wide ESLint 10 accessibility gate corrected 31 further label/backdrop/selection issues and now passes cleanly. |
| QA-008 | **Verified fixed** | Seller and administrator record tables convert to labelled mobile cards. Live 390×844 review covered accounts, bookings, auctions, and used cars without document-level horizontal overflow or hidden actions. |
| QA-009 | **Verified fixed** | Data & Models separates active-model provenance, import corpus, training controls, registry cards, and import history; desktop and mobile layouts were visually verified. |
| QA-010 | **Verified fixed for all originally reported surfaces** | Auction Dashboard, My Bids, Used Cars, Admin Dashboard, and Seller Dashboard now separate loading, error, empty, and content states. Delayed component tests cover both dashboards; the live admin dashboard showed skeletons during Atlas latency and correct data after settlement, never false empty claims. |
| QA-011 | **Verified fixed** | The assistant is route-allowlisted, becomes a 390-pixel-wide bottom sheet on mobile, locks background scrolling, traps focus, closes on Escape, restores focus, and does not create horizontal overflow. |
| QA-012 | **Verified fixed** | Privacy and Terms share the same legal-page structure and navigation; component parity coverage prevents route-specific drift. |
| QA-013 | **Verified fixed** | Browser auth now uses an HttpOnly SameSite cookie, session restoration, server logout, Origin plus session-bound CSRF validation, credentialed Axios, and cookie-authenticated Socket.IO. No auth token is written to local/session storage or emitted in production auth responses. Backend cookie/session/CSRF/logout tests and live login-refresh-logout-protected-route checks passed. |
| QA-014 | **Closed for FYP/demo scope; production payment remains intentionally unavailable** | The current flow is explicitly a no-card/no-charge demonstration. Production mode refuses demo payment; a real Pakistan-supported provider is a separate future release gate. |
| QA-015 | **Verified fixed** | Stripe routes, dependency, controller paths, and frontend code were removed. Demo completion is authenticated, atomic, and idempotent; replay cannot extend membership or create duplicate payment events. |
| QA-016 | **Verified fixed** | The 1.78 MB PNG is no longer shipped by the production build. Responsive AVIF/WebP variants are 8.32–69.65 KB, the browser selected 640-pixel and 1746-pixel AVIF assets at the tested viewports, and desktop/mobile crops were visually reviewed. |
| QA-017 | **Verified fixed for the reported compatibility defect** | NumPy compatibility is constrained, dependencies are locked, tests use the supported ASGI transport, all registered model artifacts load, activation/rollback invariants use an isolated temporary registry, and the final ML run passed 13/13 with no warnings. Hash-locked dependencies and a live legal training cycle remain production follow-ups. |
| QA-018 | **Verified fixed** | Explicit `APP_MODE` validation rejects unsafe production combinations; demo credentials/routes, development OTP/reset fields, and demo payment are gated. Production bundle inspection found no demo passwords or legacy auth keys. |
| QA-019 | **Verified fixed** | Signed-in detail-page save now uses the shared server contract. Live Save changed to Remove, the Suzuki Swift appeared on `/saved-cars`, and removal returned the shortlist to its empty state. Forced-error component coverage confirms no false success. |
| QA-020 | **Verified fixed and operationally hardened** | Model selection uses `GROQ_MODEL` with `openai/gpt-oss-20b` as the working default. A cached exact-model capability endpoint now drives the widget's availability state. Defensive parsing, safe correlation/category logging, demo-only no-key fallback, production missing-key behavior, used-car and membership-safe auction tools, malformed JSON/empty choices, timeout, 429, 5xx, and unavailable-model paths are covered. Two earlier live replies succeeded; the prompt restricts output to supported plain text. |
| QA-021 | **Code/UI verified; legacy repair reviewed but not applied** | Model validation and public serialization normalize impossible metadata; report UI derives only from an attached private asset. The corrected dry run reached the same 8-product/5-auction Atlas inventory and identified exactly 3 products plus 1 auction for repair. It made no changes. The apply command is backup-first and remains an explicit operational decision. |
| QA-022 | **Verified fixed** | One shared formatter covers zero, singular, and plural counts. Unit tests pass and the ended Toyota Corolla with one bid renders `1 bid`, never `1 bids`. |
| QA-023 | **Verified fixed** | Active-model immutable provenance is presented separately from the 0 currently imported MongoDB rows, and training copy states exactly which corpus Train will use. Live desktop/mobile review passed. |
| QA-024 | **Verified fixed** | The shared used-car editor drawer exposes `role="dialog"` with a labelled heading, initially focuses Close, traps the overlay, locks body scrolling, closes on Escape, restores focus to `Edit Toyota Yaris`, and has no mobile horizontal overflow. No edit was saved during this verification. |

### Remediation evidence

- `qa-evidence/implementation/qa-019-saved-cars-live.png`
- `qa-evidence/implementation/qa-020-ai-live-response.png`
- `qa-evidence/implementation/qa-001-002-auction-dashboard.png`
- `qa-evidence/implementation/qa-006-predictor-live.png`
- `qa-evidence/implementation/qa-021-022-ended-auction-full.png`
- `qa-evidence/implementation/qa-011-024-ai-assistant-mobile.png`
- `qa-evidence/implementation/qa-016-home-hero-desktop.png`
- `qa-evidence/implementation/qa-016-home-hero-mobile.png`
- `qa-evidence/implementation/qa-007-used-car-drawer-mobile.png`
- `qa-evidence/implementation/qa-008-admin-users-mobile.png`
- `qa-evidence/implementation/qa-008-admin-auctions-desktop-settled.png`
- `qa-evidence/implementation/qa-admin-bookings-mobile.png`
- `qa-evidence/implementation/qa-admin-auction-list-mobile.png`
- `qa-evidence/implementation/qa-admin-used-cars-list-mobile.png`
- `qa-evidence/implementation/qa-admin-data-models-mobile.png`
- `qa-evidence/implementation/qa-010-admin-dashboard-values-desktop.png`

### Pull-request review follow-up — 2026-09-16

The three suppressed Copilot observations on PR #1 were checked against the installed dependencies, route mounts, current registry, and executable tests rather than accepted at face value.

| Observation | Classification | Verification and action |
|---|---|---|
| A leading `/documents/...` path could bypass Axios `baseURL: '/api'` | **False positive; no code change** | The installed Axios resolver produced `/api/documents/bookings/123/cnic` for both leading-slash and relative inputs. The Express router is mounted at `/api/documents`, and the backend authorization suite passed. |
| Opening a protected document only after awaiting its signed-link request can be blocked by the browser | **Confirmed reliability defect; fixed** | The helper now opens a blank window synchronously during the click activation, clears its opener, requests the authorized short-lived URL, navigates the window on success, and closes it on failure. Three regression tests cover ordering, popup blocking, and request failure. |
| A registry entry without `version` could read root-level `models/metadata.json` | **Confirmed low-severity hardening gap; fixed** | The current registry has 6 entries, all with versions, and no root metadata file, so no current model was affected. Metadata enrichment now occurs only for a non-empty string version. A regression fixture proves unrelated root metadata is ignored. |

Post-fix gates: frontend 23 files / 62 tests passed, backend 36/36 passed using the preserved local MongoDB test binary, ML 11/11 passed, and the production frontend build transformed 1,719 modules. Pytest emitted one cache-provider warning because the pre-existing `.test-cache` path cannot be recreated; it did not affect collection, execution, or application behavior and remains part of the separately proposed local cleanup.

A live Chrome follow-up was attempted after the fix. A restricted backend launch first failed with generic Atlas connectivity guidance, but an unrestricted launch subsequently connected to the configured Atlas cluster, started on port 5082, and loaded the current 8-product inventory. Atlas connectivity and allowlist settings were therefore not the blocker. The protected-document popup change remains verified by deterministic regression tests rather than a completed live-browser document retest because the public inventory had no attached private inspection report and the configured demo-admin credentials did not match the current Atlas admin record. No hosted data was changed. All processes started for this attempt were stopped, and ports 5173, 5082, and 8000 were confirmed closed.

### Production-readiness and maintenance risks

#### QA-013 — Browser session hardening

Closed. Authentication uses an HttpOnly SameSite cookie with explicit CSRF/origin checks, session restoration, logout, and credentialed Socket.IO. Bearer-token compatibility exists only for automated API tests when `EXPOSE_AUTH_TOKEN_FOR_TESTS=true`.

#### QA-014 — The current payment implementation is demonstration-only

This is intentional for the present project decision, but it must not be presented as a production payment transaction. No real card or money is currently processed.

#### QA-015 — Removed Stripe replay surface

Closed. Stripe code and active routes have been removed; the retained demonstration completion is server-priced, atomic, authenticated, and idempotent.

#### QA-016 — Responsive hero asset

Closed for the audited asset budget. The production build emits AVIF/WebP variants between 8.32 KB and 69.65 KB and does not ship the original 1.78 MB PNG.

#### QA-017 — ML dependency compatibility

Closed. The final reproducible run passed 10/10 tests with no warnings, and every registered model artifact was validated.

#### QA-018 — Production environment guards

Closed in code and tests. Explicit application-mode validation prevents unsafe production combinations, while demo credentials, OTP/reset helpers, fixture endpoints, and demo payment remain development/demo-only.

## 8.2 Live Chrome follow-up — 2026-09-19

Chrome testing resumed against frontend 5173, Atlas-connected backend 5082, and ML service 8000 using the existing synthetic account. No hosted record, payment, booking, model, or document was changed. The temporary 390×844 viewport was reset after testing.

| Scenario | Result |
|---|---|
| Desktop home, Used Cars, Yaris detail | Loaded; eight cars and detail data rendered, with designed image fallbacks and no measured document overflow. |
| Predictor empty form | Specific validation and ARIA references appeared; focus moved to Make. |
| Predictor valid form | Corolla 2020 failed (QA-025); Cultus 2022 VXR returned a valuation (QA-028). |
| AI assistant | Capability changed to Available and an ordinary inspection question received a reply (QA-027). |
| Auction entry | Membership CTA and signed-in state rendered; payment was not invoked. |
| Seller booking | Step 1 rendered; empty Next Step focused required CNIC without creating a booking. |
| 390px layouts | Used Cars, Book Inspection, and Price Predictor had no measured document overflow; QA-011 and QA-026 remain. |
| Signed-in read-only routes | Saved Cars, account, seller dashboard, and seller bookings loaded without visible alerts or measured horizontal overflow. The synthetic account had an empty saved-car list and zero seller bookings/listings, shown as explicit empty states. |

**QA-025 — Verified predictor choice rejected without actionable field feedback (medium).** On fresh desktop and mobile loads, Toyota → Corolla → 2020 → `1.6 Gasoline` auto-filled 1598 cc, Manual, Petrol, and Sedan. With 30,000 km and Rawalpindi cities, Submit returned `Please correct the vehicle configuration.` No field-specific reason or `aria-invalid=true` control appeared. Suzuki Cultus 2022 VXR succeeded. The same explicit Corolla values passed both backend pure validators and a non-mutating direct POST to the local backend returned a PKR 5,237,000 estimate, narrowing the discrepancy to the browser form/request boundary rather than general ML availability. Capture the actual serialized browser payload and returned field errors, reconcile form state with emitted options, and show the rejected field and reason.

**QA-026 — Mobile marketplace filter drawer lacks modal keyboard behavior (medium).** At 390px, Filters opened a full-height overlay with no dialog role. Focus stayed on the underlying Filters button; Escape did not close it; Close worked but did not restore trigger focus. Apply the shared focus-managed drawer/dialog behavior.

**QA-027 — AI booking answer has unsupported process claims (medium).** The assistant claimed an OTP-verified scheduling email link and separate seller credentials within 1–2 business days. The live Book Inspection page instead presents date/branch selection in the unified-account portal, document upload, email OTP confirmation, admin approval, and My Bookings status tracking. Ground process answers in current application content.

**QA-028 — Valuation factor labels dataset-relative age as vehicle age (medium).** A successful Cultus 2022 prediction on 2026-09-19 displayed `Vehicle age: 0 years`. ML source derives this feature from the bundle's `datasetReferenceYear`, not the present calendar year. The UI gives no such qualification beside the PKR estimate. Explain the reference year or display a separate present-day age without silently changing model features.

**QA-011 reopened for mobile overlap.** At 390px on `/used-cars`, the floating assistant launcher occupied x=318–374, y=772–828 and first Save car button x=322–358, y=759–795; the rectangles intersect. Prior route and sheet improvements remain, but the broad `Verified fixed` status does not cover this action obstruction. The launcher also covered part of the predictor form at the tested scroll position.

**Unconfirmed transient:** The first predictor request returned `Invalid CSRF token` before a fresh authenticated page load. It did not recur on two valid-form retries. Deliberate expired-cookie/cold-start testing is needed before calling it a recurring defect.

## 9. Environment/tool limitations found during testing

### Chrome file upload permission

Chrome opened the file chooser, but the extension was not permitted to attach the selected local project image. The documented fix is:

1. Open `chrome://extensions`.
2. Open Details for the ChatGPT browser extension.
3. Enable **Allow access to file URLs**.

The upload check was retried after the fresh Chrome connection. The chooser opened successfully, but `fileChooser.setFiles` still returned `Not allowed`, confirming that connection status and local-file permission are separate. Until file-URL access is enabled, live UI upload to Cloudinary cannot be completed. Cloudinary authentication itself has passed.

### Chrome extension transport interruption — recovered

After extensive live testing, the original Chrome connection disconnected. Diagnostics at that point found:

- The extension is installed and enabled in Chrome Profile 19.
- The shared native-host manifest file exists.
- The required Windows native-messaging registry key is missing.
- A process-running diagnostic could not use `tasklist` because the local environment returned Access denied.

The stale browser session was subsequently discarded and a fresh Chrome connection succeeded. A new controlled tab opened the application normally, retaining the synthetic Codex QA account session. No reinstall was required. The interruption was therefore a transient browser-control session issue, not an Executive Cars application failure.

## 10. Pending test work

The following items remain open and must not be described as completed:

- Upload a non-personal test image through the UI and confirm the resulting Cloudinary URL renders correctly.
- Upload an entirely synthetic inspection PDF through Chrome and repeat the already-passing automated owner/wrong-owner/admin/signed-link authorization matrix live. Atlas connectivity has been verified; this still requires Chrome local-file access, a valid authorized test account/session, and an approved controlled synthetic private-document fixture.
- Decide whether to apply `npm run repair:inspection-reports:apply` to the four legacy Atlas records identified by the successful dry run. The command creates a pre-change backup; no apply was performed during QA.
- Re-test WebSocket reconnect/resubscribe behavior after a deliberate network interruption; normal two-user live updates and outbid notification already pass.
- Re-test real SMTP delivery only when a controlled mailbox is available; development-mode request, privacy, mismatch, and invalid-token paths already pass.
- Continue edge coverage for combined price/mileage/year/fuel filters and pagination when inventory exceeds one page; text search, make filter, sorting, grid/list, empty state, and malformed used-car ID already pass.
- After Chrome file access is enabled, import a legal synthetic fixture and test cleaning/duplicate/rejection reporting and training. Empty-form validation and rollback/activation confirmation safeguards already pass; no model mutation was performed.
- Re-test destructive deletion only if explicit record-removal approval is given; synthetic used-car edit/restore and delete-confirmation/cancel behavior already pass.
- Run a dedicated cold-cache/throttled Lighthouse or Web Vitals pass against a production deployment; the asset budget and responsive source selection are already verified locally.
- Continue broad screen-reader/manual keyboard certification beyond the repaired shared overlays if formal WCAG sign-off is required.
- Integrate a legally supported real payment provider before any production transaction. This is intentionally outside the present no-charge FYP demonstration scope.

## 11. Current overall assessment

The application now meets the stable FYP-demonstration gate and has a much stronger controlled-demo foundation. The latest automated run passed: frontend 24 files / 65 tests, backend 45/45, ML 13/13 with no warnings, backend syntax across 78 files, the source-wide accessibility lint gate, and a 1,723-module production build. React Router was upgraded to 7.18.4 and the production dependency audit now reports zero vulnerabilities. The main JavaScript gzip size increased from approximately 42 KB to 101 KB after the router upgrade and remains recorded for future performance measurement. Live Chrome previously verified cookie-session restoration and logout, member/auction/seller data, responsive public and administrator layouts, truthful async states, responsive hero selection, saved cars, AI, and accessible overlay behavior.

It is not approved for real-money production use. That remaining distinction is deliberate: Stripe is removed, demo payment is blocked in production, and a Pakistan-supported payment provider has not been selected or implemented. Production release also requires an owner decision on the four-record legacy inspection migration, live synthetic upload/download evidence after Chrome file access is enabled, deployment-level performance/security operations, secret rotation, backups, and final testing against the deployed origin.

## 12. Update log

| Date/time (PKT) | Update |
|---|---|
| 2026-09-02 | Created the living report from completed setup, automated, visual, role-based, and state-changing test evidence. |
| 2026-09-02 | Reverified the running frontend, backend health endpoint, and ML health endpoint; all returned HTTP 200. Chrome control remained disconnected, so live-browser continuation is paused without treating the condition as an application defect. |
| 2026-09-02 | Reconnected through a fresh Chrome session and resumed live UI testing. Updated the earlier connection limitation to recovered. |
| 2026-09-02 | Completed saved-car testing. Marketplace-card save/remove passed; detail-page save falsely reported success without updating the account shortlist. Added QA-019 with screenshots and source-level cause. |
| 2026-09-02 | Completed the AI-assistant failure-path test and provider isolation. Added QA-020: the hard-coded Groq model is unavailable, while the key and an available model are functional. |
| 2026-09-02 | Completed password-recovery validation with synthetic addresses: valid-account request, privacy-equivalent unknown-account response, mismatch handling, valid-form access, and invalid-token rejection passed. No password was changed. |
| 2026-09-02 | Completed the main marketplace discovery batch: search, make filter, low-to-high sort, view toggles, empty state, saved search, and malformed used-car ID passed. |
| 2026-09-02 | Completed the standalone `/auction/signup` flow with a second synthetic account and demo membership activation. A settled dashboard recheck corrected QA-002 from a data inconsistency to a transient false-zero loading-state defect. |
| 2026-09-02 | Completed live/upcoming/ended auction discovery, empty search, malformed ID, and closed-auction checks. Added QA-021 for contradictory report metadata and QA-022 for singular bid grammar. |
| 2026-09-02 | Completed true two-member auction testing across two Chrome tabs. Owner self-bid rejection, cross-user live amount/count/feed updates, and the targeted outbid alert all passed. Final synthetic highest bid: PKR 5,150,000 with 9 total bids. |
| 2026-09-02 | Retried browser file attachment: the chooser opens but local attachment remains blocked by Chrome's file-URL permission. Tested the admin booking dropdown by rejecting and restoring the synthetic booking; both transitions passed. |
| 2026-09-02 | Completed non-mutating dataset/model administration checks: service and registry loading, import requirements, disabled training threshold, and rollback/activation confirmations passed. Added QA-023 for ambiguous 0-row versus 72,179-row provenance messaging. |
| 2026-09-02 | Completed synthetic used-car edit/restore and delete-safeguard testing. Price persistence passed, the original value was restored, and deletion was cancelled. Expanded QA-007 to cover unlabeled edit fields and modal close control. |
| 2026-09-02 | Completed the post-mutation Chrome diagnostic log sweep on customer/auction and admin tabs. No console warning/error entries were present; only expected Vite and React development messages appeared. |
| 2026-09-02 | Completed a focused keyboard/modal pass on the admin used-car editor. Added QA-024 after confirming missing dialog semantics, focus left behind the overlay, no focus trap, and no Escape dismissal. |
| 2026-09-02 | Re-captured and persisted the functional browser evidence correctly after discovering that the browser screenshot API returns bytes rather than writing a supplied path. Verified five functional PNG artifacts for saved-car synchronization, AI failure, ended-auction report contradiction, and cross-user live bidding. |
| 2026-09-02 | Completed a read-only API boundary and response-hardening pass. Public marketplace reads, protected-route 401s, malformed-ID 400s, unknown-route 404, origin allow/deny behavior, and Helmet response headers behaved as recorded in section 7.15. |
| 2026-09-03 | Completed source-level remediation analysis for all 24 findings and created `QA_REMEDIATION_IMPLEMENTATION_PLAN.md` with dependencies, implementation work packages, acceptance tests, estimates, migration safeguards, and FYP/hosted-demo/production release gates. No application fix was applied during this planning step. |
| 2026-09-03 | Implemented and verified the first trust-repair slice. Frontend 34/34, backend 31/31, build, and syntax gates passed. Live Chrome confirmed saved-car synchronization, AI recovery/plain-text output, auction image fallbacks, truthful dashboard state, predictor validation/success, report consistency, and singular bid copy. Added implementation evidence. QA-021 legacy apply remains pending because the checked-in `.env` and running backend point at observably different inventories. |
| 2026-09-03 | Completed the integrated remediation pass for all 24 findings. Added private document delivery, membership-only auction APIs, accessible shared overlays, responsive data cards, model provenance, legal parity, route-aware assistant behavior, HttpOnly cookie sessions with CSRF protection, explicit production/demo gates, Stripe removal and idempotent demo payment, responsive modern hero assets, and ML compatibility fixes. |
| 2026-09-03 | Final gates passed: frontend 22 files / 59 tests, backend 36 tests, ML 10 tests with no warnings, backend syntax 78 files, and production build 1,719 modules. Build inspection found no legacy auth keys, demo passwords, Stripe strings, or original hero PNG reference. |
| 2026-09-03 | Reconnected Chrome and completed member plus administrator live regression. All eight administrator content routes were reviewed at desktop and mobile widths. The used-car drawer passed dialog naming, focus entry, Escape dismissal, focus restoration, scroll lock, and overflow checks without saving a mutation. |
| 2026-09-03 | Ran the inspection repair in dry-run mode against the configured 8-product/5-auction Atlas inventory. It identified 3 products and 1 auction; no database changes were made. |
| 2026-09-16 | Investigated all three suppressed PR-review observations. Rejected the Axios path claim with an executable resolution check, fixed the protected-document popup timing and malformed ML registry metadata lookup, and added four regressions. Full gates passed: frontend 62/62, backend 36/36, ML 11/11, and the 1,719-module production build. |
| 2026-09-16 | Attempted the post-fix live Chrome document-flow recheck. After a restricted-network failure, the unrestricted backend connected to Atlas on port 5082 and loaded 8 products. The live protected-document matrix remained blocked by the absence of an attached private report and by demo-admin credential drift, not by the Atlas allowlist. No hosted data was changed; all agent-started processes were stopped and ports 5173, 5082, and 8000 were verified closed. |
| 2026-09-17 | Audited the complete QA report, remediation plan, current source, tests, build, ML registry, and referenced evidence. Recorded the strict work-package and release-gate verdict in `QA_IMPLEMENTATION_COMPLETENESS_AUDIT.md`: the core FYP remediation is extensive and stable, but the plan is not complete against its full Definition of Done, hosted-demo gate, or production gate. |
| 2026-09-17 | Completed the first post-audit remediation slice. Corrected the Atlas/port record, replaced the auction-close native confirmation, linked shared form hints/errors to controls, focused the first invalid Predictor field, and completed AI capability/error hardening. Full gates passed: frontend 24 files / 65 tests, backend 44/44, backend syntax 78 files, and production build 1,719 modules. No hosted data was changed. |
| 2026-09-17 | Completed the remaining isolated Priority-1 work: upload size/count/orphan cleanup, temporary ML activation/rollback safeguards, warning-free pytest cache configuration, modern ESLint 10 accessibility enforcement and 31 resulting semantic fixes. React Router was upgraded from vulnerable 6.30.3 to 7.18.4; production npm audit is now zero. Final gates passed: frontend 65/65, backend 45/45, ML 13/13 warning-free, accessibility lint, syntax, and the 1,723-module build. No hosted data was changed. |
| 2026-09-19 | Connected-Chrome follow-up: desktop marketplace/detail, predictor validation and control result, auction entry, AI reply, booking validation, and 390px layouts. Added QA-025–028 and reopened QA-011 for measured mobile overlap; one CSRF response remains unconfirmed pending cold-start reproduction. No hosted data was changed. |
| 2026-09-19 | Continued the same read-only browser batch across Saved Cars, account, seller dashboard, and seller bookings. All settled without visible alerts or document overflow; empty-state data was not altered. Direct local backend valuation with the same Corolla values returned an estimate, narrowing QA-025 to the browser form/request boundary. |

## 13. Living-report update policy

This file is the single QA record for the remaining test cycle. As testing continues, it will be updated after each meaningful test batch with:

- The exact scenario, role, viewport, test data category, and result.
- New evidence locations and reproducible observations.
- Newly confirmed defects, severity, impact, and status changes.
- Corrections when later evidence changes an earlier interpretation.
- Environment blockers kept separate from application defects.
- A dated update-log entry so completed and pending work remain auditable.
