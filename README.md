
# HUNJ - Intelligent Career Acceleration Platform 🚀

**HUNJ** (Hunt Your Job) is an AI-native career command center designed to optimize every stage of the job search lifecycle. Unlike standard resume builders, HUNJ acts as a strategic agent, using advanced LLMs to tailor applications, simulate interviews, analyze market trends, and automate networking strategies.

---

## 📖 Table of Contents
1. [Product Vision](#-product-vision)
2. [AI Architecture & Strategies](#-ai-architecture--strategies)
3. [Core Algorithms & Features](#-core-algorithms--features)
4. [Technical Stack](#-technical-stack)
5. [Project Structure](#-project-structure)
6. [Privacy & Security](#-privacy--security)
7. [Getting Started](#-getting-started)

---

## 🔭 Product Vision

The modern job market is automated; your application process should be too. HUNJ shifts the paradigm from "writing resumes" to "managing a career campaign." It solves the "Blank Page Problem" using generative AI and the "Black Hole Problem" (ATS rejection) using semantic analysis.

**Key Capabilities:**
*   **Hyper-Personalization:** Rewrites resumes for specific Job Descriptions (JDs).
*   **Active Preparation:** Simulates role-specific interviews with voice/text.
*   **Market Intelligence:** Real-time salary and demand analysis.
*   **Discovery:** Finds hidden/niche roles that match specific criteria.

---

## 🧠 AI Architecture & Strategies

HUNJ leverages the **Google Gemini API** (`@google/genai`) with a sophisticated multi-model strategy to balance latency and reasoning depth.

### 1. Dual-Model Strategy
*   **`gemini-3-flash-preview` (The Analyst):**
    *   *Role:* Used for high-speed, low-latency tasks.
    *   *Tasks:* Initial job description parsing, ATS scoring, real-time market trends, skill gap analysis, and UI widget generation.
    *   *Benefit:* Provides near-instant feedback to the user.
*   **`gemini-3-pro-preview` (The Architect):**
    *   *Role:* Used for complex reasoning and creative generation.
    *   *Tasks:* Resume rewriting, cover letter composition, mock interview simulation, and "Deep Dive" probing questions.
    *   *Benefit:* Delivers nuanced, high-quality content that mimics human expert writing.

### 2. Structured Output Enforcement (JSON Schema)
To ensure the AI integrates seamlessly with the React frontend, we strictly enforce `responseSchema` in API calls.
*   **Strategy:** We define TypeScript interfaces (`ResumeData`, `JobAnalysis`) and pass them as schemas to the model.
*   **Benefit:** This prevents "hallucinated" JSON structures and ensures type safety across the application. The AI *must* return data that fits our exact UI components.

### 3. Adversarial Debiasing
We inject a rigorous system prompt (`FAIRNESS_INSTRUCTIONS`) into every context window:
> "Evaluate candidates solely on job-relevant qualifications... Do not favor or penalize based on gender, race, age, name origin... Focus on quantifiable achievements."

This creates a "Fairness Layer" that actively filters out unconscious bias during resume optimization and scoring.

### 4. Grounding (Google Search Tool)
*   **Strategy:** When searching for jobs (`findVisaSponsoringJobs`), we enable the `googleSearch` tool within Gemini.
*   **Benefit:** This allows the LLM to verify that job listings are real and current (within the last 24h-1 week), drastically reducing the hallucination of fake job postings.

---

## ⚙️ Core Algorithms & Features

### 1. The Resume Tailor Engine
**Algorithm:**
1.  **Ingestion:** Parses the user's Master Resume and the target Job Description.
2.  **Gap Analysis:** Identifies missing semantic keywords (e.g., "Kubernetes" vs "Container Orchestration").
3.  **Strategy Selection:** User selects 'Targeted' (Safe) or 'Aggressive' (High Risk/High Reward).
4.  **Transformation:** The AI rewrites bullet points using the STAR method (Situation, Task, Action, Result) to align with the identified gaps.
5.  **Reconstruction:** Returns a fully structured JSON resume object that replaces the current state.

### 2. The "Deep Dive" Prober
This feature solves the problem of users forgetting their own achievements.
**Loop Logic:**
1.  **Context:** Feeds `Resume Summary` + `Job Requirements` to the AI.
2.  **Generation:** AI formulates a specific probing question (e.g., *"You mentioned scaling DBs, but the job needs Sharding experience. Did you implement sharding at Company X?"*).
3.  **User Input:** User answers casually (e.g., *"Yeah, I used MongoDB sharding..."*).
4.  **Transformation:** AI transforms the casual answer into a professional bullet point: *"Implemented MongoDB sharding strategies, reducing query latency by 40%..."*
5.  **Integration:** The new bullet is automatically inserted into the resume JSON.

### 3. Mock Interview Simulator (STAR Evaluation)
**Logic:**
*   **Persona:** The AI adopts the persona of a hiring manager at the specific target company.
*   **Dynamic Context:** It remembers previous questions to avoid repetition.
*   **Evaluation:** Every user answer is scored 0-100 based on:
    *   **Relevance:** Did it answer the specific question?
    *   **Structure:** Did it follow STAR?
    *   **Tone:** Was it professional?

### 4. Semantic Job Search
Unlike keyword matching, this uses an LLM agent to understand *intent*.
*   **Prompt Engineering:** *"Find 4 REAL, RECENT job listings... You MUST extract the actual application URL."*
*   **Filtering:** The AI filters results based on complex criteria like "Visa Sponsorship" or "Company Culture" which traditional filters miss.

---

## 🛠 Technical Stack

### Frontend Core
*   **Framework:** React 19 (Functional Components, Hooks).
*   **Language:** TypeScript (Strict typing for Resume/Job interfaces).
*   **Build Tool:** Vite (ESM-based HMR).
*   **Routing:** Custom state-based view switching for fluid "App-like" feel.

### UI & Styling
*   **Tailwind CSS:** Utility-first styling with a custom "Slate/Royal Blue" design token system.
*   **Lucide React:** Consistent iconography.
*   **Recharts:** Visualization for ATS scores (Radial Charts).

### Data & State
*   **Persistence:** `localStorage` via a custom `storageService`. Data never leaves the browser except to hit the AI API.
*   **State Management:** React `useState` / `useEffect`.
*   **Undo/Redo:** Custom `useHistory` hook implementation for the Resume Editor.

### Utilities
*   **PDF Processing:** `pdf.js` for text extraction.
*   **PDF Generation:** `html2pdf.js` for rendering the DOM to downloadable PDF.
*   **Diffing:** Custom word-level diff algorithm (`simpleDiff.ts`) to visualize changes between resume versions.

---

## 📂 Project Structure

```bash
/
├── index.html              # Entry point
├── src/                    # (Root is src in this setup)
│   ├── App.tsx             # Main Controller & Routing
│   ├── types.ts            # TypeScript Interfaces (Critical for AI Schema)
│   ├── components/         # UI Modules
│   │   ├── ResumeEditor.tsx    # Rich editor with AI hooks
│   │   ├── ResumePreview.tsx   # Live rendering & PDF generation
│   │   ├── JobBoard.tsx        # Search & Filter UI
│   │   ├── AIChatAssistant.tsx # Floating Copilot widget
│   │   ├── DeepDiveProber.tsx  # Interview-to-Bullet generator
│   │   ├── ...
│   ├── services/
│   │   ├── geminiService.ts    # All LLM interactions & Prompts
│   │   ├── storageService.ts   # LocalStorage CRUD
│   │   ├── pdfService.ts       # PDF parsing logic
│   │   └── loggingService.ts   # System logs
│   └── utils/
│       ├── privacy.ts          # PII Anonymization logic
│       └── simpleDiff.ts       # Text diffing algorithm
```

---

## 🔐 Privacy & Security

HUNJ is designed with a **Local-First** architecture.

1.  **Data Storage:** All user data (Resumes, Applications, API Keys) is stored exclusively in the browser's `localStorage`. No remote database is used.
2.  **PII Scrubbing (Privacy Mode):**
    *   Before sending data to the AI, the `anonymizeResume` utility strips Name, Email, Phone, and Links.
    *   The AI operates on anonymized text.
    *   Data is re-hydrated (`restorePII`) client-side before saving.
3.  **API Security:** The Google Gemini API key is used directly from the client (via environment variable) to the Google endpoint, minimizing third-party exposure.

---

## 🚀 Getting Started

1.  **Prerequisites:**
    *   Node.js installed.
    *   A valid Google Gemini API Key.

2.  **Installation:**
    ```bash
    npm install
    ```

3.  **Configuration:**
    Set your API key in your environment (e.g., `.env` or build configuration):
    ```env
    API_KEY=your_google_gemini_key
    ```

4.  **Run Development Server:**
    ```bash
    npm run dev
    ```

5.  **First Run:**
    *   **Login:** Use the Guest Mode for instant access or simulate email login.
    *   **Onboarding:** Complete the wizard to set your Target Role.
    *   **Import:** Upload a PDF resume to populate your Master Profile.

---

## 📜 License

This project is a proprietary intelligent career tool. All rights reserved.
