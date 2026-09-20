# AarogyaID Claims Management Platform

## Live Demo and Quick Login

Live application:

- LIVE LINK: <https://frontend-brown-delta-88.vercel.app>
- GitHub repository: <https://github.com/Meer-Mohammad-Faisal/Aarogya_Claim>

Demo credentials:

| Role | Email | Password |
| --- | --- | --- |
| Patient | `patient@aarogya.demo` | `Patient@123` |
| Insurer | `insurer@aarogya.demo` | `Insurer@123` |

These accounts are for demonstration only. The application uses seeded mock users because registration is outside the assessment scope.

## 1. Steps to Run the Application Locally

### Requirements

- Node.js 20 or later
- MongoDB Atlas or a local MongoDB server
- Cloudinary account for document uploads

### Install the project

```powershell
git clone https://github.com/Meer-Mohammad-Faisal/Aarogya_Claim.git
cd Aarogya_Claim
npm install
```

The repository uses npm workspaces. The root install installs both frontend and backend dependencies. They can also be installed separately:

```powershell
npm install --workspace frontend
npm install --workspace backend
```

### Create environment files

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Fill in the values described in the environment variables section.

### Seed the demo users

```powershell
npm run seed --workspace backend
```

### Start the application

Open two terminals in the project root.

Terminal 1 — backend:

```powershell
npm run dev:backend
```

Terminal 2 — frontend:

```powershell
npm run dev:frontend
```

Open <http://localhost:5173>. The local API runs at <http://localhost:5000>.

Useful root commands:

```powershell
npm run build
npm run lint
```

## 2. Required Environment Variables

Never commit real `.env` files. The repository includes safe examples at `backend/.env.example` and `frontend/.env.example`.

### Backend example: `backend/.env`

```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster-host/aarogya_claims
JWT_SECRET=replace-with-a-long-random-secret-at-least-32-characters
JWT_EXPIRES_IN=9d
CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER=aarogya-claims

SEED_PATIENT_NAME=Demo Patient
SEED_PATIENT_EMAIL=patient@aarogya.demo
SEED_PATIENT_PASSWORD=Patient@123
SEED_INSURER_NAME=Demo Insurer
SEED_INSURER_EMAIL=insurer@aarogya.demo
SEED_INSURER_PASSWORD=Insurer@123
```

Backend variables:

| Variable | Purpose |
| --- | --- |
| `PORT` | Port used by the Express server. Hosting providers provide this automatically. |
| `MONGODB_URI` | MongoDB Atlas or local MongoDB connection string. |
| `JWT_SECRET` | Private JWT signing key with at least 32 characters. |
| `JWT_EXPIRES_IN` | JWT lifetime, such as `1d`. |
| `CLIENT_URL` | Allowed frontend origin used by CORS. Multiple origins may be comma-separated. |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Private Cloudinary API secret. |
| `CLOUDINARY_FOLDER` | Folder used for uploaded claim documents. |
| `SEED_*` variables | Values used only by the demo-user seed command. |

### Frontend example: `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

For production, set:

```env
VITE_API_BASE_URL=https://aarogya-claim.onrender.com/api
```

Only public frontend configuration belongs in Vercel. MongoDB, JWT, and Cloudinary secrets must remain on the backend host.

## 3. Mock Login Credentials

### Patient

```text
Email: patient@aarogya.demo
Password: Patient@123
```

The patient can submit claims, upload supporting documents, view their own claims, and see insurer decisions.

### Insurer

```text
Email: insurer@aarogya.demo
Password: Insurer@123
```

The insurer can view all claims, filter the queue, open documents, and approve or reject claims.

## 4. Live Deployment Link

The current deployed application is:

```text
https://frontend-brown-delta-88.vercel.app
```

The backend API is deployed at:

```text
https://aarogya-claim.onrender.com
```

The backend health endpoint is:

```text
https://aarogya-claim.onrender.com/api/health
```

## 5. Assumptions and Incomplete Features

### Assumptions

- Registration, password reset, and email verification are not required, so two demo users are seeded.
- A patient can only create and view claims associated with their authenticated account.
- Every new claim starts with `Pending` status.
- Approved amounts cannot exceed the original claim amount.
- Approved amounts are only meaningful for approved claims.
- Supporting documents are stored in Cloudinary and their URLs are stored with the claim in MongoDB.
- Date filters use the submitted claim date and UTC day boundaries on the API.

### Deliberately incomplete or out of scope

- No public registration flow.
- No password reset or email verification.
- No email notifications.
- No claim audit-history timeline.
- No pagination because the assessment is scoped to a focused take-home implementation.
- No automated browser end-to-end test suite; local API, build, and manual flow verification were performed.
- A demo video must be recorded separately if the submission portal requires a video URL. The screenshots in the submission cover the main patient and insurer flows.

