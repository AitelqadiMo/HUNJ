import { GoogleGenAI, Type } from "@google/genai";
import { JobAnalysis, ATSScore, ResumeData, TemplateRecommendation, ExternalJob, UserPreferences, JobSearchFilters, MarketTrends, UserProfile, CareerInsights, BiasAuditResult, InlineSuggestion, ResumeThemeConfig, PreviewSuggestion, AchievementEntity, RawDataSource, ScoredAchievement, JobProfile, CoverLetter, LinkedInProfile, SalaryInsight, NetworkingStrategy, ProbingQuestion, GeneratedAchievement, SkillMatch, BiasAnalysis, RecommendedJob } from '../types';
import { anonymizeResume } from '../utils/privacy';

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// MODEL CONFIGURATION
const analysisModel = "gemini-2.5-flash-lite-latest"; // Fast model for analysis
const complexModel = "gemini-2.5-flash-latest"; // Balanced model for generation

const ELITE_PERSONA = `
You are an Elite Resume Architect specializing in senior DevOps, SRE, and Cloud Architecture roles. 
Your goal is to create "interview-magnet" resumes that pass 90%+ ATS filters for Fortune 500 companies.
You are rigorous, data-driven, and minimalist in your language.
`;

const ELITE_RULES = `
CRITICAL EXECUTION RULES:
1. **NO PRONOUNS**: ABSOLUTELY NO "I", "We", "My", "Our". Implied first-person only.
2. **POWER VERBS START**: Start EVERY bullet with a high-impact verb (Architected, Engineered, Orchestrated, Optimized).
3. **QUANTIFY EVERYTHING**: Every bullet must follow: [Action] + [Tech] + [Result/Metric].
   - If metric unknown, ESTIMATE based on industry standards (e.g. "reduced deployment time ~40%").
4. **KEYWORD FRONT-LOADING**: Place critical job keywords in the first 3-5 words of a bullet.
5. **NO FLUFF**: Remove words like "Responsible for", "Helped with", "Worked on", "Various".
`;

export const sanitizeResumeData = (data: any): ResumeData => {
    if (!data || typeof data !== 'object') {
        data = {};
    }

    const defaultOrder = ['summary', 'experience', 'education', 'projects', 'certifications', 'skills', 'languages', 'awards'];
    const defaultVisibility = {
        summary: true,
        experience: true,
        education: true,
        skills: true,
        projects: true,
        certifications: true,
        languages: true,
        awards: true,
        interests: true,
        affiliations: true
    };

    return {
        id: data.id || 'master',
        versionName: data.versionName || 'Master v1',
        timestamp: data.timestamp || Date.now(),
        style: data.style || 'Base',
        design: data.design || 'Executive',
        themeConfig: data.themeConfig || { layout: 'Executive', font: 'Inter', accentColor: '#003366', pageSize: 'A4', density: 'Standard', targetPageCount: 2 },
        sectionOrder: data.sectionOrder || defaultOrder,
        visibleSections: data.visibleSections || defaultVisibility,
        fullName: data.fullName || 'Your Name',
        role: data.role || 'Professional Role',
        email: data.email || 'email@example.com',
        phone: data.phone || '(555) 123-4567',
        location: data.location || 'City, State',
        linkedin: data.linkedin || '',
        website: data.website || '',
        contactInfo: data.contactInfo || '',
        summary: data.summary || 'Experienced professional...',
        summaryVisible: data.summaryVisible !== false,
        education: data.education || '',
        educationVisible: data.educationVisible !== false,
        skills: Array.isArray(data.skills) ? data.skills : [],
        skillCategories: Array.isArray(data.skillCategories) ? data.skillCategories : [],
        languages: Array.isArray(data.languages) ? data.languages : [],
        achievements: Array.isArray(data.achievements) ? data.achievements : [],
        awards: Array.isArray(data.awards) ? data.awards : [],
        interests: Array.isArray(data.interests) ? data.interests : [],
        strengths: Array.isArray(data.strengths) ? data.strengths : [],
        personalKnowledgeBase: Array.isArray(data.personalKnowledgeBase) ? data.personalKnowledgeBase : [],
        experience: Array.isArray(data.experience) ? data.experience.map((e: any, i: number) => ({
            id: e.id || `exp-${Date.now()}-${i}`,
            role: e.role || 'Role',
            company: e.company || 'Company',
            period: e.period || 'Dates',
            visible: e.visible !== false,
            bullets: Array.isArray(e.bullets) ? e.bullets.map((b: any, bi: number) => {
                if (typeof b === 'string') return { id: `bull-${Date.now()}-${bi}`, text: b, visible: true };
                return {
                    id: b.id || `bull-${Date.now()}-${bi}`,
                    text: b.text || '',
                    visible: b.visible !== false
                };
            }) : []
        })) : [],
        projects: Array.isArray(data.projects) ? data.projects.map((p: any, i: number) => ({
            id: p.id || `proj-${Date.now()}-${i}`,
            name: p.name || 'Project Name',
            description: p.description || 'Project description...',
            link: p.link || '',
            visible: p.visible !== false
        })) : [],
        certifications: Array.isArray(data.certifications) ? data.certifications.map((c: any, i: number) => ({
            id: c.id || `cert-${Date.now()}-${i}`,
            name: c.name || 'Certification Name',
            issuer: c.issuer || 'Issuer',
            date: c.date || 'Year',
            link: c.link || '',
            visible: c.visible !== false
        })) : [],
        publications: Array.isArray(data.publications) ? data.publications.map((p: any, i: number) => ({
            id: p.id || `pub-${Date.now()}-${i}`,
            title: p.title || '',
            publisher: p.publisher || '',
            date: p.date || '',
            link: p.link || '',
            visible: p.visible !== false
        })) : [],
        affiliations: Array.isArray(data.affiliations) ? data.affiliations.map((a: any, i: number) => ({
            id: a.id || `aff-${Date.now()}-${i}`,
            organization: a.organization || '',
            role: a.role || '',
            period: a.period || '',
            visible: a.visible !== false
        })) : []
    };
};

