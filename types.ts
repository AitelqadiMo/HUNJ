
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

// --- DETERMINISTIC DESIGN ENGINE TYPES ---
export interface ThemeTokens {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text_main: string;
  text_muted: string;
  divider: string;
}

export interface TypographyTokens {
  heading_family: string;
  body_family: string;
  base_size: string;
  line_height: string;
  heading_weight: string;
  section_spacing: string;
  item_spacing: string;
}

export interface DesignBlueprint {
  layout_id: 'SingleColumn' | 'SidebarLeft' | 'SidebarRight' | 'Grid2x2';
  tokens: ThemeTokens;
  typography: TypographyTokens;
  section_configs: Record<string, {
    visible: boolean;
    variant: 'Standard' | 'Compact' | 'Minimal';
    grid_span?: number;
  }>;
  page_settings: {
    format: 'A4' | 'Letter';
    margins: string;
    scaling: number;
  };
}
// --- END DESIGN ENGINE TYPES ---

export interface JobProfile {
    id?: string;
    title: string;
    company: string;
    requiredSkills: string[];
    optionalSkills: string[];
    industry: string;
    seniorityLevel: string;
    leadershipRequired: boolean;
    keywords: string[];
    summary: string;
    rawText: string;
}

export interface JobAnalysis extends JobProfile {
  location?: string;
  experienceLevel: string;
  hiringProbability: number;
  hiringReasoning: string;
  companyInsights: string;
}

export interface ExperienceBullet {
  id: string;
  text: string;
  visible: boolean;
  impactScore?: number;
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
  link?: string;
}

export interface SkillCategory {
    name: string;
    skills: string[];
}

export type ResumeLayout = 'Executive' | 'Minimalist' | 'Academic' | 'Creative' | 'ATS' | 'International';

export interface ResumeThemeConfig {
  layout: ResumeLayout;
  font: string;
  accentColor: string;
  pageSize: 'A4' | 'Letter';
  density: 'Compact' | 'Standard' | 'Comfortable';
  targetPageCount: 1 | 2 | 3;
}

export interface ResumeData {
  id: string;
  versionName?: string;
  timestamp?: number;
  style: 'Base' | 'Technical' | 'Leadership' | 'Balanced'; 
  design: string; 
  themeConfig: ResumeThemeConfig; 
  designBlueprint?: DesignBlueprint; // Unified state for the rendering engine
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
  
  skills: string[];
  skillCategories?: SkillCategory[];
  
  experience: ExperienceItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  education: string;
  educationVisible?: boolean;
  languages: string[];
  achievements: string[];
  awards: string[];
  interests: string[];
  strengths: string[];
  
  // Custom sections used by application
  publications?: any[];
  affiliations?: any[];
  personalKnowledgeBase?: any[];
}

export interface ATSScore {
  total: number;
  breakdown: {
    keywords: number;
    impact: number;
    quantifiable: number;
    format: number;
    structure: number;
  };
  suggestions: string[];
}

export interface SkillMatch {
  skill: string;
  status: 'match' | 'partial' | 'missing';
  recommendation?: string;
}

export interface BiasItem {
  type: string;
  severity: string;
  text: string;
  suggestion: string;
}

export interface BiasAnalysis {
  riskScore: number;
  overallAssessment: string;
  items: BiasItem[];
  originalScore?: number;
  blindScore?: number;
  variance?: number;
  reasoning?: string;
  isBiased?: boolean;
}

export interface CoverLetter {
  content: string;
  tone: 'Formal' | 'Conversational' | 'Enthusiastic' | 'Technical';
}

export interface InterviewMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  feedback?: {
    rating: number;
    strengths: string[];
    improvements: string[];
  };
}

export interface LinkedInProfile {
  headline: string;
  about: string;
  experienceHooks: string[];
  featuredSkills: string[];
}

export interface SalaryInsight {
  estimatedRange: {
    min: number;
    max: number;
    currency: string;
  };
  marketTrend: 'High Demand' | 'Stable' | 'Low Demand';
  reasoning: string;
  negotiationTips: string[];
  scripts: {
    screening: string;
    counterOffer: string;
  };
}

export interface NetworkingStrategy {
  targetRoles: string[];
  outreachTemplates: {
    type: string;
    subject: string;
    body: string;
  }[];
}

export interface RecommendedJob {
  id: string;
  title: string;
  company: string;
  matchScore: number;
  matchReason: string;
  simulatedDescription: string;
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

export interface AchievementTag {
  label: string;
}

export interface AchievementEntity {
  id: string;
  category: 'Technical' | 'Leadership' | 'Operational' | 'All';
  originalText: string;
  enhancedText?: string;
  metrics: string[];
  tags: AchievementTag[];
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

export interface ProbingQuestion {
  question: string;
  targetSkill: string;
  reasoning: string;
}

export interface GeneratedAchievement {
  improvedBullet: string;
  suggestedSection: string;
  relatedId?: string;
}

export interface ExternalJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  tags: string[];
  matchScore: number;
  salaryRange?: string;
  visaSupport?: boolean;
  postedDate?: string;
  interviewProbability?: number;
  missingSkills?: string[];
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

export interface JobSearchFilters {
  query: string;
  location: string;
  remote: 'Remote' | 'Hybrid' | 'On-site' | 'All';
  datePosted: string;
  level: string;
  type: string;
}

export interface MarketTrends {
  demandLevel: 'High' | 'Medium' | 'Low';
  salaryTrend: 'Up' | 'Stable' | 'Down';
  topSkills: string[];
  hiringMomentum?: number;
}

export interface JobSearchHistory {
  id: string;
  filters: JobSearchFilters;
  timestamp: number;
  resultCount: number;
}

export interface CareerInsights {
  opportunities: {
      title: string;
      desc: string;
      type: 'opportunity' | 'risk' | 'success';
      action: string;
  }[];
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
  skillMatches: SkillMatch[];
  interviewSession?: InterviewMessage[];
  linkedInProfile?: LinkedInProfile | null;
  salaryInsight?: SalaryInsight | null;
  networkingStrategy?: NetworkingStrategy | null;
  biasAnalysis?: BiasAnalysis | null;
}

export interface UserProfile {
  masterResume: ResumeData;
  preferences: UserPreferences;
  documents: DocumentItem[];
  applications: Application[];
  privacyMode: boolean;
  profileComplete: boolean;
  onboardingSeen?: boolean;
  level?: number;
  xp?: number;
  streak?: number;
  dailyGoals?: { id: string; text: string; completed: boolean; xp: number }[];
  achievements?: AchievementEntity[];
  dataSources?: RawDataSource[];
}
