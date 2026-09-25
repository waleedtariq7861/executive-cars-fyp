# GitHub + Vercel + Render Free deployment

This guide uses the GitHub `main` branch, a Vercel Vite project for the frontend, and the root `render.yaml` Blueprint for one Render Free Node API. The repository does not deploy the 1 GB ML model on Render Free. No custom domain is needed for the initial setup. Email delivery remains unresolved on Render Free; choose a provider or a different hosting plan before relying on booking OTP and password reset.

## 1. Prepare the external services

1. In [MongoDB Atlas](https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/), create or select an M0 cluster, a database user, and a connection string for `MONGO_URI`. Add the Render service's [outbound IP ranges](https://render.com/docs/outbound-ip-addresses) to the Atlas IP access list after Render creates the service. Keep the connection string out of Git.
2. In [Cloudinary](https://cloudinary.com/pricing), obtain `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. All three are needed for durable listing images and private documents because the Render Free filesystem is temporary.

The current email implementation uses Gmail SMTP. Render Free blocks outbound SMTP ports 25, 465, and 587. No alternate email provider has been selected or integrated. Booking OTP requests will fail and password reset messages will not arrive until email delivery is addressed.

## 2. Create the Render backend

1. Connect GitHub to Render and select **New > Blueprint**. Choose this repository and its `main` branch. Render reads `render.yaml` at the repository root. The Blueprint creates one Free web service, `executive-cars-api` (or a unique name if this one is unavailable).
2. Render prompts for the `sync: false` values. Set `MONGO_URI`, `CLIENT_URL`, and the three Cloudinary variables. `CLIENT_URL` must be the exact HTTPS Vercel production origin, without a trailing slash, for example `https://your-project.vercel.app`. Pick the intended Vercel project name now; correct the value after Vercel assigns its actual URL. Render generates `JWT_SECRET` itself. The Blueprint already sets `NODE_ENV=production`, `APP_MODE=production`, `PAYMENT_MODE=disabled`, `ENABLE_DEMO_SEED=false`, and `REQUIRE_CLOUDINARY=true`.
3. Do not set local demo credentials or `ENABLE_DEMO_SEED=true`. Do not set `ML_API_URL` or `ML_SERVICE_URL` unless a separate, adequately sized ML service is deployed.
4. After Render provides its `https://...onrender.com` URL, configure Atlas network access using the Render outbound IP ranges. Redeploy if the first attempt could not reach Atlas. Confirm `https://YOUR-RENDER-HOST/api/health` returns `status: ok` and `database: connected`.

The Blueprint intentionally runs from the repository root: `executive-cars-backend-main/src/services/vehicleOptionsService.js` reads `ml-service/reports/vehicle_options.json` at runtime. Render's root directory setting would hide this file if it were set to the backend folder.

## 3. Create the Vercel frontend

1. Import the same GitHub repository into Vercel. Set **Root Directory** to `executive-cars-frontend-main`, framework **Vite**, build command `npm run build`, and output directory `dist`. Vercel can use the committed package lock for installation.
2. Confirm the Render API origin is `https://executive-cars-backend.onrender.com`, the target committed in `executive-cars-frontend-main/vercel.json`. If the Render hostname changes, update that file before deploying. Set `VITE_APP_MODE=production` and `VITE_ENABLE_DEMO_ACCOUNTS=false` (or leave the latter unset). Leave `VITE_API_URL` and `VITE_SOCKET_URL` unset so the browser uses Vercel's same-origin `/api` and `/socket.io` rewrites. `BACKEND_ORIGIN` is no longer used.
3. Deploy. Copy Vercel's actual production origin into Render's `CLIENT_URL` if it differs from the value entered earlier, then redeploy the Render service. Changes to the rewrite target require a commit and a new Vercel deployment.
4. For authenticated preview domains, add each exact HTTPS origin to Render's comma-separated `CLIENT_URLS`. Otherwise, use only the production domain for login and mutations. The backend checks request origin and CSRF token.

## 4. Create the first administrator

On your own computer, allowlist that computer's current IP in Atlas and use the ignored `executive-cars-backend-main/.env` file with `MONGO_URI` pointing to the intended Atlas database. Temporarily add `BOOTSTRAP_ADMIN_CONFIRM=create-first-admin`, `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_EMAIL`, and a unique `BOOTSTRAP_ADMIN_PASSWORD` of at least 12 characters. Run `npm --prefix executive-cars-backend-main run bootstrap:admin` from the repository root. The command refuses to create another admin if one already exists. Remove the four bootstrap variables from the local file after success. Never commit the password or put it in a shell command. Render Free does not provide an interactive service shell.

The frontend's `vercel.json` forwards HTTP `/api/*` and Socket.IO `/socket.io/*` requests to Render, then serves `index.html` for application routes. This keeps the HttpOnly session cookie on the Vercel origin. The client uses HTTP polling for this same-origin production route because WebSocket upgrades through Vercel external rewrites are **UNVERIFIED**. Polling still needs a live browser smoke test.

## 5. Verify the deployed app

1. Open the Vercel URL and a deep link such as `/used-cars`; both should load the app.
2. Open `https://YOUR-VERCEL-HOST/api/health`; it should show `database: connected`. A 404 or HTML response means the Vercel rewrite target is wrong.
3. Register a fresh account, sign out, sign in, and refresh `/account`. If session or mutation requests fail with 403, check Render `CLIENT_URL` against the address bar's exact origin.
4. After an email delivery approach is chosen and implemented, verify an inspection booking OTP and a password reset message end to end. These flows are not operational on the current Render Free setup.
5. Upload a test listing image/document through the intended app workflow and verify it survives a Render redeploy. If it disappears, check the three Cloudinary settings.
6. Test a member's live auction view and bid update in two browser sessions. Confirm Socket.IO polling connects through `/socket.io/`; this is a required live verification before relying on realtime bidding.

## Limits of this free setup

- Render says Free web services spin down after 15 minutes idle, take time to wake, have a temporary filesystem, and cannot send SMTP on ports 25/465/587. The current email flows need a separately agreed solution. Auction closing runs in the backend process every minute and catches up when it restarts, so closures and live updates can be delayed while asleep. [Render Free limits](https://render.com/docs/free)
- Render Free has 512 MB RAM. The active ML artifact is about 1 GB on disk, so the ML service is omitted. Price prediction currently returns an unavailable error without a configured ML service. The existing comparable-listing fallback is not selected by the normal prediction route. [Render plans](https://render.com/docs/compute-plans)
- Public production disables the demo membership activation endpoint. The current auction payment UI still shows its demonstration action because the requested UI was left unchanged; that action cannot activate membership in this deployment. No real payment provider is implemented.
- The Git LFS model artifact may be fetched during Render's Git build despite the ML service being omitted. Render's LFS checkout behavior for this Blueprint is **UNVERIFIED**; inspect the first build's size and logs.
- Render describes its Free service as suitable for evaluation and hobby use rather than a reliable production service. These constraints should be resolved before taking real payments or promising continuous auctions. [Render Free limits](https://render.com/docs/free)

Sources: [Vercel static configuration](https://vercel.com/docs/project-configuration/vercel-json), [Vercel external rewrites](https://vercel.com/docs/routing/rewrites), [Render Blueprints](https://render.com/docs/infrastructure-as-code), [Render monorepo root directory](https://render.com/docs/monorepo-support).
