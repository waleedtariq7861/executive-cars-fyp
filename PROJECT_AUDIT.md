# Executive Cars — Pre-Implementation Audit

Audit date: 2026-07-29  
Dataset reviewed: `pakwheels_used_car_data_v02.csv`

This document records the project state before the dataset/model integration work. No existing page, route, role, or business workflow needs to be removed or replaced.

## 1. Repository structure

### Frontend

`executive-cars-frontend-main` is a React 18/Vite application.

- `src/App.jsx`: lazy-loaded route registry for public, auction, seller, and admin areas.
- `src/pages`: public marketplace, account, authentication, selling, inspection, saved-car, and predictor pages.
- `src/pages/auction`: membership, checkout, live auctions, bidding, bid history, won cars, and profile pages.
- `src/pages/seller`: seller dashboard, bookings, listings, auction status, and profile pages.
- `src/pages/admin`: dashboard, users, bookings, selling requests, datasets/models, inventory, auction inventory, and upload pages.
- `src/components`: global navigation/footer, portal layouts, vehicle cards/images, auction utilities, route guards, and the assistant widget.
- `src/components/ui`: existing reusable buttons, cards, form controls, feedback states, navigation primitives, overlays, and toasts.
- `src/api`: central Axios client and Socket.IO client.
- `src/context`: authentication and toast state.
- `src/data`: current static make/model data and legacy fixture data.
- `src/utils`: formatting, auction, and membership helpers.
- `src/index.css`: Tailwind entry point plus the existing Executive Cars design tokens and component classes.

The frontend contains approximately 6,900 lines across the inspected source files. Vite code splitting is already configured through lazy route imports.

### Backend

`executive-cars-backend-main` is an Express/Mongoose service.

- `server/app.js`: middleware, security headers, CORS, route mounts, health route, and global error handling.
- `server/index.js`: MongoDB connection, Socket.IO, scheduler, HTTP listener, development admin seed, and graceful shutdown.
- `src/routes`: auth, bookings, selling requests, auction cars, marketplace products, admin, member, seller, bids, payments, prediction, and chat routes.
- `src/controllers`: request handlers for every registered route group.
- `src/models`: Admin, Member, Seller, Product, Car, Bid, Booking, SellingRequest, OTP/reset tokens, DatasetImport, and VehicleRecord.
- `src/middleware`: JWT authentication, role/capability authorization, rate limiting, upload validation, and dataset upload handling.
- `src/services`: dataset import/cleaning and valuation orchestration.
- `src/socket`: authenticated real-time auction bid updates.
- `src/utils`: auction scheduler, email delivery, and safe HTTP/controller helpers.

### ML service

`ml-service` is an existing FastAPI/scikit-learn service.

- `app/data.py`: dataset aliases, numeric parsing, canonicalisation, cleaning, and feature creation.
- `app/training.py`: candidate pipelines, splits, evaluation, model registry, and bundle persistence.
- `app/prediction.py`: inference, comparable selection, range/confidence heuristics, and factors.
- `app/main.py`: health, predict, train, version activation, and rollback endpoints.
- `app/schemas.py`: Pydantic prediction/training contracts.
- `app/train.py`: CSV/JSON command-line training entry point.
- `models`: local generated-model registry (gitignored).
- `tests`: API, cleaning, schema, training, and inference tests.

## 2. Registered frontend routes

Public routes:

- `/`
- `/login`
- `/forgot-password`
- `/reset-password`
- `/signup`
- `/account`
- `/sell-car`
- `/sell-car/self`
- `/become-a-seller`
- `/used-cars`
- `/used-cars/:id`
- `/price-predictor`
- `/booking-confirmed`
- `/privacy`
- `/terms`
- `/saved-cars`

Auction routes:

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

Admin routes:

- `/admin`
- `/admin/login`
- `/admin/dashboard`
- `/admin/users`
- `/admin/bookings`
- `/admin/selling-requests`
- `/admin/data-models`
- `/admin/auction-list`
- `/admin/used-cars-list`
- `/admin/upload-auction`
- `/admin/upload-used-car`

Seller routes:

- `/seller/dashboard`
- `/seller/book-inspection`
- `/seller/bookings`
- `/seller/listings`
- `/seller/auction-status`
- `/seller/profile`

Unknown routes render the existing not-found page.

## 3. Existing backend APIs

Public/customer groups:

- `/api/auth`: admin/customer registration and login, password change, forgot password, and reset password.
- `/api/bookings`: OTP send/verify and inspection booking submission.
- `/api/selling-requests`: authenticated self-selling request submission and customer history.
- `/api/cars`: public auction inventory and detail reads.
- `/api/products`: public used-car inventory and detail reads.
- `/api/member`: protected member profile, auction bids, won cars, and statistics.
- `/api/seller`: protected seller profile, bookings, listings, and auction status.
- `/api/bids`: membership-protected bid placement and bid history.
- `/api/payments`: Stripe checkout and payment verification.
- `/api/predict-price` and `/api/predict`: valuation health and POST prediction.
- `/api/chat`: assistant endpoint backed by configured Groq access or database-only fallbacks.
- `/api/health`: service/database health.

Admin APIs:

- Statistics, bookings, selling requests, members, auction inventory, marketplace inventory.
- Dataset imports, dataset summary/export.
- ML service health, train, model version list, activation, and rollback.

## 4. Database models and ownership

