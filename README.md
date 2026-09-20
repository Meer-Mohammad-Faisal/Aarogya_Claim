# AarogyaID Claims Management Platform

## Overview

AarogyaID is a focused claims-management platform with separate patient and insurer portals. Patients submit claims and track their outcomes, while insurers review supporting documents and make claim decisions. A shared Express REST API provides JWT authentication, role authorization, validation, MongoDB persistence, and Cloudinary document storage.

## Features

### Patient

- **P-1 — Submit a Claim:** Submit name, email, claim amount, description, and a PDF/JPG/JPEG/PNG supporting document.
- **P-2 — View Claims:** View submitted claims, status, submission date, approved amount, insurer comments, and supporting documents.

### Insurer

- **I-1 — Claims Dashboard:** View all claims with real API-backed status, date, and amount filters.
- **I-2 — Manage Claims:** Open claim details, view documents, approve or reject claims, set approved amounts, and add comments.

### Shared

- **S-1 — Authentication:** JWT login, bcrypt password hashing, persistent frontend session state, and server-side role authorization.
- **S-2 — API:** Express REST endpoints with validation, predictable errors, and protected routes.
- **S-3 — Database:** Mongoose models and MongoDB persistence for users and claims.

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, Axios, React Router, Context API

**Backend:** Node.js, Express, Mongoose, JWT, bcrypt, Multer, Cloudinary

**Database:** MongoDB Atlas compatible

## Architecture

```text
Patient / Insurer
        |
        v
JWT authentication -> role authorization
        |
        v
React frontend -> Express REST API -> MongoDB
                                      |
                                      v
                           Cloudinary document URLs
```

For a document submission, the browser sends multipart form data to the API. Multer validates the file type and size, Cloudinary stores the document, and the resulting secure URL is saved on the claim record. The portals open that URL when a document is viewed.

## Project Structure

```text
frontend/
  src/
    components/   Shared shell, routes, forms, and UI components
    context/      Authentication context
    pages/        Login, patient portal, insurer portal, and not-found page
    services/      Axios client and API calls
    utils/        Formatting and frontend helpers
    App.jsx
    main.jsx

backend/
  src/
    config/       Environment and database configuration
    controllers/  Authentication and claim request handlers
    middleware/   Authentication, authorization, uploads, and errors
    models/       User and Claim Mongoose models
    routes/       Express route definitions
    utils/        JWT, Cloudinary, and validation helpers
    app.js
    server.js
    seed.js
```

## Local Setup

Requirements: Node.js 20+ and MongoDB Atlas or a local MongoDB instance. Cloudinary credentials are required for successful document uploads.

```bash
git clone <your-repository-url> aarogya-claims-platform
cd aarogya-claims-platform

# Install both workspace dependencies
npm install

# Equivalent explicit workspace installation, if preferred
npm install --workspace frontend
npm install --workspace backend

# Create local environment files
copy backend/.env.example backend/.env
copy frontend/.env.example frontend/.env
```

Fill in the environment values described below, then use two terminals:

```bash
# Terminal 1
npm run seed --workspace backend
npm run dev:backend

# Terminal 2
npm run dev:frontend
```

The local frontend runs at `http://localhost:5173` and the API runs at `http://localhost:5000`.

## Environment Variables

Create `backend/.env` from `backend/.env.example`:

| Variable | Purpose |
| --- | --- |
| `PORT` | Backend listening port. |
| `MONGODB_URI` | MongoDB Atlas or local MongoDB connection string. |
| `JWT_SECRET` | Long, private signing secret. |
| `JWT_EXPIRES_IN` | JWT lifetime, for example `1d`. |
| `CLIENT_URL` | Allowed frontend origin(s), comma-separated when needed. |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret. |
| `CLOUDINARY_FOLDER` | Cloudinary folder for claim documents. |
| `SEED_PATIENT_NAME` | Seed-only patient name. |
| `SEED_PATIENT_EMAIL` | Seed-only patient email. |
| `SEED_PATIENT_PASSWORD` | Seed-only patient password. |
| `SEED_INSURER_NAME` | Seed-only insurer name. |
| `SEED_INSURER_EMAIL` | Seed-only insurer email. |
| `SEED_INSURER_PASSWORD` | Seed-only insurer password. |

