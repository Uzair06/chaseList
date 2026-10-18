# ChaseList

ChaseList is a MERN MVP for bookkeepers to manage clients, create monthly document checklists, share secure upload links, and review submissions. The frontend lives in `client/`; the Express/Mongoose API lives in `server/`.

## Requirements

- Node.js 20.19+ (or 22.12+) and npm
- A MongoDB Atlas cluster and database user
- An AWS account with a private S3 bucket and a least-privilege IAM identity

## Configure the services

1. Create a MongoDB Atlas cluster and database user. Add the development machine's IP to the Atlas network access list. Copy the **application connection string** and replace its username/password placeholders.
2. Create an S3 bucket in the AWS region you will use. Keep **Block all public access** enabled and enable default bucket encryption. Do not add a public-read bucket policy or object ACL.
3. Create an IAM role/user for the API with access limited to this bucket. The API needs `s3:PutObject`, `s3:GetObject`, and `s3:DeleteObject` on the bucket's objects. In production, prefer an instance/task role over long-lived access keys.
4. Copy the example environment file into the server package and fill in the values:

   ```bash
   cp .env.example server/.env
   ```

   Set `MONGODB_URI`, `JWT_SECRET`, `AWS_REGION`, and `S3_BUCKET`. Generate a random signing secret, for example with `openssl rand -base64 48`. `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` may be left blank when the AWS SDK can use an IAM role or another standard credential provider.

   `CLIENT_ORIGIN` is the exact browser origin allowed to call the API; `CLIENT_URL` is the base used when generating client links. They are both `http://localhost:5173` for the local Vite setup. In production, set `NODE_ENV=production` and set both URLs to your deployed frontend origin. Serve the frontend and API over HTTPS; production auth cookies require HTTPS.

   `S3_ENDPOINT` is optional and intended only for an S3-compatible local service such as MinIO. Do not set it for AWS S3.

## Install and run

In separate terminals:

```bash
cd server
npm install
npm run dev
```

```bash
cd client
npm install
npm run dev
```

Open the Vite URL shown in the client terminal (normally `http://localhost:5173`). Vite proxies `/api` requests to `http://localhost:4000`.

For frontend development, `VITE_API_URL` may be left blank to use that Vite proxy. The client appends `/api` to the configured backend origin, so do not include `/api` in `VITE_API_URL`.

Production builds:

```bash
cd server && npm run build
cd ../client && npm run build
```

The API is started with `npm start` from `server/` after building. Deploy the React static build and API behind HTTPS, and set the production environment variables in the hosting provider's secret/environment settings—not in source control.

## Production deployment settings (not deployed from this repository)

### Render API service

Create a **Web Service** with:

- Root directory: `server`
- Runtime: Node
- Node version: 20.19+ (or 22.12+)
- Build command: `npm ci && npm run build`
- Start command: `npm start`
- Health check path: `/api/health`

In Atlas Network Access, allow the Render service's outbound IP addresses (or use an approved private networking option). Do not assume the developer machine's IP allowlist entry also covers Render.

Set these in the Render service environment (never commit them):

- `NODE_ENV=production`
- `MONGODB_URI` — Atlas connection string
- `JWT_SECRET` — at least 32 random characters
- `AWS_REGION` and `S3_BUCKET`
- `CLIENT_ORIGIN` — the exact deployed frontend HTTPS origin, with no trailing slash
- `CLIENT_URL` — the same frontend origin, with no path
- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` only if Render is not using an AWS IAM credential provider

Leave `S3_ENDPOINT` unset for AWS S3. Render supplies `PORT`; the API already reads it. Configure the S3 bucket's public-access block and IAM policy separately in AWS.

### Vercel frontend

Import this repository into Vercel and set:

- Root directory: `client`
- Framework preset: Vite
- Node.js version: 22.x
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL` = the API **origin only** (for example, `https://api.example.com`; ChaseList appends `/api`)

`client/vercel.json` supplies the React Router SPA fallback. Set `VITE_API_URL` for the Production environment and redeploy the frontend after changing it; Vite embeds this value at build time.

The API uses credentialed CORS and an exact `CLIENT_ORIGIN` allowlist. The session is an HttpOnly cookie with `SameSite=None; Secure` in production. For reliable browser cookie behavior, use a shared custom site such as `app.example.com` on Vercel and `api.example.com` on Render. The default `*.vercel.app` and `*.onrender.com` hosts are cross-site, and browsers may block their cookies as third-party cookies. Point `CLIENT_ORIGIN` and `CLIENT_URL` at the canonical frontend origin; Vercel preview origins are not automatically allowed.

### Resend status

Resend is not integrated in the current MVP. Reminders still open the bookkeeper's email app; the app does not send email. `RESEND_API_KEY` by itself is unused. If automatic email is added later, configure a verified sender (for example `RESEND_FROM_EMAIL`) as well as the API key, and implement/test the sending flow before claiming it works.

## MVP workflows

- Register or sign in as a bookkeeper. Passwords are hashed with Argon2id; the session is an HttpOnly cookie.
- Add, view, edit, search, and delete clients. Deleting a client also removes its requests and private S3 objects.
- Create a monthly request manually with required/optional file requests and client-answer questions.
- Copy the generated, unguessable upload link or prepare a reminder in the bookkeeper's own email app. Email is **not sent by ChaseList**. Preparing a later reminder rotates the link and invalidates the previous one.
- Clients open the upload page without an account, upload PDF/JPG/PNG files (20 MB each maximum), answer questions, mark optional items not applicable, and submit.
- Bookkeepers review submissions, open a 60-second signed private download link, and accept or reject each item. A rejection requires a note.

There is no seeded client data. The marketing-page dashboard image is clearly labeled sample data and is only a visual preview.

## Security and current scope

- Every authenticated client/request query is scoped to the logged-in bookkeeper. Public routes require a random 256-bit link token; only its SHA-256 hash is stored. Links expire after 30 days.
- Files are validated by MIME type and file signature, capped at 20 MB per file and 10 files per checklist item, uploaded server-side to private S3, encrypted at rest with S3 SSE-S3, and never served from a public URL. Bookkeepers get short-lived signed downloads.
- The API uses input validation, rate limits for auth/public-link routes, security headers, secure cookie settings, and an Origin check for authenticated mutations.
- Request creation and reminders are manual. The reminder action opens a prefilled email in the bookkeeper's email app; there is no automatic email delivery or monthly scheduler.
- Client upload links expire after 30 days; creating a reminder rotates the token and resets that expiry. Signed file-download URLs expire after 60 seconds.
- Stripe, SMS, Google Drive, and AI document classification are not included.

## Useful commands

Run `npm run lint` and `npm run build` inside `client/`. Run `npm run build` inside `server/`. There is no configured automated test suite yet; full upload verification also requires a configured S3 bucket/compatible service.