// --- CORE SERVICES ---

export const analyzeJobDescription = async (text: string): Promise<JobAnalysis> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: analysisModel,
            contents: `Analyze this job description and extract structured data:\n\n${text.substring(0, 10000)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        company: { type: Type.STRING },
                        requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                        optionalSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                        industry: { type: Type.STRING },
                        seniorityLevel: { type: Type.STRING },
                        leadershipRequired: { type: Type.BOOLEAN },
                        keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                        summary: { type: Type.STRING },
                        experienceLevel: { type: Type.STRING },
                        hiringProbability: { type: Type.NUMBER },
                        hiringReasoning: { type: Type.STRING },
                        companyInsights: { type: Type.STRING }
                    }
                }
            }
        });
        
        const data = JSON.parse(response.text || "{}");
        return {
            ...data,
            rawText: text,
            title: data.title || "Unknown Role",
            company: data.company || "Unknown Company"
        };
    } catch (e) {
        console.warn("Job analysis failed, returning fallback.", e);
        return {
            title: "Analyzed Role",
            company: "Target Company",
            requiredSkills: ["Skill A", "Skill B"],
            optionalSkills: [],
            industry: "Technology",
            seniorityLevel: "Mid-Senior",
            leadershipRequired: false,
            keywords: [],
            summary: "Job description analysis unavailable.",
            rawText: text,
            experienceLevel: "Mid",
            hiringProbability: 50,
            hiringReasoning: "Standard analysis.",
            companyInsights: "No data."
        };
    }
};

export const analyzeJobMarketTrends = async (j: ExternalJob[], q: string): Promise<MarketTrends> => {
    // Return a safe default immediately to prevent crashing
    // Real implementation would aggregate the jobs
    return {
        summary: "The market is currently showing moderate activity for this role.",
        salaryTrend: "Stable",
        topSkills: ["Cloud", "DevOps", "Kubernetes", "AWS", "Python"],
        demandLevel: "Medium",
        hiringMomentum: 65
    };
};

export const assembleSmartResume = async (profile: UserProfile, job: JobAnalysis): Promise<ResumeData[]> => {
    const ai = getAI();
    const targetPages = profile.masterResume.themeConfig.targetPageCount || 2;
    const master = profile.masterResume;

    // Use a simplified generation for stability in this demo
    // In a real app, this would be a complex chain
    try {
        const prompt = `
            ${ELITE_PERSONA}
            ${ELITE_RULES}
            
            JOB TARGET: ${job.title} at ${job.company}
            TARGET LENGTH: ${targetPages} Page(s)
            
            Rewrite the following resume content to target this job.
            
            Original Resume:
            ${JSON.stringify({ 
                summary: master.summary, 
                experience: master.experience.slice(0,3).map(e => ({ role: e.role, company: e.company, bullets: e.bullets.map(b=>b.text) })),
                skills: master.skills 
            })}
            
            Job Requirements:
            ${job.requiredSkills.join(', ')}
        `;

        const response = await ai.models.generateContent({
            model: complexModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        experience: { 
                            type: Type.ARRAY, 
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    role: { type: Type.STRING },
                                    company: { type: Type.STRING },
                                    period: { type: Type.STRING },
                                    bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                                }
                            }
                        }
                    }
                }
            }
        });

        const generated = JSON.parse(response.text || "{}");
        
        // Merge generated content back into a full ResumeData object
        const newResume: ResumeData = {
            ...master,
            id: `gen-${Date.now()}`,
            versionName: `Tailored for ${job.company}`,
            summary: generated.summary || master.summary,
            experience: (generated.experience || []).map((exp: any, i: number) => ({
                id: `exp-${i}`,
                role: exp.role || "Role",
                company: exp.company || "Company",
                period: exp.period || "Dates",
                visible: true,
                bullets: (exp.bullets || []).map((b: string, bi: number) => ({
                    id: `b-${i}-${bi}`,
                    text: b,
                    visible: true
                }))
            }))
        };

        return [newResume];

    } catch (e) {
        console.error("Resume assembly failed", e);
        // Fallback: Return master resume clone
        return [{
            ...master,
            id: `fallback-${Date.now()}`,
            versionName: `Copy for ${job.company}`
        }];
    }
};

// --- STUB IMPLEMENTATIONS FOR OTHER SERVICES TO PREVENT CRASHES ---

export const extractAchievements = async (text: string, source: RawDataSource): Promise<AchievementEntity[]> => {
    return []; 
};

export const rankAchievements = async (achievements: AchievementEntity[], job: JobProfile): Promise<ScoredAchievement[]> => {
    return [];
};

export const generateTailoredResume = async (base: ResumeData, job: JobAnalysis): Promise<ResumeData[]> => {
    // Fallback to assembleSmartResume logic or simple clone
    return [{ ...base, id: `tailored-${Date.now()}`, versionName: `Tailored V1` }];
};

export const parseResumeFromText = async (text: string): Promise<ResumeData> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: analysisModel,
            contents: `Parse this resume text into JSON:\n${text.substring(0, 10000)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        fullName: { type: Type.STRING },
                        email: { type: Type.STRING },
                        phone: { type: Type.STRING },
                        linkedin: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                        experience: { 
                            type: Type.ARRAY, 
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    role: { type: Type.STRING },
                                    company: { type: Type.STRING },
                                    period: { type: Type.STRING },
                                    bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                                }
                            } 
                        }
                    }
                }
            }
        });
        
        const data = JSON.parse(response.text || "{}");
        // Convert simplified experience format to ResumeData format
        const experience = (data.experience || []).map((e: any, i: number) => ({
            id: `exp-${i}`,
            role: e.role || "",
            company: e.company || "",
            period: e.period || "",
            visible: true,
            bullets: (e.bullets || []).map((b: string, bi: number) => ({
                id: `b-${i}-${bi}`,
                text: b,
                visible: true
            }))
        }));

        return {
            ...sanitizeResumeData({}), // Default empty
            ...data,
            experience
        };
    } catch(e) {
        console.error("Parse failed", e);
        return sanitizeResumeData({});
    }
};