Create `frontend/.env` from `frontend/.env.example`:

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | API base URL, including `/api`, for example `http://localhost:5000/api`. |

Never commit `.env` files or real credentials. The example files contain placeholders and the documented demo seed values only.

## Mock Credentials

These are demo credentials for local assessment use:

| Role | Email | Password |
| --- | --- | --- |
| Patient | `patient@aarogya.demo` | `Patient@123` |
| Insurer | `insurer@aarogya.demo` | `Insurer@123` |

## API Documentation

All protected requests use `Authorization: Bearer <JWT>`. Successful responses use a simple `success` and `data` structure. Errors use `{ "success": false, "message": "Human readable error" }`.

| Method and endpoint | Role | Purpose and request format |
| --- | --- | --- |
| `POST /api/auth/login` | Public | JSON body: `{ "email": "...", "password": "..." }`. Returns a JWT and safe user information including role. |
| `POST /api/claims` | Patient | Multipart form data with `name`, `email`, `claimAmount`, `description`, and file field `document`. Creates a Pending claim for the authenticated patient. |
| `GET /api/claims/my` | Patient | Returns only the authenticated patient's claims. |
| `GET /api/claims` | Insurer | Returns claims with optional `status`, `from`, `to`, `minAmount`, and `maxAmount` query filters. |
| `GET /api/claims/:id` | Insurer or owning patient | Returns complete claim details, including the document URL when available. |
| `PATCH /api/claims/:id/status` | Insurer | JSON body: `status`, `approvedAmount`, and `insurerComments`. Approved amounts are validated against the requested amount. |

Additional operational endpoints include `GET /api/health` and the development role-check endpoints under `/api/auth`.

## Deployment

No deployment has been performed yet. The intended architecture is:

```text
Vercel frontend -> Render Node/Express backend -> MongoDB Atlas
                                               -> Cloudinary
```

Deployment placeholders:

- Frontend: `<FRONTEND_URL>`
- Backend: `<BACKEND_URL>`
- GitHub: `<GITHUB_URL>`

### Vercel

1. Import the repository into Vercel.
2. Set the project root directory to `frontend`.
3. Use `npm run build` as the build command and `dist` as the output directory.
4. Set `VITE_API_BASE_URL` to `<BACKEND_URL>/api`.

### Render

1. Create a Node web service from the repository with root directory `backend`.
2. Use `npm install` as the build command and `npm start` as the start command.
3. Add all backend variables from the environment table, using production MongoDB Atlas, JWT, Cloudinary, and CORS values.
4. Run `npm run seed` once from the service shell if demo users are required.
5. Set `CLIENT_URL` to the deployed Vercel origin, then redeploy if that value was not available initially.

### MongoDB Atlas and Cloudinary

Create a least-privilege database user, configure the Atlas network access needed by the hosting provider, and use the resulting URI only as a hosted environment variable. Configure Cloudinary credentials in the backend host; do not place them in source control.

## Assumptions

- Registration, password reset, and email verification are outside the assessment scope; demo users are seeded instead.
- Every new claim starts with `Pending` status and uses the authenticated patient's identity.
- Approved amounts are meaningful only for approved claims and cannot exceed the requested claim amount.
- Documents are stored in Cloudinary and only their URLs and metadata are persisted with claims.

## Limitations

- The application has not been deployed from this repository; hosted URLs remain placeholders.
- There is no automated end-to-end test suite; the documented verification was performed with local API and build smoke tests.
- Production operational features such as registration, password reset, email notifications, audit history, and pagination are not included because they are outside the requested take-home scope.

## Assessment Mapping

| Requirement | Implementation | Status |
| --- | --- | --- |
| P-1 | Patient claim form with validation and Cloudinary-backed document upload | Implemented |
| P-2 | Patient-only claim list and claim detail view | Implemented |
| I-1 | Insurer dashboard with real summary counts and server-side filters | Implemented |
| I-2 | Insurer review, document access, approval, rejection, amounts, and comments | Implemented |
| S-1 | JWT authentication, bcrypt hashing, protected routes, and role authorization | Implemented |
| S-2 | Express REST API with validation and centralized error responses | Implemented |
| S-3 | Mongoose User and Claim models with MongoDB persistence and timestamps | Implemented |

## Screenshots

Screenshots can be added here before submission for the login page, patient portal, insurer dashboard, and claim review flow.