## 6. Deployment Details

### Architecture

```text
Vercel frontend
        |
        v
Render Express API
        |
        +--> MongoDB Atlas
        |
        +--> Cloudinary document storage
```

### Frontend deployment — Vercel

- Provider: Vercel
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Required variable: `VITE_API_BASE_URL=https://aarogya-claim.onrender.com/api`
- `frontend/vercel.json` provides the SPA rewrite needed for direct routes such as `/login`, `/patient`, and `/insurer`.

### Backend deployment — Render

- Provider: Render Web Service
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Required production variables: MongoDB, JWT, CORS, Cloudinary, and seed variables listed above.
- The server listens on Render's `PORT` value.
- Demo users are seeded with `npm run seed` after the production environment variables are configured.

### Database and document storage

MongoDB Atlas stores users and claims. User passwords are bcrypt-hashed and are never returned through the API. Cloudinary stores PDF, JPG, JPEG, and PNG supporting documents up to 5 MB. Only the resulting document URL and upload metadata are associated with a claim.

## 7. Detailed Product Explanation

### Product purpose

AarogyaID is a claims-management workspace for patients and insurance teams. It separates patient self-service from insurer review while keeping both experiences connected through one authenticated REST API.

### Patient flow

1. The patient signs in with the seeded patient account.
2. The frontend stores the authenticated session and routes the patient to `/patient`.
3. The patient opens **Submit New Claim**.
4. The form validates the name, email, positive claim amount, description, and supporting document.
5. The browser sends the claim as `multipart/form-data`.
6. Multer validates the file type and size on the server.
7. Cloudinary stores the document and returns a secure URL.
8. MongoDB stores the claim with the authenticated patient's `patientId`, `Pending` status, and submission date.
9. The patient can view only their own claims, open claim details, and open the uploaded document.

### Insurer flow

1. The insurer signs in with the seeded insurer account.
2. The frontend routes the insurer to `/insurer`.
3. The dashboard loads all claims and calculates real Total, Pending, Approved, and Rejected counts.
4. The insurer can filter through the API by status, submission date, minimum amount, and maximum amount.
5. The insurer opens a claim review panel to see patient information, claim details, description, and document access.
6. The insurer selects `Approved`, `Rejected`, or `Pending`.
7. Approved claims require a non-negative approved amount that does not exceed the requested amount.
8. Rejected claims clear the approved amount and may include insurer comments.
9. The updated claim is saved to MongoDB and immediately reflected in the insurer queue.
10. When the patient refreshes their portal, the updated status, approved amount, and insurer comments are visible.

### Authentication and authorization

```text
Login credentials
        |
        v
Express login endpoint -> bcrypt password comparison -> JWT
        |
        v
Frontend AuthContext -> protected routes -> Axios Bearer token
        |
        v
authenticate middleware -> requireRole middleware -> controller
```

JWTs contain the authenticated user identity and role. The backend—not only the frontend—enforces patient and insurer permissions. Patients cannot access insurer endpoints, another patient's claim, or insurer-managed fields.

### Main API endpoints

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | Public | Authenticate a patient or insurer and return a JWT. |
| `POST` | `/api/claims` | Patient | Create a claim using multipart form data and a `document` file. |
| `GET` | `/api/claims/my` | Patient | Return only the authenticated patient's claims. |
| `GET` | `/api/claims` | Insurer | Return all claims with optional filters. |
| `GET` | `/api/claims/:id` | Insurer or owning patient | Return complete claim details. |
| `PATCH` | `/api/claims/:id/status` | Insurer | Approve, reject, or update a claim decision. |
| `GET` | `/api/health` | Public | Confirm that the backend service is running. |

### Error handling

The API uses predictable JSON errors:

```json
{
  "success": false,
  "message": "Human readable error"
}
```

It validates malformed IDs, invalid dates, invalid amounts, unsupported files, oversized files, missing documents, invalid credentials, expired tokens, and insufficient roles.

## Project Structure

```text
frontend/
  src/
    components/
    context/
    pages/
    services/
    utils/
    App.jsx
    main.jsx
  vite.config.js
  vercel.json

backend/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    utils/
    app.js
    server.js
    seed.js
```

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

## Screenshots and Demo

Recommended submission screenshots:

1. Login page.![For Login](image.png)
2. Patient dashboard with submitted claims.![Patient Dashboard](image-1.png)
3. Patient claim details and document link.![](image-2.png)
4. Insurer dashboard with filters and summary counts.![Insurer Dashboard](image-3.png)
5. Insurer claim review panel.![Insurar Claim Review](image-4.png)
6. Updated patient claim after insurer approval or rejection.![Updated Claim](image-5.png)

The live deployment and screenshots demonstrate the main assessment flows. Add a short walkthrough video URL here if the submission portal requires one.
