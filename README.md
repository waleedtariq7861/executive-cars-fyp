# Executive Cars

Executive Cars is a Final Year Project automotive marketplace with used-car listings, managed selling and inspection bookings, auctions, customer and administrator accounts, saved cars, dashboards, and a historical-data car-price predictor.

The predictor uses the attached `pakwheels_used_car_data_v02.csv` dataset through a reproducible Python pipeline. React continues to call `POST /api/predict-price`; Express validates and proxies the request to FastAPI.

## Technology stack

- Frontend: React 18, Vite, React Router, Tailwind CSS, Axios, Socket.IO client
- Backend: Node.js, Express, Mongoose, MongoDB, JWT, Socket.IO
- ML service: Python, FastAPI, pandas, scikit-learn, CatBoost, joblib
- Optional integrations: Cloudinary, Stripe, SMTP, Groq

## Project layout

```text
executive-cars-frontend-main/   React/Vite application
executive-cars-backend-main/    Express/Mongoose API
ml-service/
  app/                          cleaning, training, inference, FastAPI
  models/                       local trained model versions and registry
  reports/                      inspection, cleaning, evaluation, catalogue
  tests/                        Python tests
pakwheels_used_car_data_v02.csv original, unmodified training dataset
scripts/dev-full.mjs            combined local runner
PROJECT_AUDIT.md                pre-implementation audit
```

## Prerequisites

- macOS with Node.js 20+ and npm
- Python 3.11+ (`python3`)
- MongoDB locally or a MongoDB Atlas connection

## Install

From the project root:

```bash
npm --prefix executive-cars-frontend-main install
npm --prefix executive-cars-backend-main install
python3 -m venv ml-service/.venv
source ml-service/.venv/bin/activate
pip install -r ml-service/requirements.txt
cp executive-cars-backend-main/.env.example executive-cars-backend-main/.env
cp executive-cars-frontend-main/.env.example executive-cars-frontend-main/.env
cp ml-service/.env.example ml-service/.env
```

Configure MongoDB and secrets before starting the backend. Do not commit any `.env` file.

## Environment variables

Backend (`executive-cars-backend-main/.env`):

```dotenv
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/executive_cars
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://127.0.0.1:5173
CLIENT_URLS=http://localhost:5173
ML_API_URL=http://127.0.0.1:8000
ML_SERVICE_URL=http://127.0.0.1:8000
ML_SERVICE_KEY=
```

Cloudinary, Stripe, SMTP, and Groq variables in `.env.example` are required only for their existing workflows. Development administrator credentials are optional seed values and must be chosen locally.

ML (`ml-service/.env`):

```dotenv
ML_HOST=127.0.0.1
ML_PORT=8000
ML_SERVICE_KEY=
MODEL_DIR=./models
REPORT_DIR=./reports
ML_RELOAD=false
```

Frontend (`executive-cars-frontend-main/.env`):

```dotenv
VITE_API_URL=
VITE_SOCKET_URL=
VITE_DEV_SERVER_TARGET=http://127.0.0.1:5000
VITE_BUSINESS_CITY=Pakistan
VITE_BUSINESS_ADDRESS=
VITE_CONTACT_PHONE=
VITE_CONTACT_EMAIL=
```

When the backend uses another port, update `VITE_DEV_SERVER_TARGET`. Public contact fields are intentionally blank unless genuine project information is supplied.

## Dataset and model training

Keep the original CSV at:

```text
pakwheels_used_car_data_v02.csv
```

Train from the project root:

```bash
npm run ml:train
```

Equivalent explicit command:

```bash
source ml-service/.venv/bin/activate
cd ml-service
python -m app.train --input ../pakwheels_used_car_data_v02.csv
```

The pipeline does not modify the CSV. It writes versioned model artifacts to `ml-service/models/` and JSON reports to `ml-service/reports/`.

### Current trained result

- Source rows: 77,878
- Cleaned rows: 72,179
- Models compared: median baseline, two Extra Trees configurations and histogram gradient boosting
- Controlled three-fold cross-validation trials: 4 completed, 0 failed
- Selected model: `extra_trees_320_regularized`
- Untouched test MAE: PKR 328,377.64
- Untouched test RMSE: PKR 952,957.28
- Untouched test R²: 0.9548
- Test MAPE: 10.324% (reported as an error metric, not “accuracy”)
- Median absolute error: PKR 152,900.99
- Range: 90% split-conformal absolute-residual interval
- Calibration residual quantile: PKR 632,402.86
- Empirical untouched-test coverage: 89.97%
- Saved model: `ml-service/models/ec-20260818-120644-13d9e2ba/model.joblib`

Full details are in `ml-service/reports/model_evaluation.json` and `ml-service/README.md`.

## Run the application

Use four terminals when MongoDB is local.

Terminal 1 — MongoDB:

```bash
mongod --dbpath /path/to/your/mongodb-data
```

Terminal 2 — ML API:

```bash
npm run ml
```

Terminal 3 — Node API:

```bash
npm run server
```

Terminal 4 — React:

```bash
npm run dev
```

After MongoDB is available, the three application services can also be launched together:

```bash
npm run dev:full
```

If macOS already uses port 5000, set `PORT=5001` in the backend `.env` and set `VITE_DEV_SERVER_TARGET=http://127.0.0.1:5001`.

## Development demonstration accounts

MongoDB must be running and `MONGO_URI` must point to the intended local development database. Set `ENABLE_DEMO_SEED=true` in `executive-cars-backend-main/.env`, then create the linked local FYP demonstration data with:

```bash
npm run seed:demo
```

The command is development-only, production-gated, and idempotent. It creates four accounts, five marketplace listings, four auctions, six valid bids, four inspection records, an OTP challenge, and Waleed's three saved cars. Active memberships have `membershipSource: demo`; no Stripe transaction or payment is created.

To display the account-fill buttons locally, set `VITE_ENABLE_DEMO_ACCOUNTS=true` in `executive-cars-frontend-main/.env` before starting Vite. The buttons only fill the form; users must still submit the real login form.

| Account | Role | Email | Password |
| --- | --- | --- | --- |
| Executive Cars Admin | admin | `admin@executivecars.pk` | `Admin@12345` |
| Waleed Tariq | active demo member | `member@executivecars.pk` | `Member@12345` |
| Demo User | regular user, no membership | `user@executivecars.pk` | `User@12345` |
| Hamza Ali | active demo bidder | `bidder@executivecars.pk` | `Bidder@12345` |

Remove only tagged demo data when needed:

```bash
npm run seed:demo:reset
```

**Development warning:** the listed credentials and data are for local FYP demonstration only. Demo seeding is disabled in production and reset removes only records tagged by this seed; it never wipes the database.

## Health and prediction checks

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:5000/api/health
```

Direct FastAPI request:

```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H 'Content-Type: application/json' \
  -d '{"make":"Toyota","model":"Corolla","year":2020,"mileage":45000,"engineCapacity":1300,"transmission":"Auto","fuelType":"Petrol","city":"Lahore","registrationCity":"Lahore","bodyType":"Sedan","assemblyType":"Local"}'
```

Preserved frontend contract through Express:

```bash
curl -X POST http://127.0.0.1:5000/api/predict-price \
  -H 'Content-Type: application/json' \
  -d '{"make":"Toyota","model":"Corolla","year":2020,"mileage":45000,"engineCapacity":1300,"transmission":"Auto","fuelType":"Petrol","city":"Lahore","registrationCity":"Lahore","bodyType":"Sedan","assemblyType":"Local"}'
```

## Quality checks

```bash
npm run check
npm test
```

`npm run check` performs backend syntax validation and a production frontend build. The full test command runs backend API tests, frontend component tests, and ML tests.

## Database notes

Mongoose creates collections and indexes on first use. There is no destructive seed command. Customer registration is public; administrator access requires locally configured seed credentials. Saved cars are stored against the authenticated `Member` record, while guest saves remain browser-local.

## Limitations

- The attached data represents historical listing prices, not confirmed sale prices.
- Dataset vehicles end at model year 2022; predictions for newer vehicles are extrapolations and are labelled with warnings.
- Price movements after the dataset collection period are not learned until retraining with newer data.
- The range describes calibrated residual uncertainty, not a guarantee or a confidence percentage for an individual sale.
- Inspection score and condition are not trained features because the attached CSV does not contain them.
- Exact final sale value still depends on trim, documentation, physical condition, local demand, and negotiation.

## Troubleshooting

- `modelLoaded: false`: run `npm run ml:train`, then restart the ML API.
- Express returns ML unavailable: confirm FastAPI health and `ML_API_URL`.
- MongoDB disconnected: correct `MONGO_URI` and start MongoDB.
- Frontend API errors: make the Vite target match the backend port.
- Unsupported make/model: use the options returned by `GET /api/predict-price/options`.
- CatBoost installation issue: activate `ml-service/.venv` and reinstall `ml-service/requirements.txt`.

## FYP demonstration flow

1. Open the homepage and marketplace; show real API loading/error/empty states.
2. Register or sign in and save a car; refresh to demonstrate account persistence.
3. Open a listing and show its vehicle details and any available inspection status.
4. Sign in as the test member, book a managed vehicle inspection, and show it in My Bookings.
5. Sign in through the separate administrator flow, review the sample inspection booking, and demonstrate auction membership/bid validation.
6. Open Price Predictor, select a dataset-valid make/model, and generate a valuation.
7. Show the customer-focused estimate, expected range, important factors, and short historical-data disclaimer.
8. Show `/health`, the JSON reports, and the administrator model registry.
