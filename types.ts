
export interface User {
  id: string;
  email: string;
  name: string;
  lastLogin: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR';
  action: string;
  details?: any;
}

export interface JobAnalysis {
  title: string;
  company: string;
  location?: string; // Added location for salary estimation
  requiredSkills: string[];
  keywords: string[];
  experienceLevel: string;
  summary: string;
  hiringProbability: number;
  hiringReasoning: string;
  companyInsights: string; // Cultural values, recent news (simulated)
}

export interface ResumeSection {
  id: string;
  title: string;
  content: string; // Markdown or plain text
}

export interface ExperienceBullet {
  id: string;
  text: string;
  visible: boolean;
}

export interface ExperienceItem {
  id: string;
  visible?: boolean; // New: Allow hiding items
  role: string;
  company: string;
  period: string;
  bullets: ExperienceBullet[];
}

export interface ProjectItem {
  id: string;
  visible?: boolean;
  name: string;
  description: string;
  link?: string;
}

export interface CertificationItem {
  id: string;
  visible?: boolean;
  name: string;
  issuer: string;
  date: string;
  link?: string;
}

export interface PublicationItem {
  id: string;
  visible?: boolean;
  title: string;
  publisher: string;
  date: string;
  link?: string;
}

export interface AffiliationItem {
  id: string;
  visible?: boolean;
  organization: string;
  role: string;
  period: string;
}

export interface ResumeThemeConfig {
  template: 'Modern' | 'Classic' | 'Minimalist' | 'Tech' | 'Executive';
  font: 'Inter' | 'Merriweather' | 'Roboto' | 'JetBrains Mono' | 'Lora';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  spacing: 'compact' | 'normal' | 'comfortable';
}

export interface ResumeData {
  id: string;
  versionName?: string; // Added for version tracking
  timestamp?: number; // Added for version tracking
  style: 'Base' | 'Technical' | 'Leadership' | 'Balanced';
  design: string; // Kept for legacy, use themeConfig
  themeConfig: ResumeThemeConfig; // New robust theme config
  fullName: string;
  role: string; // Added role title (e.g. DevOps Engineer)
  contactInfo: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  summary: string;
  summaryVisible?: boolean; // Visibility toggle for summary
  skills: string[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[]; // Added
  publications: PublicationItem[]; // Added
  affiliations: AffiliationItem[]; // Added
  education: string;
  educationVisible?: boolean; // Visibility toggle for education
  languages: string[];
  achievements: string[];
  interests: string[];
  strengths: string[];
}

export interface ATSScore {
  total: number;
  breakdown: {
    keywords: number;
    format: number;
    quantifiable: number;
    verbs: number;
    length: number;
    skills: number;
    structure: number;
  };
  suggestions: string[];
}

export interface BiasItem {
  type: 'Gender' | 'Age' | 'Cliché' | 'Cultural';
  text: string;
  explanation: string;
  suggestion: string;
  severity: 'Low' | 'Medium' | 'High';
}

export interface BiasAnalysis {
  riskScore: number; // 0 (Safe) to 100 (High Risk)
  overallAssessment: string;
  items: BiasItem[];
}

export interface SkillMatch {
  skill: string;
  status: 'match' | 'partial' | 'missing';
  recommendation?: string;
}

export interface CoverLetter {
  content: string;
  tone: 'Formal' | 'Conversational' | 'Enthusiastic' | 'Technical';
}

export interface InterviewMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  feedback?: {
    rating: number;
    strengths: string[];
    improvements: string[];
    sampleAnswer: string;
  };
}

export interface LinkedInProfile {
  headline: string;
  about: string;
  featuredSkills: string[];
  experienceHooks: string[]; // Bullet points optimized for LinkedIn
}

export interface SalaryInsight {
    estimatedRange: { min: number; max: number; currency: string };
    marketTrend: 'High Demand' | 'Stable' | 'Low Demand';
    reasoning: string;
    negotiationTips: string[];
    scripts: {
        screening: string; // "What are your salary expectations?" answer
        counterOffer: string; // Counter-offer script
    };
}

export interface NetworkingTemplate {
    type: 'Recruiter' | 'Peer Referral' | 'Alumni' | 'Hiring Manager';
    subject: string;
    body: string;
}

export interface NetworkingStrategy {
    targetRoles: string[]; // e.g. "Senior DevOps Engineer", "Engineering Manager"
    outreachTemplates: NetworkingTemplate[];
}

export interface RecommendedJob {
    id: string;
    title: string;
    company: string;
    matchScore: number;
    matchReason: string;
    simulatedDescription: string; // The full text to use for analysis
}

export interface ExternalJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryRange?: string;
  description: string;
  requirements: string[];
  visaSupport: boolean;
  postedDate: string;
  applyLink: string;
  matchScore: number;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: 'Resume' | 'Cover Letter' | 'Certificate' | 'Transcript' | 'Portfolio';
  format: 'PDF' | 'DOCX' | 'TXT' | 'IMG';
  dateAdded: string;
  size: string;
  tags: string[];
}

export interface UserPreferences {
  workAuthorization: string; // e.g., "US Citizen", "H1B", "EU Citizen"
  availability: string; // e.g., "Immediate", "2 weeks notice"
  salaryExpectation: string; // e.g., "$120k - $150k"
  relocation: boolean;
  remotePreference: 'Remote' | 'Hybrid' | 'On-site';
  targetRoles: string[];
}

export interface ProbingQuestion {
  question: string;
  targetSkill: string;
  reasoning: string;
}

export interface GeneratedAchievement {
  originalAnswer: string;
  improvedBullet: string;
  suggestedSection: 'experience' | 'projects' | 'summary';
  relatedId?: string; // ID of experience/project item to attach to
}

export interface PreviewSuggestion {
  id: string;
  type: 'content' | 'style' | 'grammar';
  label: string;
  aiInstruction: string; // The prompt to send to updateResumeWithAI
}

export interface Application {
  id: string;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  status: 'Researching' | 'Drafting' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';
  dateCreated: string;
  jobAnalysis: JobAnalysis | null;
  resumes: ResumeData[]; // Variations for this specific job
  activeResumeId: string; // The one currently being edited
  coverLetter: CoverLetter | null;
  atsScore: ATSScore | null;
  biasAnalysis: BiasAnalysis | null; // Added Bias Analysis
  skillMatches: SkillMatch[];
  interviewSession?: InterviewMessage[];
  linkedInProfile?: LinkedInProfile | null;
  salaryInsight?: SalaryInsight | null;
  networkingStrategy?: NetworkingStrategy | null;
  previewSuggestions?: PreviewSuggestion[];
}

export interface UserProfile {
  masterResume: ResumeData;
  preferences: UserPreferences;
  documents: DocumentItem[];
  applications: Application[];
  privacyMode: boolean; // Added privacy mode setting
}

export interface GenerationState {
  isAnalyzing: boolean;
  isGeneratingVariants: boolean;
  isImproving: boolean;
  isScoring: boolean;
  isGeneratingCoverLetter: boolean;
  isCheckingBias: boolean;
}
