
export type ResumeLayout = 'Executive' | 'Minimalist' | 'Academic' | 'Creative' | 'ATS' | 'International' | 'LaTeX' | 'Modern' | 'Startup' | 'Swiss' | 'Tech';

export interface ResumeThemeConfig {
  layout: ResumeLayout;
  font: 'Inter' | 'Merriweather' | 'Roboto' | 'JetBrains Mono' | 'Lora' | 'Open Sans' | 'Calibri' | 'Arial' | 'Helvetica' | 'Georgia';
  accentColor: string;
  pageSize: 'A4' | 'Letter';
  density: 'Compact' | 'Standard' | 'Comfortable';
  targetPageCount: 1 | 2 | 3;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  period: string;
  visible: boolean;
  location?: string;
  bullets: { id: string; text: string; visible: boolean }[];
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  link: string;
  visible: boolean;
  technologies?: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  link?: string;
  visible: boolean;
}

export interface AffiliationItem {
    id: string;
    organization: string;
    role: string;
    period: string;
    visible: boolean;
}

export interface PublicationItem {
    id: string;
    title: string;
    publisher: string;
    date: string;
    link?: string;
    visible: boolean;
}

export interface SkillCategory {
    name: string;
    skills: string[];
}

export interface ResumeData {
  id: string;
  versionName: string;
  timestamp: number;
  style: string;
  design: string;
  themeConfig: ResumeThemeConfig;
  sectionOrder: string[];
  visibleSections: Record<string, boolean>;
  fullName: string;
  role: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  contactInfo: string;
  summary: string;
  summaryVisible: boolean;
  education: string;
  educationVisible: boolean;
  skills: string[];
  skillCategories?: SkillCategory[];
  languages: string[];
  achievements: string[];
  awards: string[];
  interests: string[];
  strengths: string[];
  personalKnowledgeBase: any[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  publications: PublicationItem[];
  affiliations: AffiliationItem[];
}

export interface JobAnalysis {
  title: string;
  company: string;
  requiredSkills: string[];
  optionalSkills: string[];
  industry: string;
  seniorityLevel: string;
  leadershipRequired: boolean;
  keywords: string[];
  summary: string;
  experienceLevel: string;
  hiringProbability: number;
  hiringReasoning: string;
  companyInsights: string;
  hiddenRequirements: string[];
  cultureIndicators: string[];
  softSkills: string[];
  tools: string[];
  certifications: string[];
  rawText?: string;
  techStackClusters?: any;
  location?: string;
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
  auditReport: {
    strengths: string[];
    weaknesses: string[];
    clarityScore: number;
    impactScore: number;
  };
}

export interface TemplateRecommendation {
  layout: ResumeLayout;
  font: string;
  recommendedColor: string;
  recommendedPageCount: number;
  reasoning: string;
  recommendedTemplate: string;
  recommendedFont: string;
}

export interface ExternalJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  postedDate: string;
  salaryRange?: string;
  visaSupport?: boolean;
  matchScore: number;
  tags: string[];
  interviewProbability?: number;
  missingSkills?: string[];
  easyApply?: boolean;
  employmentType?: string;
}

export interface UserPreferences {
  workAuthorization: string;
  availability: string;
  salaryExpectation: string;
  relocation: boolean;
  remotePreference: string;
  targetRoles: string[];
  targetIndustries: string[];
  preferredTechStack: string[];
  companySize: string[];
}

export interface JobSearchFilters {
  query: string;
  location: string;
  remote: string;
  datePosted: string;
  level: string;
  type: string;
  company?: string;
  easyApply?: 'Any' | 'Yes' | 'No';
  visa?: 'Any' | 'Yes' | 'No';
  minSalary?: number;
  minMatch?: number;
}

export interface MarketTrends {
  summary: string;
  salaryTrend: string;
  topSkills: string[];
  demandLevel: string;
  hiringMomentum?: number;
}

export interface AchievementEntity {
  id: string;
  originalText: string;
  enhancedText?: string;
  category: string;
  metrics: string[];
  tags: { label: string }[];
  hidden?: boolean;
}

export interface RawDataSource {
  id: string;
  type: string;
  name: string;
  content: string;
  dateAdded: number;
  status: 'Processing' | 'Structured' | 'Error';
  entityCount: number;
}

