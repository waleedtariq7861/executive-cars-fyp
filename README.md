# Executive Cars FYP

Executive Cars is a three-service Final Year Project for used-car discovery, auction membership and bidding, seller workflows, administration, document handling, and ML-assisted price prediction.

## Services

- `executive-cars-frontend-main` — React 18 and Vite web application
- `executive-cars-backend-main` — Express, MongoDB/Mongoose, and Socket.IO API
- `ml-service` — FastAPI and scikit-learn price-prediction service

The frontend uses the Vite proxy for `/api` and Socket.IO during local development. The backend calls the ML service over HTTP.

## Prerequisites

- Node.js 20 or newer and npm
- Python 3.11
- Git LFS
- A local Docker MongoDB 8 replica set for development/tests; Atlas for production

Cloud integrations are configured through local environment files. Never commit real credentials.

## Clone and retrieve the ML model

```powershell
git lfs install
git lfs pull
```

The active model is stored with Git LFS. Its registry and metadata are tracked in Git so a fresh clone can identify and load it. Historical local model artifacts are intentionally excluded.

## Configure the services

Create local files from the supplied templates:

```powershell
Copy-Item .\executive-cars-backend-main\.env.example .\executive-cars-backend-main\.env
Copy-Item .\executive-cars-frontend-main\.env.example .\executive-cars-frontend-main\.env.local
Copy-Item .\ml-service\.env.example .\ml-service\.env
```

At minimum, configure `MONGO_URI` and a strong `JWT_SECRET` in the backend file. Development uses `mongodb://127.0.0.1:27017/executivecars_dev?directConnection=true&replicaSet=executivecars-local`. Tests use the separate `executivecars_test` database on the same server. Atlas is reserved for production, with an explicit `/executivecars` database path in the deployed URI. Add Cloudinary, email, and Groq credentials only when those integrations are required. The checked-in local defaults align the services as follows:

- frontend: `http://localhost:5173`
- backend: `http://127.0.0.1:5082`
- ML service: `http://127.0.0.1:8000`

Keep `ML_SERVICE_KEY` identical in the backend and ML files if service-key protection is enabled.

The prepared local MongoDB container is `executive-cars-test-mongo`, published at `127.0.0.1:27017`, with replica-set name `executivecars-local`. If it is stopped, start it with `docker start executive-cars-test-mongo`. Development, tests and temporary backup restores share this one server; do not start a second MongoDB container for tests. Its persistent volumes survive container restarts. A fresh machine needs that localhost-only MongoDB 8 single-member replica set provisioned before running the app or database tests.

## Install dependencies

```powershell
Set-Location .\executive-cars-backend-main
npm install

Set-Location ..\executive-cars-frontend-main
npm install

Set-Location ..\ml-service
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.lock
```

On macOS or Linux, activate/use `.venv/bin/python` instead of `.venv\Scripts\python.exe`.

## Run locally

Use three terminals and direct npm/Python commands.

Terminal 1 — ML service:

```powershell
Set-Location .\ml-service
.\.venv\Scripts\python.exe .\run.py
```

Terminal 2 — backend:

```powershell
Set-Location .\executive-cars-backend-main
npm run dev
```

Terminal 3 — frontend:

```powershell
Set-Location .\executive-cars-frontend-main
npm run dev
```

Open <http://localhost:5173>.

## Application modes and payments

`APP_MODE=demo` and `PAYMENT_MODE=demo` support the local FYP demonstration flow. This payment flow records an internal simulated membership payment; it does not process a financial transaction. Stripe is not part of the current implementation.

For a real deployment, set `APP_MODE=production`, `NODE_ENV=production`, and `PAYMENT_MODE=disabled`; use HTTPS client origins, production email delivery, a strong secret, and keep `ENABLE_DEMO_SEED=false`. The backend validates these boundaries at startup.

For the GitHub + Vercel + Render Free setup, follow [DEPLOYMENT_FREE_TIER.md](DEPLOYMENT_FREE_TIER.md). It lists dashboard steps, required secrets, verification, and features that cannot run on the free hosting plan.

To deliberately create tagged local demo accounts/data:

```powershell
Set-Location .\executive-cars-backend-main
npm run seed:demo
```

Only enable and use the demo seed in a local demonstration environment.

## Security model

- Browser authentication uses an HttpOnly, SameSite=Strict session cookie (`__Host-ec_session` in production) holding a random token; only its SHA-256 is stored server-side in the `Session` collection, so sessions can be ended individually or all at once.
- Sessions expire after inactivity and after an absolute lifetime (customers 7 / 14 days, administrators 30 minutes / 8 hours; configurable with the `SESSION_*` variables in `.env.example`). Logging out, changing a password or resetting it revokes sessions on the server, not just in the browser.
- Passwords are stored as Argon2id hashes; an account whose password is in any other format cannot sign in until its owner resets the password. A password must be 8-128 characters, any characters allowed, not on the bundled common-password list, not built from the person's name/email or the site name, and (in production) not found in the Have I Been Pwned breach corpus. Only a 5-character hash prefix is sent to that service and an outage never blocks sign-up (`HIBP_ENABLED` overrides the default).
- Failed sign-ins are throttled per account and address in MongoDB with a growing delay (no permanent lockout), and every sign-in attempt does the same hashing work whether or not the email exists.
- Password reset works for customers and administrators: links last 30 minutes, work once and only their hash is stored; a new request replaces the old link; each account may request 3 links an hour (more are answered the same way but send nothing); the answer is identical for known and unknown addresses and never waits for the mail provider. Completing a reset ends every session of that account and clears its sign-in delay. Every password change or reset sends a "password changed" notice to the account address. The reset page removes the token from the address bar and the host sends `Referrer-Policy: no-referrer` for it.
- Customers confirm their email address with a 6-digit code mailed to it (valid 10 minutes, 5 tries per code, one new code a minute and five a day; only a keyed digest is stored). Sign-up sends the first code and says so when it could not be sent. Until verified a customer can use the account but cannot place bids or activate auction membership (`403 EMAIL_NOT_VERIFIED`); a successful booking code also verifies the address.
- State-changing browser requests require CSRF protection (token plus Origin check).
- Auction inventory and bidding APIs enforce authenticated membership/role checks server-side.
- Private documents are served through authorized API routes rather than a public static folder.
- Secrets, local uploads, dependency folders, caches, reports, and local environment files are excluded from Git.

## Quality checks

Run each suite directly:

Backend API tests require the local Docker replica-set PRIMARY. `npm test` defaults to `executivecars_test`; optional `TEST_MONGO_URI` must still identify that exact database on localhost port 27017. The test harness refuses Atlas, development, production and restore targets before connecting/resetting. It drops the disposable test database between tests, recreates model indexes, and cleans it up afterward. Do not run parallel API suites or store development data in `executivecars_test`.

```powershell
Set-Location .\executive-cars-backend-main
npm test
npm run check

Set-Location ..\executive-cars-frontend-main
npm test
npm run build

Set-Location ..\ml-service
.\.venv\Scripts\python.exe -m pytest tests
```

The audit-era QA reports were removed from the repository on 2026-10-29 and remain available in Git history. At that point the backend suite had 80 passing tests and the frontend suite had 94 passing tests across 26 files.

## Important data and artifact notes

- `pakwheels_used_car_data_v02.csv` is the retained training dataset supplied with the project.
- Generated uploads and private documents must be stored outside the Git repository in production.
- Model training can create large versioned artifacts; review them before intentionally adding any new artifact to Git LFS.
