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
- A reachable MongoDB deployment

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

At minimum, configure `MONGO_URI` and a strong `JWT_SECRET` in the backend file. Add Cloudinary, email, and Groq credentials only when those integrations are required. The checked-in local defaults align the services as follows:

- frontend: `http://localhost:5173`
- backend: `http://127.0.0.1:5082`
- ML service: `http://127.0.0.1:8000`

Keep `ML_SERVICE_KEY` identical in the backend and ML files if service-key protection is enabled.

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

- Browser authentication uses an HttpOnly session cookie rather than browser-accessible JWT storage.
- State-changing browser requests require CSRF protection.
- Auction inventory and bidding APIs enforce authenticated membership/role checks server-side.
- Private documents are served through authorized API routes rather than a public static folder.
- Secrets, local uploads, dependency folders, caches, reports, and local environment files are excluded from Git.

## Quality checks

Run each suite directly:

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

The integration candidate was prepared from a locally verified implementation with 36 backend tests, 59 frontend tests, 10 ML tests, backend syntax checks, and a successful production frontend build. See `QA_TEST_REPORT.md` and `QA_REMEDIATION_IMPLEMENTATION_PLAN.md` for the detailed audit trail and remaining release considerations.

## Important data and artifact notes

- `pakwheels_used_car_data_v02.csv` is the retained training dataset supplied with the project.
- `Executive Cars.docx` and `PROJECT_AUDIT.md` are retained historical project artifacts.
- Generated uploads and private documents must be stored outside the Git repository in production.
- Model training can create large versioned artifacts; review them before intentionally adding any new artifact to Git LFS.
