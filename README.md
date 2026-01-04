
# HUNJ - Intelligent Career Acceleration Platform

**HUNJ** (Hunt Your Job) is an AI-native career command center designed to optimize every stage of the job search lifecycle. Unlike standard resume builders, HUNJ acts as a strategic agent, using advanced LLMs to tailor applications, simulate interviews, analyze market trends, and automate networking strategies.

---

## 🚀 Key Features

### 1. Hyper-Personalization Engine
*   **Resume Tailoring**: Analyzes a job description (JD) and rewrites the user's Master Profile to align with semantic keywords and required skills.
*   **ATS Scoring**: Provides a 0-100 match score with a breakdown of missing keywords, formatting issues, and impact metrics.
*   **Cover Letter Architect**: Generates tone-specific (Formal, Conversational, Technical) cover letters based on the resume-job intersection.

### 2. AI-Powered Preparation
*   **Mock Interview Simulator**: An interactive chat interface that simulates a recruiter from the target company. It asks behavioral/technical questions and provides feedback on answers using the STAR method.
*   **Deep Dive Prober**: An investigative agent that interviews *the user* to extract hidden achievements and quantitative results missing from their base resume.

### 3. Market Intelligence
*   **Job Board & Pulse**: Fetches real-time job listings and uses AI to aggregate a "Market Pulse" (Salary trends, demand levels, top skills).
*   **Salary Insights**: Predicts salary ranges and generates negotiation scripts (Screening vs. Counter-offer).
*   **Networking Hub**: Identifies key roles to connect with at a target company and generates specific outreach templates.

### 4. Privacy & Security
*   **Local-First Architecture**: All user data (Resumes, Applications) is stored in the browser's `localStorage`.
*   **PII Scrubbing**: An optional "Privacy Mode" strips Personally Identifiable Information (PII) before sending context to the AI, rehydrating it upon return.

---

## 🛠 Technical Stack

### Frontend Core
*   **Framework**: React 19 (Functional Components, Hooks).
*   **Language**: TypeScript (Strict typing for Resume/Job interfaces).
*   **Styling**: Tailwind CSS (Utility-first, Responsive, Custom "Slate/Royal" Theme).
*   **Build Tool**: Vite (ESM-based HMR).

### Artificial Intelligence
*   **Provider**: Google Gemini API (`@google/genai` SDK).
*   **Models Used**:
    *   `gemini-3-flash-preview`: Used for high-speed tasks (Job search analysis, ATS scoring, UI widgets).
    *   `gemini-3-pro-preview`: Used for complex reasoning (Resume rewriting, Mock interviews, Strategic advice).

### Data & State
*   **Persistence**: Custom `storageService` abstraction layer over `localStorage`.
*   **State Management**: React `useState`, `useEffect`, and custom `useHistory` hook for Undo/Redo capabilities in the editor.

### Libraries & Utilities
*   **PDF Processing**: `pdf.js` for text extraction, `html2pdf.js` for rendering downloadable resumes.
*   **Visualization**: `recharts` for ATS score radial charts.
*   **Icons**: `lucide-react`.

---

## 🧠 AI Strategies & Algorithms

### 1. Structured Output Enforcement (JSON Schema)
Instead of relying on unstructured text, the application heavily utilizes Gemini's `responseSchema` configuration.
*   **Strategy**: We define strict TypeScript interfaces (`ResumeData`, `JobAnalysis`, `ATSScore`) and pass them as schemas to the model.
*   **Benefit**: This ensures the AI returns valid JSON that maps directly to the UI components, preventing hallucinated fields or parsing errors.

### 2. Adversarial Debiasing
*   **Algorithm**: A system prompt injected into analysis calls: *"Do not favor or penalize based on gender, race, age, name origin... Focus on quantifiable achievements."*
*   **Feature**: The **Bias Checker** module specifically scans for gendered wording (e.g., "ninja", "guru") or ageist phrasing and suggests neutral alternatives.

### 3. The "Deep Dive" Probing Algorithm
Used in the `DeepDiveProber` component to solve the "Blank Page Problem."
1.  **Context**: Feeds the current resume summary + Target Job Requirements to the AI.
2.  **Generation**: AI formulates a specific question to uncover a missing skill (e.g., "You listed 'Project Management', but the job requires Agile. Tell me about a time you ran a Sprint.").
3.  **Transformation**: User answers informally. AI transforms the answer into a professional, metric-heavy bullet point (Action Verb + Task + Result).

### 4. PII Scrubbing (Privacy Algorithm)
1.  **Anonymize**: Before an API call, `anonymizeResume()` replaces Name, Email, Phone, and Links with placeholders.
2.  **Process**: The AI processes the content (Summary/Experience) without knowing the user's identity.
3.  **Restore**: `restorePII()` maps the original contact details back onto the generated content before saving to state.

### 5. Semantic Job Search
*   **Logic**: The `findVisaSponsoringJobs` function constructs a complex prompt to Gemini, asking it to act as a search agent.
*   **Verification**: The prompt explicitly requests source URLs (`LinkedIn`, `Greenhouse`) to reduce hallucination of non-existent jobs.

---

## 📂 Project Structure

```bash
/
├── index.html              # Entry point (CDN scripts included)
├── index.tsx               # React Root
├── App.tsx                 # Main Routing & State Controller
├── types.ts                # TypeScript Interfaces (Critical for AI Schema)
├── metadata.json           # Application config
├── components/
│   ├── ResumeEditor.tsx    # Rich text editor with AI hooks
│   ├── ResumePreview.tsx   # Live rendering & PDF generation
│   ├── JobBoard.tsx        # Search & Filter UI
│   ├── AIChatAssistant.tsx # Floating Copilot widget
│   ├── Dashboard.tsx       # Kanban pipeline view
│   ├── ... (Feature specific components)
├── services/
│   ├── geminiService.ts    # All LLM interactions & Prompts
│   ├── storageService.ts   # LocalStorage CRUD operations
│   ├── pdfService.ts       # PDF parsing logic
│   └── loggingService.ts   # System logs
└── utils/
    ├── privacy.ts          # PII Anonymization logic
    └── simpleDiff.ts       # Text diffing algorithm for version comparison
```

## 🚀 Getting Started

1.  **Environment Setup**:
    Ensure you have a valid Google Gemini API Key.
    Set the environment variable: `process.env.API_KEY` (or configure via your build tool).

2.  **Installation**:
    ```bash
    npm install
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

4.  **First Run**:
    *   Login (Guest mode available).
    *   Complete the Onboarding Wizard to set your Target Role.
    *   Import a PDF resume or let AI build one from scratch.

---

## 🛡️ License

This project is proprietary software designed for career acceleration.
