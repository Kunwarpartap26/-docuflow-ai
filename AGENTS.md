# AGENTS.md — AI Workflow Documentation

## Project: DocuFlow AI
**Assignment:** BiztelAI Full Stack Engineering Internship  
**Submission Date:** May 2026

---

## AI Tools Used

### 1. Claude (Anthropic) — Primary Development Agent
**Model:** Claude Sonnet 4.6  
**Role:** Full-stack architect, code generator, and product designer

**How Claude was used:**
- Analyzed the assignment PDF and 5 sample handwritten dataset images
- Designed the complete application architecture (FastAPI + MongoDB + React)
- Generated all backend files: server.py, upload.py, documents.py, dashboard.py, search.py, gemini.py, validation.py, document.py
- Generated all frontend components: Navbar, Preloader, Marquee, WaveDivider, ConfidenceBar, ValidationBadge, StatCard, ScannerBeam, PageTransition
- Generated all 5 pages: Landing, Upload, Review, Dashboard, History
- Engineered the Gemini extraction prompt through iterative analysis of real dataset images
- Designed the complete validation rule system with regex patterns
- Wrote all submission documentation

**Prompting workflow:**
- Started with a master prompt containing full design specs, dataset analysis, and all requirements
- Used structured sections (Design System, API Routes, Validation Rules, Animation specs) for precision
- Iterated by providing existing file context in continuation prompts
- Asked Claude to reference existing component APIs to ensure zero integration mismatches

**Where Claude helped most:**
- Gemini extraction prompt engineering — analyzing handwriting patterns from real images
- Validation rule design — identifying edge cases from the actual dataset (ABC-730 format, missing qty, duplicate work orders)
- Animation specifications — translating design inspiration (Son Daven, Marin Kurir websites) into Framer Motion code
- Cross-file consistency — maintaining design tokens and component APIs across 30+ files

**Where manual work was needed:**
- Environment setup: installing Node.js, Python, creating MongoDB Atlas cluster
- API key configuration: getting Gemini API key from aistudio.google.com
- Deployment: connecting GitHub repo to Vercel and Render
- Demo video recording

---

### 2. Google Gemini 1.5 Flash — AI Extraction Engine
**Role:** Vision-based OCR for handwritten document extraction

**How Gemini was used:**
- Receives uploaded manufacturing document images as base64
- Extracts all 8 structured fields per row from handwritten tables
- Returns confidence scores (0.0–1.0) per field based on readability
- Handles edge cases: crossed-out text, Roman numeral shifts, missing quantity values

**Why Gemini Flash:**
- Free tier: 1,500 requests/day — sufficient for demo and prototype
- Multimodal vision capability handles handwritten text
- Fast response time (~1.5s per image)
- JSON output mode reduces parsing errors

**Extraction prompt engineering:**
- Analyzed all 5 sample images to identify exact field formats
- Built normalization rules into prompt (shift Roman numeral standardization, work order space removal)
- Confidence scoring instructions calibrated to dataset readability patterns

---

## Development Timeline

| Phase | Time | AI Contribution |
|-------|------|----------------|
| Assignment analysis + planning | 30 min | Claude analyzed PDF + 5 images |
| Architecture design | 20 min | Claude designed full stack |
| Backend development | 45 min | Claude generated all 9 backend files |
| Frontend components | 30 min | Claude generated all 16 components |
| Frontend pages | 60 min | Claude generated all 5 pages |
| Documentation | 20 min | Claude wrote README + AGENTS.md |
| Manual setup + deployment | 45 min | Manual: env, deploy, video |
| **Total** | **~4 hours** | |

---

## Key Technical Decisions

1. **Gemini over Tesseract:** Gemini handles cursive handwriting and mixed formats better than traditional OCR
2. **Fallback sample data:** When no API key is configured, gemini.py returns real sample data from the dataset for demo purposes
3. **Background processing:** File extraction runs as a FastAPI BackgroundTask so upload endpoint returns immediately
4. **Confidence scoring:** Three-tier color system (green/amber/red) makes uncertain fields immediately obvious to reviewers
5. **Validation at two levels:** Field-level (regex/range) + cross-row (duplicate work orders, multi-shift employees)

---

## Areas AI Could Not Handle

- Recording the demo video
- Providing actual API credentials
- Testing on a physical manufacturing document outside the dataset
- Making deployment decisions (which free tier to use)
