
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

// --- CAREER DATA ENGINE (Vector-Ready) ---

export interface CareerTag {
    id: string;
    label: string;
    type: 'Skill' | 'Industry' | 'Soft Skill' | 'Impact';
    confidence: number;
}

export interface AchievementUsageStats {
    usedInResumes: number;
    interviewCount: number; // The retention moat
    offerCount: number;
    lastUsed: number;
}

export interface AchievementEntity {
    id: string;
    originalText: string;
    enhancedText: string;
    roleId?: string; 
    company?: string;
    date?: string;
    tags: CareerTag[];
    metrics: string[]; 
    
    // Core Intelligence Signals
    impactScore: number; // 0-100 (Static quality)
    category: 'Technical' | 'Leadership' | 'Operational' | 'Creative';
    
    // Retrieval Metadata
    sourceId: string;
    embedding?: number[]; // Placeholder for vector embedding
    usageStats: AchievementUsageStats;
    
    hidden: boolean;
}

export interface RawDataSource {
    id: string;
    type: 'Resume PDF' | 'LinkedIn Import' | 'GitHub' | 'Voice Memo' | 'Manual Entry';
    name: string;
    content: string;
    dateAdded: number;
    status: 'Processing' | 'Structured' | 'Error';
    entityCount: number;
}

export interface CareerGraph {
    nodes: { id: string; label: string; type: string; value: number }[];
    links: { source: string; target: string; value: number }[];
}

// --- INTELLIGENCE RETRIEVAL ---

export interface JobProfile {
    id?: string;
    title: string;
    company: string;
    // Structured Signals for Retrieval
    requiredSkills: string[];
    optionalSkills: string[];
    industry: string;
    seniorityLevel: string;
    leadershipRequired: boolean;
    keywords: string[];
    summary: string;
    rawText: string;
}

export interface ScoredAchievement extends AchievementEntity {
    relevanceScore: number; // Dynamic score 0-100 against current Job
    matchReason?: string;
}

// --- END DATA ENGINE ---

export interface JobAnalysis extends JobProfile {
  location?: string;
  experienceLevel: string;
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
  impactScore?: number; // 0-100 for auto-sorting
  relevanceScore?: number; // 0-100 context dependent
}

export interface ExperienceItem {
  id: string;
  visible?: boolean;
  role: string;
  company: string;
  period: string;
  location?: string;
  bullets: ExperienceBullet[];
}

export interface ProjectItem {
  id: string;
  visible?: boolean;
  name: string;
  description: string;
  technologies?: string[];
  link?: string;
}

export interface CertificationItem {
  id: string;
  visible?: boolean;
  name: string;
  issuer: string;
  date: string;
  expirationDate?: string;
  credentialId?: string;
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

export interface SkillCategory {
    name: string;
    skills: string[];
}

export type ResumeLayout = 'Executive' | 'Minimalist' | 'Academic' | 'Creative' | 'ATS' | 'International';

export interface ResumeThemeConfig {
  layout: ResumeLayout;
  font: 'Inter' | 'Merriweather' | 'Roboto' | 'JetBrains Mono' | 'Lora' | 'Open Sans' | 'Calibri' | 'Arial' | 'Helvetica' | 'Georgia';
  accentColor: string;
  pageSize: 'A4' | 'Letter';
  density: 'Compact' | 'Standard' | 'Comfortable';
  targetPageCount: 1 | 2 | 3;
}

export interface TemplateRecommendation {
    layout: ResumeThemeConfig['layout'];
    font: ResumeThemeConfig['font'];
    reasoning: string;
}

export interface ResumeData {
  id: string;
  versionName?: string;
  timestamp?: number;
  style: 'Base' | 'Technical' | 'Leadership' | 'Balanced'; 
  design: string; 
  themeConfig: ResumeThemeConfig; 
  sectionOrder: string[]; 
  visibleSections: Record<string, boolean>; 
  
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
  
  skills: string[]; // Flat list for backward compatibility
  skillCategories?: SkillCategory[]; // Structured list
  
  experience: ExperienceItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  publications: PublicationItem[];
  affiliations: AffiliationItem[];
  education: string;
  educationVisible?: boolean;
  languages: string[];
  achievements: string[];
  awards: string[];
  interests: string[];
  strengths: string[];
  personalKnowledgeBase?: string[]; 
  successMetric?: 'None' | 'Interview' | 'Offer'; 
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

export interface BiasAuditResult {
    originalScore: number;
    blindScore: number;
    variance: number;
    isBiased: boolean;
    reasoning: string;
}

export interface BiasAnalysis {
  riskScore: number;
  overallAssessment: string;
  items: BiasItem[];
  audit?: BiasAuditResult;
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
  source: string; 
  sourceUrl?: string; 
  tags: string[];
  // Intelligence Fields
  missingSkills?: string[];
  interviewProbability?: number;
  industryFit?: number;
  seniorityFit?: number;
}

export interface JobSearchFilters {
    query: string;
    location: string;
    remote: 'All' | 'Remote' | 'Hybrid' | 'On-site';
    datePosted: 'Any' | 'Past 24h' | 'Past Week' | 'Past Month';
    level: 'Any' | 'Entry' | 'Mid' | 'Senior' | 'Lead';
    type: 'Any' | 'Full-time' | 'Contract';
}

export interface JobSearchHistory {
    id: string;
    filters: JobSearchFilters;
    timestamp: number;
    resultCount: number;
}

export interface MarketTrends {
    summary: string;
    salaryTrend: 'Up' | 'Down' | 'Stable';
    topSkills: string[];
    demandLevel: 'High' | 'Medium' | 'Low';
    hiringMomentum?: number; // 0-100
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
  confidence: number;
  feedback?: 'helpful' | 'unhelpful';
}

export interface InlineSuggestion {
    original: string;
    suggestion: string;
    confidence: number;
    type: 'Grammar' | 'Clarity' | 'Impact';
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

// Gamification
export interface DailyGoal {
    id: string;
    text: string;
    completed: boolean;
    xp: number;
}

export interface UserProfile {
  masterResume: ResumeData;
  preferences: UserPreferences;
  documents: DocumentItem[];
  applications: Application[];
  privacyMode: boolean;
  onboardingSeen?: boolean;
  profileComplete: boolean;
  
  // Gamification
  xp?: number;
  streak?: number;
  level?: number;
  dailyGoals?: DailyGoal[];
  lastLoginDate?: string;

  // New Career Data Engine
  achievements?: AchievementEntity[];
  dataSources?: RawDataSource[];
  careerGraph?: CareerGraph;
}
