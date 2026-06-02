# Recapra Production Deployment Guide

This document contains step-by-step instructions to deploy the Recapra platform.

---

## 1. Frontend Deployment on Vercel

The frontend is a React application built with Vite and Tailwind CSS.

### Deployment Steps:
1. Push your project repository to GitHub, GitLab, or Bitbucket.
2. Log in to the [Vercel Dashboard](https://vercel.com).
3. Click **Add New** -> **Project**.
4. Import your GitHub repository.
5. In the configuration settings:
   - **Root Directory**: Select `frontend`.
   - **Build Command**: `npm run build` (or Vite's default build config).
   - **Output Directory**: `dist` (default for Vite).
6. Under **Environment Variables**, add the following settings:
   - `VITE_API_URL`: `https://your-backend-domain.com/api` (The URL of your deployed backend + `/api` prefix).
   - `VITE_ASSET_URL`: `https://your-backend-domain.com` (The base URL of your deployed backend, used to resolve candidate resumes, portfolios, and company proof documents).
7. Click **Deploy**. Vercel will automatically compile the bundle and assign a public URL.

*Note: The frontend includes a `vercel.json` rewrite configuration to handle React Router client-side routes smoothly. direct browser reloads on `/candidate/dashboard` or `/company/jobs` will load correctly.*

---

## 2. Backend Deployment on Render or Railway

The backend is built with FastAPI. It runs on Python 3.12.

### Option A: Render Setup
1. Log in to the [Render Dashboard](https://dashboard.render.com).
2. Click **New** -> **Web Service**.
3. Link your GitHub repository.
4. Set the following details:
   - **Root Directory**: `backend`
   - **Runtime**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. In the **Environment Variables** section, add the variables described in Section 3 below.

### Option B: Railway Setup
1. Log in to the [Railway Dashboard](https://railway.app).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Choose your repository and select the `backend` folder.
4. Set the **Start Command** to:
   `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Go to the **Variables** tab and add the variables described in Section 3 below.

---

## 3. Environment Variables & Supabase PostgreSQL Setup

Configure these environment variables in your backend hosting platform (Render/Railway):

| Environment Variable | Recommended Value / Purpose |
| :--- | :--- |
| `DATABASE_URL` | Your Supabase PostgreSQL Connection String (e.g. `postgresql://postgres:...@...pooler.supabase.com:6543/postgres`). |
| `FRONTEND_URL` | The public URL of your Vercel frontend (e.g. `https://recapra-frontend.vercel.app`). |
| `CORS_ORIGINS` | Comma-separated list of origins (e.g. `https://recapra-frontend.vercel.app,http://localhost:5173`). |
| `SECRET_KEY` | A long, random secure string (for JWT token signing). |
| `ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` (or length of session in minutes). |
| `UPLOAD_DIR` | `uploads` (Local folder path used to temporarily save uploaded PDFs/images). |

### Supabase Connection Tips:
- Use the **Transaction Connection Pool** URI from Supabase (port 6543) or Session URI.
- Make sure to append user credentials correctly in the connection string.
- When the backend starts up, it automatically creates the SQL tables on the target database using `Base.metadata.create_all`. No manual migrations are required to get the app running.

---

## 4. Final Production Verification Checklist

Once both services are deployed, perform the following verification:

1. **Frontend Builds Successfully**: Verify that the Vercel build status is "Ready".
2. **Backend Starts Successfully**: Check the Render/Railway service logs to ensure the FastAPI app is listening on the assigned port.
3. **Authentication Flows**:
   - Register a new candidate account.
   - Register a new company account.
   - Log in using these credentials.
4. **Candidate Dashboard**: Check that candidate profiles, skills, and documents can be successfully viewed and modified.
5. **Company Dashboard**: Check that jobs can be posted and applicants list load.
6. **Admin Dashboard**: Access the admin portal at `/admin/dashboard` to check the organization verification audits queue.
7. **React Router Page Refresh**: Navigate to a nested frontend route (e.g. `/company/profile`) and refresh the page. The routing should resolve to the correct page without producing a Vercel 404 error.
8. **Asset File Links (PDFs/Images)**:
   - Upload a sample candidate resume.
   - Upload a sample company verification document.
   - Ensure the generated links open and download correctly (the frontend resolves these using `ASSET_BASE_URL` mapped to the backend upload directory).
9. **CORS Headers**: Verify that requests from the Vercel domain are not blocked by CORS issues on the FastAPI server.