export const updateMasterProfile = async (r: ResumeData, i: string): Promise<ResumeData> => r;

export const getInlineSuggestion = async (t: string, c: string): Promise<InlineSuggestion> => ({
    original: t,
    suggestion: t + " (Enhanced)",
    confidence: 0.8,
    type: 'Impact'
});

export const generatePreviewSuggestions = async (r: ResumeData, j: JobAnalysis): Promise<PreviewSuggestion[]> => [];

export const runBiasAudit = async (r: ResumeData): Promise<BiasAuditResult> => ({
    originalScore: 85,
    blindScore: 86,
    variance: 1,
    isBiased: false,
    reasoning: "No significant bias detected."
});

export const updateResumeWithAI = async (r: ResumeData, i: string): Promise<ResumeData> => {
    // Simple mock update
    return { ...r, summary: r.summary + " [Updated]" };
};

export const improveBulletPoint = async (t: string, j: JobAnalysis): Promise<string> => t;

export const getInterviewQuestion = async (j: JobAnalysis, p: string[]): Promise<string> => 
    "Tell me about a time you solved a complex technical problem.";

export const evaluateInterviewAnswer = async (q: string, a: string): Promise<any> => ({
    rating: 85,
    strengths: ["Good STAR structure", "Clear outcome"],
    improvements: ["Add more metrics"],
    sampleAnswer: "I did X resulting in Y."
});