- `Member` is the unified customer account used for buying, selling tools, and auction membership.
- `Admin` is separate and role-protected.
- Legacy `Seller` accounts remain supported by backend authentication middleware.
- `Product` represents normal used-car marketplace listings.
- `Car` represents auction listings and contains current bid state.
- `Bid` records individual member bids.
- `Booking` stores inspection requests and approval state.
- `SellingRequest` stores self-managed listing submissions and administrator review state.
- `VehicleRecord` stores legal/imported ML training records separately from public inventory.
- `DatasetImport` records source/rights confirmation and row-level import summaries.
- OTP and password reset tokens are stored separately with expiry.

Passwords are bcrypt-hashed. JWTs contain account identity/role. Protected middleware loads the current account and applies admin, seller/customer, or active-auction-membership checks.

## 5. Existing workflows

### Authentication

The frontend stores the JWT and a non-sensitive user summary in local storage, adds the bearer token centrally through Axios, clears auth state after a 401, and connects Socket.IO only for customer accounts. Route guards distinguish admin and customer access; auction pages additionally require active membership.

### Used-car listings

Administrators create `Product` records with validated image/report uploads. Public pages read available inventory, filter/sort it client-side, render recorded verification/inspection states only, and provide a missing-image fallback. Detail pages retrieve a real listing and query same-make inventory for related cars.

### Auctions

Administrators create `Car` records. Public auction reads understand live/upcoming/ended phases. Active members can bid. The backend checks auction time/status, minimum bid, duplicate/lower bids, and updates the car/bid atomically. Socket.IO broadcasts bid updates. A scheduler closes ended auctions.

### Inspection booking

The managed-selling form verifies the email through an OTP challenge, uploads supported documents, validates requested booking information, and creates a `Booking`. Administrator approval can enable seller access on the unified member account.

### Self selling

Authenticated customers submit vehicle/contact details, up to six images, and a registration document. Requests remain linked to the account and are reviewed through the admin selling-requests page.

### Saved cars

The existing feature stores product IDs in browser local storage and filters the real `/products` response. It is not yet persisted per authenticated database account, so cross-browser/customer ownership is incomplete.

### Admin

The admin section already supports real database statistics, member management, booking review, selling-request review, dataset/model management, and both inventory types. All `/api/admin` routes are protected by JWT plus `adminOnly`.

## 6. Current price predictor

The React form already collects make, model, variant, model year, mileage, engine capacity, transmission, fuel, listing city, body type, condition, assembly type, and optional inspection score. Make/model dependency is currently based on a small hardcoded catalog.

`POST /api/predict-price`:

1. Normalises frontend field aliases.
2. Performs backend field validation.
3. Calls the configured FastAPI prediction URL with a five-second timeout.
4. Falls back to real available `Product` comparables when FastAPI is unavailable.
5. Returns the estimate, range, method/version, comparable details, and factors.

The FastAPI service already loads an active model bundle once at import/startup and supports `/health`, `/predict`, `/train`, `/models`, activation, and rollback.

## 7. Existing design system and responsive behaviour

The current system already includes:

- Navy/blue/neutral CSS variables.
- Reusable shadows, radii, spacing, containers, controls, buttons, cards, badges, focus styles, and reduced-motion handling.
- Responsive global navigation with a mobile drawer.
- Responsive public cards, marketplace filters, portal sidebars, forms, tables, dialogs, and loading/empty/error components.
- Lazy route loading and an application error boundary.

The main visual issue is not absence of a system; it is incomplete adoption. Older pages use direct Tailwind values, larger radii, gradients, and custom controls instead of the shared primitives, which creates visual inconsistency.

## 8. Baseline validation and identified issues

Commands run before implementation:

- `npm run check`: backend syntax checks and the frontend production build passed.
- Backend test suite: 9/9 passed when allowed to bind a temporary MongoDB port.
- Frontend test suite: 7/7 passed.
- ML tests: 8/8 passed when run from `ml-service`.

Identified issues:

1. Root `npm test` invokes ML tests from the repository root, causing `ModuleNotFoundError: app`; the same tests pass from `ml-service`.
2. CatBoost is not installed or compared.
3. The current full-size training path cross-validates several expensive models and is not practical for 77,000+ rows.
4. Existing training features include fields absent from this dataset, producing all-missing feature warnings.
5. `listingMonth` uses the runtime month although the CSV has no listing date, reducing reproducibility without adding defensible information.
6. The current ML range is the maximum of MAE, comparable IQR, or 5% of the estimate. It is not a calibrated prediction interval.
7. The current percentage “confidence” is a weighted heuristic, not a statistically calibrated probability, but the UI presents it as a percentage.
8. The predictor make/model list covers only a subset of the attached dataset.
9. The Node ML URL handling expects a prediction endpoint while other backend health/version code expects a service base; configuration should safely accept either form.
10. Saved cars are browser-local rather than associated with an authenticated database account.
11. Marketplace filtering is entirely client-side and fetches all products even though the backend already supports several query filters.
12. Some older pages duplicate field/card/modal styles instead of using the existing shared UI components.
13. Several portal layouts include notification buttons that are visual only and should not imply a working notification centre.
14. The attached dataset has no listing date and ends at model year 2022, so present-day estimates will remain a documented historical-data limitation.

## 9. Dataset snapshot (unmodified source)

- Rows: 77,878
- Columns: 14
- Schema: `addref`, `city`, `assembly`, `body`, `make`, `model`, `year`, `engine`, `transmission`, `fuel`, `color`, `registered`, `mileage`, `price`
- Exact duplicate rows: 0
- Duplicates excluding identifier `addref`: 388
- Missing target price: 583
- Missing year: 4,779
- Missing/invalid engine requires explicit handling.
- `addref` is an identifier and must not be a predictive feature.
- IQR price outliers include legitimate premium vehicles; hard validity bounds should be applied without blindly removing the full premium tail.

The detailed, reproducible inspection and cleaning reports will be generated by the ML training pipeline.
