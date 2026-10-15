# JobScout AI — AI-Powered Job & Internship Finder Using TinyFish

> Built for the **TinyFish × TechnoJam Challenge at Galgotias University**.  
> Aesthetic UI inspired by the quiet luxury, dark atmosphere, and refined typography of [Orchid.ai](https://orchid.ai).

JobScout AI is an end-to-end, live web discovery application engineered to help students and job seekers find currently available, verified internships and entry-level jobs across official company career pages (Greenhouse, Lever, Ashby, Workday) and job portals without fake results or stale aggregations.

---

## 1. Architecture Overview

```
                      +------------------------------------------+
                      |         JobScout AI Frontend             |
                      |   React 19 + Vite 8 + Tailwind CSS v4    |
                      |    Orchid.ai Dark Luxury Aesthetic       |
                      +--------------------+---------------------+
                                           | REST / JSON
                                           v
                      +--------------------+---------------------+
                      |       FastAPI Backend Application        |
                      |          (Python 3.11 - 3.14)            |
                      +--------------------+---------------------+
                                           |
             +-----------------------------+-----------------------------+
             |                             |                             |
             v                             v                             v
+------------------------+    +------------------------+    +------------------------+
|  TinyFish Search API   |    |   TinyFish Fetch API   |    |   TinyFish Agent API   |
|  api.search.tinyfish.ai|    |  api.fetch.tinyfish.ai |    |  api.tinyfish.ai/agent |
|                        |    |                        |    |                        |
| - Targeted queries     |    | - Deep Chromium render |    | - Autonomous browser   |
| - ATS domain filtering |    | - Clean Markdown extraction | - Dynamic SPA modals  |
| - Live SERP discovery  |    | - Link graph / apply URLs | - Single-page apps   |
+------------------------+    +------------------------+    +------------------------+
             |                             |                             |
             +-----------------------------+-----------------------------+
                                           |
                                           v
                      +--------------------+---------------------+
                      |         Data Processing Pipeline         |
                      |                                          |
                      | 1. Structured Extractor                  |
                      | 2. Normalizer (URLs, Titles, Companies)  |
                      | 3. Smart Deduplicator (ATS priority)     |
                      | 4. Multi-Factor Matcher (0-100 pts)      |
                      +--------------------+---------------------+
                                           |
                      +--------------------+---------------------+
                      |     SQLite Local Storage & History       |
                      |  - Saved Jobs Bookmarks (SQLite)         |
                      |  - Search History & Telemetry Audits     |
                      +------------------------------------------+
```

---

## 2. Meaningful Use of TinyFish

JobScout AI integrates TinyFish primitives:

1. **TinyFish Search API (`client.search.query`)**
   - Discovers real-time job postings and official company career portals (`greenhouse.io`, `lever.co`, `ashbyhq.com`, `myworkdayjobs.com`).
   - Uses focused query strategies tailored to roles, locations (e.g. Bengaluru, Noida, Remote), and experience levels (Internship, Fresher, Entry-level).

2. **TinyFish Fetch API (`client.fetch.get_contents`)**
   - Retrieves the live Chromium-rendered page content of the prioritized candidate URLs.
   - Converts cluttered web pages into token-efficient clean Markdown and extracts all candidate application links while stripping ad banners and cookie dialogs.

3. **TinyFish Agent API (`client.agent.run`)**
   - Activated selectively for complex Single Page Applications (SPAs) or dynamically rendered career portals that require JavaScript interaction and modal navigation to access the application link.
   - Cost-conscious: only executed when standard Fetch fails or when explicitly requested by the user.

4. **Workflow Telemetry & Auditability**
   - Every search pipeline step logs its exact tool, execution time, and status. Evaluators can open the **TinyFish Pipeline Audit** drawer in the UI to inspect the exact primitives utilized.

---

## 3. Project Structure

```
jobscout-ai/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI endpoints, CORS, lifespan
│   │   ├── config.py            # Environment settings and key manager
│   │   ├── database.py          # SQLite database connection & models
│   │   ├── models.py            # Pydantic schemas (Search, JobListing, Telemetry)
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── tinyfish_client.py # Official TinyFish SDK integration & error handling
│   │       ├── orchestrator.py  # 12-step research pipeline with telemetry
│   │       ├── extractor.py     # Clean markdown & snippet parser
│   │       ├── normalizer.py    # URL/Company/Location sanitization
│   │       ├── deduplicator.py  # Composite key & ATS-priority deduplication
│   │       └── matcher.py       # Deterministic, explainable 0-100 scoring
│   ├── tests/
│   │   └── test_pipeline.py     # Automated test suite for 3 hackathon scenarios
│   └── requirements.txt         # Backend Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Brand, API key pill, Saved counter
│   │   │   ├── HeroSection.jsx       # Orchid typography, inputs, demo presets
│   │   │   ├── JobCard.jsx           # Cards with match score, apply link, reasons
│   │   │   ├── FilterBar.jsx         # Counter, sorter, official filter
│   │   │   ├── PipelineTelemetry.jsx # Step-by-step TinyFish execution audit
│   │   │   ├── SavedJobsModal.jsx    # SQLite saved jobs manager
│   │   │   ├── HistoryModal.jsx      # Search history list & 1-click re-run
│   │   │   └── ApiKeyModal.jsx       # Dynamic key update & verification
│   │   ├── App.jsx                   # Central React controller
│   │   ├── index.css                 # Tailwind v4 & Orchid glassmorphism styles
│   │   └── main.jsx
│   ├── index.html                    # Typography: Cormorant Garamond, Inter, Mono
│   ├── vite.config.js                # Tailwind v4 plugin + /api proxy
│   └── package.json
├── .env.example                      # Template for TINYFISH_API_KEY
├── .gitignore                        # Standard git ignores (excludes keys/db)
├── package.json                      # Root scripts
└── README.md                         # Complete documentation
```

---

## 4. Setup and Run Instructions

### Prerequisites
- **Python 3.11+** installed
- **Node.js 18+** and **npm** installed
- A **TinyFish API Key** from [agent.tinyfish.ai](https://agent.tinyfish.ai)

---

### Step 1: Clone and Configure Environment

```bash
# Navigate to the project directory
cd jobscout-ai

# Create your .env file
cp .env.example .env
```

Add your TinyFish API key to `.env` or set it in your environment:
```bash
# Linux/macOS
export TINYFISH_API_KEY="sk-tinyfish-your-key-here"

# Windows PowerShell
$env:TINYFISH_API_KEY="sk-tinyfish-your-key-here"
```

*(Note: If you launch without setting this, you can also paste your API key directly inside the JobScout AI web interface via the **Key** icon in the header!)*

---

### Step 2: Install Backend Dependencies & Start Server

In a terminal window:

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

The backend will start at `http://127.0.0.1:8000`.  
Interactive Swagger API documentation is available at `http://127.0.0.1:8000/docs`.

---

### Step 3: Install Frontend Dependencies & Start Client

In a second terminal window:

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at `http://localhost:5173`. Open this URL in your web browser.

---

## 5. API Documentation

| Endpoint | Method | Description |
|---|---|---|
| `/api/status` | `GET` | Verifies TinyFish API key configuration, SDK version, and DB status. |
| `/api/settings/key` | `POST` | Dynamically updates and tests the `TINYFISH_API_KEY` in memory and `.env`. |
| `/api/search` | `POST` | Executes the 12-step live web research workflow; returns ranked listings & telemetry logs. |
| `/api/jobs/saved` | `GET` | Retrieves bookmarked jobs stored in SQLite. |
| `/api/jobs/save` | `POST` | Saves a verified job to SQLite. |
| `/api/jobs/saved/{id}` | `DELETE` | Removes a job from the saved list. |
| `/api/history` | `GET` | Fetches recent search history. |
| `/api/demo/scenarios` | `GET` | Returns pre-configured hackathon test presets. |

---

## 6. Testing

JobScout AI includes an automated test suite verifying normalization, deduplication, SQLite operations, and the 3 required hackathon scenarios:

To run the test suite:

```bash
cd backend
python tests/test_pipeline.py
```

### Verified Test Scenarios

1. **Scenario 1: Python Internships in Bengaluru**
   - Query: Role=`Python Intern`, Location=`Bengaluru`, Experience=`Internship`, Keywords=`Python, FastAPI`
   - Evaluates: Direct role title match, Bengaluru location scoring, internship seniority match, and skill verification.

2. **Scenario 2: Frontend Developer Fresher Jobs in Noida**
   - Query: Role=`Frontend Developer`, Location=`Noida`, Experience=`Fresher`, Keywords=`React, Tailwind CSS`
   - Evaluates: Noida regional match, 0-years experience / fresh graduate match, and React skill weighting.

3. **Scenario 3: Remote AI/ML Internships in India**
   - Query: Role=`Machine Learning Intern`, Location=`Remote`, Experience=`Internship`, Keywords=`AI, PyTorch, Python`
   - Evaluates: Remote work mode preference, research internship level, and AI/PyTorch tech stack extraction.

---

## 7. Hackathon Demo Script (Galgotias University)

Follow this 2-minute pitch and demo during the presentation:

1. **Introduction (15s):**
   > *"Good morning judges! Job seekers and students spend hours filtering through expired listings, ghost jobs, and aggregator clickbait. We built **JobScout AI** powered by **TinyFish** to search the live web, read real company career portals, and deliver verified opportunities with transparent match reasoning."*

2. **Visual Aesthetics (15s):**
   > *"Inspired by Orchid.ai's refined dark luxury aesthetic, our interface balances high-density information with calming typography, subtle lighting, and zero clutter."*

3. **1-Click Live Search Demonstration (45s):**
   > *Click on the **'Python Internships in Bengaluru'** preset in the demo bar.*
   > *"Notice what is happening behind the scenes: JobScout AI isn't pulling from a static database. It just formulated targeted search queries, queried **TinyFish Search**, identified official ATS portals (Greenhouse, Lever), dispatched **TinyFish Fetch** to read the clean DOM markdown, stripped tracking parameters, deduplicated listings, and scored them against our transparent 0-100 rubric."*

4. **Inspect Pipeline Telemetry (30s):**
   > *Click the **'TinyFish Pipeline'** button in the navbar.*
   > *"Here in the TinyFish Pipeline Telemetry, you can see all 12 steps logged in real-time, including exact latency metrics and which TinyFish primitive was invoked."*

5. **Direct Application & Save (15s):**
   > *"Every card features an explainable match breakdown, extracted skills, and an 'Apply Now' button taking the student directly to the verified company application portal. Users can save jobs to their local SQLite bookmarks for offline tracking."*

---

## 8. License

MIT License. Developed for the TinyFish × TechnoJam Challenge at Galgotias University.
