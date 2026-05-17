# DocuFlow AI

> AI-powered manufacturing document digitization — extract structured data from handwritten production sheets in seconds.

![DocuFlow AI Screenshot](./docs/screenshot.png)


---

## What is DocuFlow AI?

DocuFlow AI digitizes handwritten manufacturing production logs using Google Gemini's vision AI. Operators photograph or scan daily shift records; the app extracts all fields (date, shift, employee number, operation code, machine, work order, quantity, time), validates them against business rules, and stores them in MongoDB — ready for analytics.

The Review page lets supervisors correct any uncertain extractions before finalizing, while the Dashboard provides real-time operational insights across shifts, machines, and time.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, React Router DOM v6, Tailwind CSS, Framer Motion, Recharts |
| **Backend** | FastAPI, Motor (async MongoDB driver), Python 3.11+ |
| **AI / OCR** | Google Gemini 1.5 Flash (vision multimodal) |
| **Database** | MongoDB Atlas (free M0 cluster) |
| **Deployment** | Vercel (frontend) + Render (backend) |
| **Fonts** | Sora (headings) + Inter (body) |

---

## Features

- **AI Extraction** — Gemini 1.5 Flash extracts all 8 fields per row from handwritten table images with per-field confidence scores
- **Validation Engine** — Two-level validation: field-level regex/range rules + cross-row business rules (duplicate work orders, multi-shift flagging)
- **Human-in-the-Loop Review** — Interactive review page for correcting uncertain fields before saving
- **Real-time Dashboard** — Recharts analytics: uploads by shift, documents over time, machine distribution, quantity summaries
- **Full Document History** — Searchable, filterable document list with expandable row preview and confidence bars
- **Background Processing** — File extraction runs asynchronously via FastAPI BackgroundTasks; upload returns instantly
- **Fallback Demo Mode** — When `GEMINI_API_KEY` is not set, returns realistic sample data so the UI can be demoed without credentials

---

## Local Setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- MongoDB Atlas account (free tier) or local MongoDB
- Google AI Studio account for Gemini API key

### Clone & Run

```bash
# Clone the repository
git clone https://github.com/yourusername/docuflow-ai
cd docuflow-ai
```

#### Backend

```bash
cd backend
pip install -r requirements.txt

# Copy env template and fill in your credentials
cp .env.example .env
# Edit .env: add your MONGO_URL and GEMINI_API_KEY

uvicorn server:app --reload --port 8000
```

The API will be running at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

#### Frontend

Open a new terminal:

```bash
cd frontend
npm install

# Copy env template
cp .env.example .env
# Set: REACT_APP_API_URL=http://localhost:8000/api

npm start
```

The app will open at `http://localhost:3000`.

---

## Deployment

### Frontend → Vercel

1. Push your repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import repo
3. Set **Root Directory** to `frontend`
4. Add environment variable:
   - `REACT_APP_API_URL` = `https://your-backend.onrender.com/api`
5. Deploy

### Backend → Render

1. Go to [render.com](https://render.com) → **New Web Service** → connect repo
2. Set **Root Directory** to `backend`
3. **Build Command:** `pip install -r requirements.txt`
4. **Start Command:** `uvicorn server:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (see table below)
6. Deploy

### Database → MongoDB Atlas

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → create free **M0 cluster**
2. Create a database user (username + password)
3. Under **Network Access** → add IP `0.0.0.0/0` (allow all, for cloud deployments)
4. Copy the connection string into `MONGO_URL`

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URL` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `DB_NAME` | MongoDB database name | `docuflow_ai` |
| `GEMINI_API_KEY` | Google Gemini API key from aistudio.google.com | `AIza...` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000,https://app.vercel.app` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API base URL | `http://localhost:8000/api` |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                             │
│                                                                 │
│  React 18 + React Router v6 + Framer Motion + Recharts         │
│  Pages: Landing → Upload → Review → Dashboard → History        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP (Axios)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND                            │
│                                                                 │
│  POST /api/upload          → saves file, starts background job │
│  GET  /api/documents       → list with pagination              │
│  GET  /api/documents/{id}  → single doc with all rows          │
│  PUT  /api/documents/{id}  → save reviewed edits               │
│  GET  /api/dashboard/stats → aggregate counts                  │
│  GET  /api/dashboard/charts→ shift/machine/time series data    │
│  GET  /api/search          → full-text + filter search         │
└────────────────┬─────────────────────────┬──────────────────────┘
                 │                         │
                 ▼                         ▼
   ┌─────────────────────┐   ┌──────────────────────────┐
   │    MongoDB Atlas     │   │  Google Gemini 1.5 Flash │
   │                     │   │                          │
   │  Collection: docs   │   │  Input: image (base64)   │
   │  - id, filename     │   │  Output: JSON rows with  │
   │  - status, rows[]   │   │  confidence scores       │
   │  - validation_summary│  │                          │
   └─────────────────────┘   └──────────────────────────┘
```

**Upload flow:**
1. User uploads image → `POST /api/upload` returns `{ id }` immediately
2. BackgroundTask calls Gemini with image → extracts rows → validates each field
3. Document status moves: `processing` → `extracted` → `validated` / `flagged`
4. Frontend polls `GET /api/documents/{id}` until status != `processing`

---

## Assumptions & Tradeoffs

| Decision | Rationale |
|----------|-----------|
| **Gemini Flash over Tesseract** | Handles cursive handwriting and mixed print/script; Tesseract fails on non-standard layouts |
| **Background extraction** | Upload feels instant; users can navigate away and return to Review when processing is done |
| **Confidence threshold: 0.80** | Below 0.80 a field is flagged amber; below 0.60 flagged red — calibrated to observed Gemini output on this dataset |
| **No user auth** | Out of scope for internship demo; would add JWT + role-based access in production |
| **M0 Atlas free tier** | 512 MB storage — sufficient for hundreds of document images at ~200 KB each |
| **localStorage preloader flag** | Preloader only runs once per browser session to avoid annoying repeat visitors |
| **React polling vs WebSocket** | Polling every 2s is simpler to implement; WebSocket would be better for high-volume production |
| **Demo fallback data** | Allows evaluators to see the full UI flow without needing a real Gemini API key |

---

## License

MIT — free to use, modify, and distribute with attribution.