export type SubscriptionTier = 'free' | 'pro' | 'team';

export interface BillingState {
  plan: SubscriptionTier;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  renewsAt?: string;
  customerId?: string;
  subscriptionId?: string;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: string;
}

export interface UsageStats {
  dayKey: string;
  aiActions: number;
  resumesGenerated: number;
  jobSearches: number;
}

export interface UserProfile {
  masterResume: ResumeData;
  applications: Application[];
  privacyMode: boolean;
  preferences: UserPreferences;
  documents: DocumentItem[];
  onboardingSeen: boolean;
  profileComplete: boolean;
  xp: number;
  streak: number;
  level: number;
  dailyGoals: { id: string; text: string; completed: boolean; xp: number }[];
  achievements: AchievementEntity[];
  dataSources: RawDataSource[];
  billing: BillingState;
  usageStats: UsageStats;
}

export interface CareerInsights {
  missingSkills: string[];
  marketOutlook: string;
  resumeStrength: number;
  recommendedAction: string;
  trajectoryAnalysis: {
    isLogical: boolean;
    narrativeCoherence: number;
    nextRolePrediction: string;
  };
  strategy: {
    resumeFocus: string;
    interviewFocus: string;
  };
}

export interface BiasAuditResult {
  originalScore: number;
  blindScore: number;
  variance: number;
  isBiased: boolean;
  reasoning: string;
}

export interface InlineSuggestion {
  original: string;
  suggestion: string;
  confidence: number;
  type: string;
}

export interface PreviewSuggestion {
  id: string;
  text: string;
}

export interface ScoredAchievement {
  id: string;
  score: number;
}

export interface JobProfile {
  title: string;
  description: string;
}

export interface CoverLetter {
  content: string;
  tone: 'Formal' | 'Conversational' | 'Enthusiastic' | 'Technical';
}

export interface LinkedInProfile {
  headline: string;
  about: string;
  featuredSkills: string[];
  experienceHooks: string[];
  brandStrengthScore?: number;
  brandTone?: string;
}

export interface SalaryInsight {
  estimatedRange: { min: number; max: number; currency: string };
  marketTrend: string;
  reasoning: string;
  negotiationTips: string[];
  scripts: { screening: string; counterOffer: string };
  competitivenessIndex?: number;
}

export interface NetworkingStrategy {
  targetRoles: string[];
  outreachTemplates: { type: string; subject: string; body: string }[];
}

export interface ProbingQuestion {
  question: string;
  targetSkill: string;
  reasoning: string;
}

export interface GeneratedAchievement {
  originalAnswer: string;
  improvedBullet: string;
  suggestedSection: string;
  relatedId?: string;
}

export interface SkillMatch {
  skill: string;
  status: 'match' | 'partial' | 'missing';
  recommendation?: string;
  learningPriority?: string;
  suggestedResource?: string;
}

export interface BiasAnalysis {
  riskScore: number;
  overallAssessment: string;
  items: { type: string; severity: string; text: string; suggestion: string }[];
}

export interface RecommendedJob {
  id: string;
  title: string;
  company: string;
  matchScore: number;
  matchReason: string;
  simulatedDescription: string;
}

export interface JobIntelligence {
  // Placeholder type
}

export interface DesignRecommendation {
  // Placeholder type
}

export interface SkillGapAnalysis {
  // Placeholder type
}

export interface Application {
  id: string;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  status: 'Researching' | 'Drafting' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';
  dateCreated: string;
  jobAnalysis: JobAnalysis;
  resumes: ResumeData[];
  activeResumeId: string;
  coverLetter: CoverLetter | null;
  atsScore: ATSScore | null;
  biasAnalysis: BiasAnalysis | null;
  skillMatches: SkillMatch[];
  interviewSession: InterviewMessage[];
  linkedInProfile: LinkedInProfile | null;
  salaryInsight: SalaryInsight | null;
  networkingStrategy: NetworkingStrategy | null;
}

export interface InterviewMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  feedback?: { rating: number; strengths: string[]; improvements: string[]; sampleAnswer: string };
}

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  format: string;
  dateAdded: string;
  size: string;
  tags: string[];
}

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

export interface JobSearchHistory {
  id: string;
  filters: JobSearchFilters;
  timestamp: number;
  resultCount: number;
}
