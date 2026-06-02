# Recapra Production Deployment Guide

This document contains step-by-step instructions to deploy the Recapra platform.

---

## 1. Frontend Deployment on Vercel

The frontend is a React application built with Vite and Tailwind CSS.

### Deployment Steps

1. Push your repository to GitHub.
2. Log in to the [Vercel Dashboard](https://vercel.com) and click **Add New → Project**.
3. Import your GitHub repository.
4. Configure the project:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:

   | Key | Value |
   |:----|:------|
   | `VITE_API_URL` | `https://your-backend-domain.vercel.app/api` |
   | `VITE_ASSET_URL` | `https://your-backend-domain.vercel.app` |

6. Click **Deploy**.

> The `frontend/vercel.json` rewrite rule ensures React Router deep links (e.g. `/company/dashboard`) survive page refreshes correctly.

---

## 2. Backend Deployment on Vercel

The backend is a FastAPI app. A `backend/vercel.json` file is already included that configures Vercel's Python runtime.

### Deployment Steps

1. In Vercel, click **Add New → Project** again and import the same GitHub repository.
2. Configure the project:
   - **Root Directory**: `backend`
   - **Framework Preset**: Other
3. Under **Environment Variables**, add:

   | Key | Value |
   |:----|:------|
   | `DATABASE_URL` | Your Supabase PostgreSQL URL (see Section 3) |
   | `FRONTEND_URL` | `https://your-frontend-domain.vercel.app` |
   | `CORS_ORIGINS` | `https://your-frontend-domain.vercel.app` |
   | `SECRET_KEY` | A long, random secret string |
   | `ALGORITHM` | `HS256` |
   | `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` |
   | `HF_API_TOKEN` | Your Hugging Face token (optional, for AI reports) |

4. Click **Deploy**.

> **Important — Vercel File Storage Limitation**: Vercel serverless functions have a read-only filesystem. Uploaded files (resumes, portfolios, company docs) are stored temporarily in `/tmp/uploads` during a request but are **not persisted** between invocations. For persistent file storage, connect a cloud object storage service (e.g. AWS S3, Cloudflare R2, or Supabase Storage) and update the file upload logic accordingly. For a demo/MVP deployment, `/tmp` storage is sufficient to test the upload flow.

### Alternative: Deploy Backend on Render or Railway (Recommended for file persistence)

If you need persistent file uploads, deploy the backend on **Render** or **Railway** instead.

#### Render Setup
1. Click **New → Web Service** and link your GitHub repo.
2. Set **Root Directory** to `backend`.
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add the same environment variables listed above.

#### Railway Setup
1. Click **New Project → Deploy from GitHub repo**.
2. Choose your repository and the `backend` subfolder.
3. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add the same environment variables listed above.

---

## 3. Supabase PostgreSQL Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **Settings → Database → Connection string → URI**.
3. Copy the connection string and set it as the `DATABASE_URL` environment variable in your backend deployment.
4. The backend automatically creates all database tables on first startup via `Base.metadata.create_all()` — no manual migrations required.

> Use the **Transaction Pooler** connection string (port `6543`) for best compatibility with serverless deployments.

---

## 4. Final Verification Checklist

After deploying both services, verify:

- [ ] Vercel frontend build status shows **Ready**
- [ ] Backend deployment logs show `Recapra API is running`
- [ ] `https://your-backend.vercel.app/` returns `{"message":"Recapra API is running"}`
- [ ] Login and registration work correctly
- [ ] Candidate dashboard loads
- [ ] Company dashboard loads — job posting works
- [ ] Admin dashboard loads — company verification queue visible
- [ ] React Router deep links survive page refresh on Vercel (no 404)
- [ ] Resume and portfolio file upload and preview work
- [ ] Company verification document upload and preview work
- [ ] Applicant ATS analysis runs correctly
- [ ] No CORS errors in the browser console

---

## 5. Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (in a separate terminal)
cd frontend
npm install
npm run dev
```

Create a `backend/.env` file based on `backend/.env.example` for local settings.
Create a `frontend/.env` file based on `frontend/.env.example` for local settings.