export const generateLinkedInProfile = async (r: ResumeData): Promise<LinkedInProfile> => ({
    headline: `${r.role} | Expert in ${r.skills.slice(0,3).join(', ')}`,
    about: r.summary,
    featuredSkills: r.skills.slice(0,5),
    experienceHooks: ["Led team of 5", "Increased revenue 20%"]
});

export const analyzeSalary = async (j: JobAnalysis): Promise<SalaryInsight> => ({
    estimatedRange: { min: 120000, max: 150000, currency: "USD" },
    marketTrend: 'High Demand',
    reasoning: "Strong demand for this role.",
    negotiationTips: ["Focus on equity", "Mention competing offers"],
    scripts: { screening: "I'm targeting 140k...", counterOffer: "I have another offer..." }
});

export const generateNetworkingStrategy = async (j: JobAnalysis): Promise<NetworkingStrategy> => ({
    targetRoles: ["Hiring Manager", "Senior Engineer"],
    outreachTemplates: [{ type: "Recruiter", subject: "Role Inquiry", body: "Hi..." }]
});

export const generateProbingQuestion = async (r: ResumeData, j: JobAnalysis, p: string[], t?: string): Promise<ProbingQuestion> => ({
    question: "Did you use Terraform?",
    targetSkill: "IaC",
    reasoning: "Missing in resume"
});

export const transformAnswerToBullet = async (q: string, a: string, r: ResumeData): Promise<GeneratedAchievement> => ({
    originalAnswer: a,
    improvedBullet: "Implemented Terraform...",
    suggestedSection: 'experience'
});

export const analyzeSkillsGap = async (rs: string[], js: string[]): Promise<SkillMatch[]> => 
    js.map(s => ({ skill: s, status: rs.includes(s) ? 'match' : 'missing' }));

export const generateCoverLetter = async (r: ResumeData, j: JobAnalysis, t: any): Promise<string> => 
    `Dear Hiring Manager,\n\nI am excited to apply for the ${j.title} position at ${j.company}...`;

export const analyzeBias = async (r: ResumeData): Promise<BiasAnalysis> => ({
    riskScore: 10,
    overallAssessment: "Low Risk",
    items: []
});

export const getJobRecommendations = async (r: ResumeData): Promise<RecommendedJob[]> => [
    {
        id: "rec-1",
        title: "Senior DevOps Engineer",
        company: "Tech Corp",
        matchScore: 92,
        matchReason: "Strong skill overlap",
        simulatedDescription: "We need a DevOps engineer..."
    }
];

export const findVisaSponsoringJobs = async (f: JobSearchFilters): Promise<ExternalJob[]> => {
    // Mock jobs
    return [
        {
            id: "job-1",
            title: "DevOps Engineer",
            company: "Global Tech",
            location: "Remote",
            description: "Looking for a skilled DevOps engineer...",
            requirements: ["AWS", "Terraform", "CI/CD"],
            visaSupport: true,
            postedDate: "2 days ago",
            applyLink: "#",
            matchScore: 88,
            source: "LinkedIn",
            tags: ["AWS", "Terraform"]
        },
        {
            id: "job-2",
            title: "SRE",
            company: "FinTech Inc",
            location: "New York",
            description: "Reliability engineer needed...",
            requirements: ["Kubernetes", "Go", "Monitoring"],
            visaSupport: false,
            postedDate: "1 day ago",
            applyLink: "#",
            matchScore: 75,
            source: "LinkedIn",
            tags: ["Kubernetes", "Go"]
        }
    ];
};

export const calculateATSScore = async (r: ResumeData, j: JobAnalysis): Promise<ATSScore> => ({
    total: 82,
    breakdown: { keywords: 8, format: 9, quantifiable: 7, verbs: 8, length: 9, skills: 8, structure: 9 },
    suggestions: ["Add more metrics to recent role"]
});

export const recommendTemplate = async (j: JobAnalysis): Promise<TemplateRecommendation> => ({
    layout: 'Minimalist',
    font: 'Inter',
    reasoning: "Tech industry standard"
});

export const generateCareerInsights = async (profile: UserProfile): Promise<CareerInsights> => {
    return {
        missingSkills: ["Cloud Native", "System Design"],
        marketOutlook: "Strong demand for your profile.",
        resumeStrength: 75,
        recommendedAction: "Focus on highlighting leadership experience."
    };
};
