
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
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
  location?: string;
  requiredSkills: string[];
  keywords: string[];
  experienceLevel: string;
  summary: string;
  hiringProbability: number;
  hiringReasoning: string;
  companyInsights: string;
}

export interface ResumeSection {
  id: string;
  title: string;
  content: string;
}

export interface ExperienceBullet {
  id: string;
  text: string;
  visible: boolean;
}

export interface ExperienceItem {
  id: string;
  visible?: boolean;
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
  template: 'Modern' | 'Classic' | 'Minimalist' | 'Tech' | 'Executive' | 'Creative' | 'Academic' | 'Swiss' | 'Serif';
  font: 'Inter' | 'Merriweather' | 'Roboto' | 'JetBrains Mono' | 'Lora';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  spacing: 'compact' | 'normal' | 'comfortable';
}

export interface ResumeData {
  id: string;
  versionName?: string;
  timestamp?: number;
  style: 'Base' | 'Technical' | 'Leadership' | 'Balanced';
  design: string;
  themeConfig: ResumeThemeConfig;
  fullName: string;
  role: string;
  contactInfo: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  summary: string;
  summaryVisible?: boolean;
  skills: string[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  publications: PublicationItem[];
  affiliations: AffiliationItem[];
  education: string;
  educationVisible?: boolean;
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
  riskScore: number;
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
  experienceHooks: string[];
}

export interface SalaryInsight {
    estimatedRange: { min: number; max: number; currency: string };
    marketTrend: 'High Demand' | 'Stable' | 'Low Demand';
    reasoning: string;
    negotiationTips: string[];
    scripts: {
        screening: string;
        counterOffer: string;
    };
}

export interface NetworkingTemplate {
    type: 'Recruiter' | 'Peer Referral' | 'Alumni' | 'Hiring Manager';
    subject: string;
    body: string;
}

export interface NetworkingStrategy {
    targetRoles: string[];
    outreachTemplates: NetworkingTemplate[];
}

export interface RecommendedJob {
    id: string;
    title: string;
    company: string;
    matchScore: number;
    matchReason: string;
    simulatedDescription: string;
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
  source: string; // e.g., "LinkedIn", "Company Site"
  sourceUrl?: string; // The URL where info was found
  tags: string[]; // AI generated tags e.g. "Urgent", "Remote"
}

export interface JobSearchFilters {
    query: string;
    location: string;
    remote: 'All' | 'Remote' | 'Hybrid' | 'On-site';
    datePosted: 'Any' | 'Past 24h' | 'Past Week' | 'Past Month';
    level: 'Any' | 'Entry' | 'Mid' | 'Senior' | 'Lead';
    type: 'Any' | 'Full-time' | 'Contract';
}

export interface MarketTrends {
    summary: string;
    salaryTrend: 'Up' | 'Down' | 'Stable';
    topSkills: string[];
    demandLevel: 'High' | 'Medium' | 'Low';
}

export interface CareerInsights {
    missingSkills: string[];
    marketOutlook: string;
    resumeStrength: number;
    recommendedAction: string;
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
  workAuthorization: string;
  availability: string;
  salaryExpectation: string;
  relocation: boolean;
  remotePreference: 'Remote' | 'Hybrid' | 'On-site';
  targetRoles: string[];
  targetIndustries: string[];
  preferredTechStack: string[];
  companySize: string[];
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
  relatedId?: string;
}

export interface PreviewSuggestion {
  id: string;
  type: 'content' | 'style' | 'grammar';
  label: string;
  aiInstruction: string;
}

export interface Application {
  id: string;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  status: 'Researching' | 'Drafting' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';
  dateCreated: string;
  jobAnalysis: JobAnalysis | null;
  resumes: ResumeData[];
  activeResumeId: string;
  coverLetter: CoverLetter | null;
  atsScore: ATSScore | null;
  biasAnalysis: BiasAnalysis | null;
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
  privacyMode: boolean;
  onboardingSeen?: boolean;
  profileComplete: boolean;
}
