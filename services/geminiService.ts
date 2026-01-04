import { GoogleGenAI, Type } from "@google/genai";
import { JobAnalysis, ATSScore, ResumeData, SkillMatch, ExperienceItem, CoverLetter, BiasAnalysis, InterviewMessage, LinkedInProfile, SalaryInsight, NetworkingStrategy, RecommendedJob, ProbingQuestion, GeneratedAchievement, PreviewSuggestion, ExternalJob, UserPreferences } from '../types';

// Helper to get AI instance safely
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// MODEL CONFIGURATION
// Use Flash for analysis/parsing to be fast
const analysisModel = "gemini-3-flash-preview"; 
// Use Pro for complex generation and search
const complexModel = "gemini-3-pro-preview"; 

// --- RELIABILITY & FAIRNESS CONSTANTS ---
const FAIRNESS_INSTRUCTIONS = `
CRITICAL BIAS PREVENTION RULES:
1. Evaluate candidates solely on job-relevant qualifications, skills, and experience.
2. Do not favor or penalize based on gender, race, age, name origin, or educational prestige.
3. Focus on quantifiable achievements and technical competencies.
4. Ensure recommendations are accessible and inclusive.
`;

// Helper to transform string bullets to object structure
const normalizeBullets = (bullets: any[]): any[] => {
    if (!Array.isArray(bullets)) return [];
    return bullets.map((b, i) => {
        if (typeof b === 'string') {
            return { id: `gen-bull-${Date.now()}-${i}`, text: b, visible: true };
        }
        return { ...b, visible: b.visible !== false };
    });
};

export const analyzeJobDescription = async (text: string): Promise<JobAnalysis> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: analysisModel,
      contents: `
      ${FAIRNESS_INSTRUCTIONS}
      
      Analyze the following job description. Extract key info, research the company culture based on the text, and estimate a generic hiring difficulty probability based on requirements complexity.
      
      Job Description: ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            company: { type: Type.STRING },
            location: { type: Type.STRING },
            requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            experienceLevel: { type: Type.STRING },
            summary: { type: Type.STRING },
            hiringProbability: { type: Type.NUMBER, description: "Estimate form 0-100 based on how niche/hard the requirements are." },
            hiringReasoning: { type: Type.STRING, description: "Why is the probability this value?" },
            companyInsights: { type: Type.STRING, description: "Inferred company culture and values." }
          },
          required: ["title", "company", "requiredSkills", "keywords", "experienceLevel", "summary", "hiringProbability", "hiringReasoning", "companyInsights"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as JobAnalysis;
    }
    throw new Error("No response text from Gemini");
  } catch (error) {
    console.error("Error analyzing job:", error);
    throw error;
  }
};

export const calculateATSScore = async (resume: ResumeData, job: JobAnalysis): Promise<ATSScore> => {
  try {
    const ai = getAI();
    const prompt = `
      ${FAIRNESS_INSTRUCTIONS}

      Evaluate this resume against the job description for an ATS (Applicant Tracking System).
      
      Job Description:
      Title: ${job.title}
      Keywords: ${job.keywords.join(', ')}
      Skills: ${job.requiredSkills.join(', ')}
      
      Resume:
      Summary: ${resume.summary}
      Skills: ${resume.skills.join(', ')}
      
      Task:
      1. Calculate a match score (0-100).
      2. Provide a breakdown of scoring factors.
      3. Generate specific, actionable suggestions.
      
      Return JSON.
    `;

    const response = await ai.models.generateContent({
      model: analysisModel,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            total: { type: Type.NUMBER },
            breakdown: {
              type: Type.OBJECT,
              properties: {
                keywords: { type: Type.NUMBER },
                format: { type: Type.NUMBER },
                quantifiable: { type: Type.NUMBER },
                verbs: { type: Type.NUMBER },
                length: { type: Type.NUMBER },
                skills: { type: Type.NUMBER },
                structure: { type: Type.NUMBER },
              },
              required: ["keywords", "format", "quantifiable", "verbs", "length", "skills", "structure"],
            },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["total", "breakdown", "suggestions"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as ATSScore;
    }
    throw new Error("No ATS score generated");
  } catch (error) {
    console.error("Error calculating ATS score:", error);
    throw error;
  }
};

export const generateTailoredResume = async (baseResume: ResumeData, job: JobAnalysis): Promise<ResumeData[]> => {
  try {
    const ai = getAI();
    
    // We will generate 2 versions in parallel:
    // 1. "Targeted": Balanced, standard professional optimization.
    // 2. "Aggressive": Highly specialized, focusing heavily on keywords and metrics.

    const generateVariant = async (style: 'Targeted' | 'Aggressive') => {
        const systemPrompt = `
          ${FAIRNESS_INSTRUCTIONS}
          You are an expert Resume Architect. Perform a multi-step optimization on this resume for a ${job.title} role at ${job.company}.
          
          Strategy for this version: ${style === 'Targeted' ? 'Balance specific keywords with general professional strengths.' : 'Aggressively align with job requirements, prioritizing metrics and hard skills.'}
          
          Step 1: Analyze the gap between the resume and job description.
          Step 2: Rewrite the Summary to be a perfect elevator pitch.
          Step 3: Enhance Experience bullets using STAR method (Situation, Task, Action, Result).
          Step 4: Ensure ALL sections (Education, Projects, Certifications) are preserved but polished.
          
          Job Keywords: ${job.keywords.join(', ')}
          
          Input Resume: ${JSON.stringify(baseResume)}
          
          Output: Complete Resume JSON.
        `;

        const response = await ai.models.generateContent({
            model: complexModel, 
            contents: systemPrompt,
            config: {
                maxOutputTokens: 8192,
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    fullName: { type: Type.STRING },
                    role: { type: Type.STRING },
                    email: { type: Type.STRING },
                    phone: { type: Type.STRING },
                    location: { type: Type.STRING },
                    linkedin: { type: Type.STRING },
                    website: { type: Type.STRING },
                    contactInfo: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                    education: { type: Type.STRING },
                    languages: { type: Type.ARRAY, items: { type: Type.STRING } },
                    achievements: { type: Type.ARRAY, items: { type: Type.STRING } },
                    interests: { type: Type.ARRAY, items: { type: Type.STRING } },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    experience: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          role: { type: Type.STRING },
                          company: { type: Type.STRING },
                          period: { type: Type.STRING },
                          bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                         required: ["role", "company", "period", "bullets"]
                      }
                    },
                    projects: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          description: { type: Type.STRING }
                        },
                        required: ["name", "description"]
                      }
                    },
                    certifications: {
                      type: Type.ARRAY,
                      items: {
                          type: Type.OBJECT,
                          properties: {
                              name: { type: Type.STRING },
                              issuer: { type: Type.STRING },
                              date: { type: Type.STRING },
                              link: { type: Type.STRING }
                          },
                          required: ["name", "issuer", "date"]
                      }
                    },
                    publications: {
                      type: Type.ARRAY,
                      items: {
                          type: Type.OBJECT,
                          properties: {
                              title: { type: Type.STRING },
                              publisher: { type: Type.STRING },
                              date: { type: Type.STRING },
                              link: { type: Type.STRING }
                          },
                          required: ["title", "publisher", "date"]
                      }
                    },
                    affiliations: {
                      type: Type.ARRAY,
                      items: {
                          type: Type.OBJECT,
                          properties: {
                              organization: { type: Type.STRING },
                              role: { type: Type.STRING },
                              period: { type: Type.STRING }
                          },
                          required: ["organization", "role", "period"]
                      }
                    }
                  },
                  required: ["fullName", "summary", "skills", "experience", "education", "projects"]
                }
            }
        });

        if (response.text) {
            const v = JSON.parse(response.text) as Partial<ResumeData>;
            return {
                ...baseResume,
                ...v,
                id: `var-${style}-${Date.now()}`,
                versionName: `${style} Optimization`,
                style: style === 'Targeted' ? 'Balanced' : 'Technical',
                themeConfig: {
                    template: style === 'Targeted' ? 'Modern' : 'Tech',
                    font: 'Inter',
                    accentColor: style === 'Targeted' ? '#2563eb' : '#0f172a',
                    fontSize: 'medium',
                    spacing: 'normal'
                },
                summaryVisible: true,
                educationVisible: true,
                experience: (v.experience || []).map((e, i) => ({
                    ...e,
                    id: baseResume.experience?.[i]?.id || `exp-gen-${i}`,
                    visible: true,
                    bullets: normalizeBullets(e.bullets || [])
                })),
                projects: (v.projects || baseResume.projects || []).map((p, i) => ({
                    ...p,
                    id: baseResume.projects?.[i]?.id || `proj-gen-${i}`,
                    visible: true
                })),
                certifications: (v.certifications || baseResume.certifications || []).map((c, i) => ({
                    ...c,
                    id: baseResume.certifications?.[i]?.id || `cert-gen-${i}`,
                    visible: true
                })),
                publications: (v.publications || baseResume.publications || []).map((p, i) => ({
                    ...p,
                    id: baseResume.publications?.[i]?.id || `pub-gen-${i}`,
                    visible: true
                })),
                affiliations: (v.affiliations || baseResume.affiliations || []).map((a, i) => ({
                    ...a,
                    id: baseResume.affiliations?.[i]?.id || `aff-gen-${i}`,
                    visible: true
                }))
            } as ResumeData;
        }
        throw new Error(`Failed to generate ${style} resume`);
    };

    // Run parallel generation
    const results = await Promise.all([
        generateVariant('Targeted'),
        generateVariant('Aggressive')
    ]);

    return results;

  } catch (error) {
    console.error("Error generating resume:", error);
    throw error;
  }
};

export const generatePreviewSuggestions = async (resume: ResumeData, job: JobAnalysis): Promise<PreviewSuggestion[]> => {
    try {
        const ai = getAI();
        const prompt = `
            Review this resume for visual layout and content impact.
            Job Title: ${job.title}
            
            Resume Summary: ${resume.summary}
            
            Generate 3 quick, one-click suggestions to improve the resume.
            These should be actionable instructions that an AI Editor can execute.
            
            Examples:
            - "Shorten summary to 3 lines"
            - "Add 'Leadership' to top skills"
            - "Rephrase experience to be more action-oriented"
            
            Return JSON.
        `;

        const response = await ai.models.generateContent({
            model: analysisModel, // Flash is fine for suggestions
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ['content', 'style', 'grammar'] },
                            label: { type: Type.STRING },
                            aiInstruction: { type: Type.STRING }
                        },
                        required: ["id", "type", "label", "aiInstruction"]
                    }
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as PreviewSuggestion[];
        }
        return [];
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const updateResumeWithAI = async (currentResume: ResumeData, instruction: string): Promise<ResumeData> => {
    try {
        const ai = getAI();
        const prompt = `
            ${FAIRNESS_INSTRUCTIONS}

            You are an expert Resume Editor AI.
            Modify the Resume JSON based on the Instruction.
            
            Instruction: "${instruction}"
            
            Current Resume:
            ${JSON.stringify(currentResume)}
            
            Rules:
            1. Return the COMPLETE updated Resume JSON.
            2. Be concise but professional.
            3. Do not increase the length unnecessarily.
            4. Maintain ID fields.
        `;

        const response = await ai.models.generateContent({
            model: complexModel, 
            contents: prompt,
            config: {
                maxOutputTokens: 8192,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        fullName: { type: Type.STRING },
                        role: { type: Type.STRING },
                        email: { type: Type.STRING },
                        phone: { type: Type.STRING },
                        location: { type: Type.STRING },
                        linkedin: { type: Type.STRING },
                        website: { type: Type.STRING },
                        contactInfo: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                        languages: { type: Type.ARRAY, items: { type: Type.STRING } },
                        achievements: { type: Type.ARRAY, items: { type: Type.STRING } },
                        interests: { type: Type.ARRAY, items: { type: Type.STRING } },
                        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                        education: { type: Type.STRING },
                        style: { type: Type.STRING },
                        design: { type: Type.STRING },
                        experience: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    role: { type: Type.STRING },
                                    company: { type: Type.STRING },
                                    period: { type: Type.STRING },
                                    bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                                },
                                required: ["role", "company", "period", "bullets"]
                            }
                        },
                        projects: {
                            type: Type.ARRAY,
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                name: { type: Type.STRING },
                                description: { type: Type.STRING }
                              },
                              required: ["name", "description"]
                            }
                          },
                          certifications: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    issuer: { type: Type.STRING },
                                    date: { type: Type.STRING },
                                    link: { type: Type.STRING }
                                },
                                required: ["name", "issuer", "date"]
                            }
                          },
                          publications: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    publisher: { type: Type.STRING },
                                    date: { type: Type.STRING },
                                    link: { type: Type.STRING }
                                },
                                required: ["title", "publisher", "date"]
                            }
                          },
                          affiliations: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    organization: { type: Type.STRING },
                                    role: { type: Type.STRING },
                                    period: { type: Type.STRING }
                                },
                                required: ["organization", "role", "period"]
                            }
                          }
                    },
                    required: ["fullName", "summary", "skills", "experience", "education", "projects"]
                }
            }
        });

        if (response.text) {
            const updated = JSON.parse(response.text);
            // Restore IDs if lost
            return {
                ...updated,
                id: currentResume.id,
                summaryVisible: currentResume.summaryVisible !== false,
                educationVisible: currentResume.educationVisible !== false,
                experience: updated.experience.map((e: any, i: number) => ({
                    ...e,
                    id: currentResume.experience[i]?.id || `exp-${Date.now()}-${i}`,
                    visible: currentResume.experience[i]?.visible !== false,
                    bullets: normalizeBullets(e.bullets || [])
                })),
                projects: (updated.projects || []).map((p: any, i: number) => ({
                    ...p,
                    id: currentResume.projects?.[i]?.id || `proj-${Date.now()}-${i}`,
                    visible: currentResume.projects?.[i]?.visible !== false
                })),
                certifications: (updated.certifications || []).map((c: any, i: number) => ({
                    ...c,
                    id: currentResume.certifications?.[i]?.id || `cert-${Date.now()}-${i}`,
                    visible: currentResume.certifications?.[i]?.visible !== false
                })),
                publications: (updated.publications || []).map((p: any, i: number) => ({
                    ...p,
                    id: currentResume.publications?.[i]?.id || `pub-${Date.now()}-${i}`,
                    visible: currentResume.publications?.[i]?.visible !== false
                })),
                affiliations: (updated.affiliations || []).map((a: any, i: number) => ({
                    ...a,
                    id: currentResume.affiliations?.[i]?.id || `aff-${Date.now()}-${i}`,
                    visible: currentResume.affiliations?.[i]?.visible !== false
                }))
            } as ResumeData;
        }
        throw new Error("Failed to update resume");

    } catch (error) {
        console.error("Error updating resume:", error);
        throw error;
    }
}

export const chatWithProfileBuilder = async (
    currentResume: ResumeData, 
    userMessage: string,
    history: any[]
): Promise<{ textResponse: string; dataUpdate?: Partial<ResumeData> }> => {
    try {
        const ai = getAI();
        
        // 1. Generate Conversational Response
        const chatPrompt = `
            You are a helpful and friendly Profile Builder AI. Your goal is to interview the user to build their Master Resume dataset.
            
            Current Context: The user is telling you about their experience/skills.
            
            Task: 
            1. Respond conversationally to the user's input: "${userMessage}".
            2. If they provided new information, acknowledge it ("Great, I've added that project").
            3. If details are missing (e.g. dates, specific tools), kindly ask for them.
            4. Keep it brief and encouraging.
            
            Conversation History:
            ${history.map(h => `${h.role}: ${h.content}`).join('\n')}
        `;

        const chatResponse = await ai.models.generateContent({
            model: complexModel,
            contents: chatPrompt
        });

        const textResponse = chatResponse.text || "I'm listening. Tell me more.";

        // 2. Attempt Data Extraction
        // We check if the user message contains substantial info worth adding.
        const extractionPrompt = `
            Analyze this user message for Resume Data updates.
            User Message: "${userMessage}"
            
            Does this message contain specific information about:
            - A new Work Experience (Company, Role, Description)
            - A new Project
            - A new Skill
            - Education
            - Certification
            
            If YES, extract it into a PARTIAL JSON object matching the ResumeData structure.
            If NO (e.g. just "hello" or "thanks"), return null.
            
            Rules:
            - For Experience/Projects, use the STAR method to format bullets if possible.
            - Do not return the full resume, ONLY the new items to append.
            - Format Experience items with 'role', 'company', 'period', 'bullets' array.
            - Format Project items with 'name', 'description'.
            
            Return JSON or null.
        `;

        const extractionResponse = await ai.models.generateContent({
            model: complexModel,
            contents: extractionPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        hasUpdate: { type: Type.BOOLEAN },
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
                                },
                                required: ["role", "company", "bullets"]
                            }
                        },
                        projects: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    description: { type: Type.STRING }
                                },
                                required: ["name", "description"]
                            }
                        },
                        certifications: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    issuer: { type: Type.STRING },
                                    date: { type: Type.STRING }
                                },
                                required: ["name"]
                            }
                        }
                    },
                    required: ["hasUpdate"]
                }
            }
        });

        let dataUpdate: Partial<ResumeData> | undefined;
        if (extractionResponse.text) {
            const parsed = JSON.parse(extractionResponse.text);
            if (parsed.hasUpdate) {
                // Sanitize and structure
                delete parsed.hasUpdate;
                dataUpdate = parsed;
            }
        }

        return { textResponse, dataUpdate };

    } catch (error) {
        console.error("Profile Builder Error", error);
        return { textResponse: "I'm having trouble connecting to the database. Please try again." };
    }
}

export const improveBulletPoint = async (bullet: string, job: JobAnalysis): Promise<string> => {
    try {
        const ai = getAI();
        const prompt = `
            ${FAIRNESS_INSTRUCTIONS}
            
            Improve this resume bullet point for a ${job.title} role. 
            Make it more impactful, use action verbs, and quantify results if possible (using placeholders like [X%] if numbers aren't known, but try to infer from context).
            Focus on keywords: ${job.keywords.slice(0, 5).join(', ')}.
            
            Original: "${bullet}"
            
            Constraint: Output ONLY the improved bullet text. Do not output markdown.
        `;
        
        const response = await ai.models.generateContent({
            model: analysisModel, // Flash for speed
            contents: prompt,
            config: {
                responseMimeType: "text/plain",
            }
        });

        return response.text?.trim() || bullet;
    } catch (e) {
        console.error("Error improving bullet", e);
        return bullet;
    }
}

export const analyzeSkillsGap = async (resumeSkills: string[], jobSkills: string[]): Promise<SkillMatch[]> => {
    const ai = getAI();
    const prompt = `
        Compare the candidate's skills with the job requirements.
        Candidate Skills: ${resumeSkills.join(', ')}
        Job Requirements: ${jobSkills.join(', ')}

        Identify matches, partial matches, and missing critical skills.
    `;

    const response = await ai.models.generateContent({
        model: analysisModel,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        skill: { type: Type.STRING },
                        status: { type: Type.STRING, enum: ["match", "partial", "missing"] },
                        recommendation: { type: Type.STRING }
                    },
                    required: ["skill", "status"]
                }
            }
        }
    });

    if(response.text) {
        return JSON.parse(response.text) as SkillMatch[];
    }
    return [];
}

export const generateCoverLetter = async (resume: ResumeData, job: JobAnalysis, tone: CoverLetter['tone']): Promise<string> => {
    const ai = getAI();
    const prompt = `
        ${FAIRNESS_INSTRUCTIONS}

        Write a cover letter for a ${job.title} position at ${job.company}.
        
        Tone: ${tone}
        
        Candidate Resume Summary: ${resume.summary}
        Candidate Key Skills: ${resume.skills.slice(0, 5).join(', ')}
        Job Key Requirements: ${job.requiredSkills.slice(0, 3).join(', ')}
        Company Insights: ${job.companyInsights}
        
        Structure:
        1. Hook (Why excited about this specific company/role)
        2. Relevant Experience (Tie resume skills to job needs)
        3. Value Add (What problem will you solve?)
        4. Call to Action
        
        Do not include placeholders like [Your Name], use the name ${resume.fullName}.
        Return only the body of the letter.
    `;

    const response = await ai.models.generateContent({
        model: complexModel, 
        contents: prompt,
        config: {
            responseMimeType: "text/plain",
        }
    });

    return response.text || "Failed to generate cover letter.";
}

export const parseResumeFromText = async (text: string): Promise<ResumeData> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: analysisModel, // Flash for simple parsing
      contents: `Extract structured resume data from the following text.
      
      Resume Text:
      ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING },
            role: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            linkedin: { type: Type.STRING },
            website: { type: Type.STRING },
            location: { type: Type.STRING },
            contactInfo: { type: Type.STRING },
            summary: { type: Type.STRING },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            languages: { type: Type.ARRAY, items: { type: Type.STRING } },
            achievements: { type: Type.ARRAY, items: { type: Type.STRING } },
            interests: { type: Type.ARRAY, items: { type: Type.STRING } },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            education: { type: Type.STRING },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  role: { type: Type.STRING },
                  company: { type: Type.STRING },
                  period: { type: Type.STRING },
                  bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["role", "company", "period", "bullets"]
              }
            },
            projects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["name", "description"]
                }
            },
            certifications: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        issuer: { type: Type.STRING },
                        date: { type: Type.STRING },
                        link: { type: Type.STRING }
                    },
                    required: ["name", "issuer", "date"]
                }
            },
            publications: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        publisher: { type: Type.STRING },
                        date: { type: Type.STRING },
                        link: { type: Type.STRING }
                    },
                    required: ["title", "publisher", "date"]
                }
            },
            affiliations: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        organization: { type: Type.STRING },
                        role: { type: Type.STRING },
                        period: { type: Type.STRING }
                    },
                    required: ["organization", "role", "period"]
                }
            }
          },
          required: ["fullName", "summary", "skills", "experience", "education", "projects"]
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return {
        ...parsed,
        id: 'master',
        style: 'Base',
        design: 'Sidebar',
        summaryVisible: true,
        educationVisible: true, 
        experience: parsed.experience.map((e: any, i: number) => ({ 
            ...e, 
            id: `exp-${Date.now()}-${i}`,
            visible: true,
            bullets: normalizeBullets(e.bullets || []) 
        })),
        projects: (parsed.projects || []).map((p: any, i: number) => ({ ...p, id: `proj-${Date.now()}-${i}`, visible: true })),
        certifications: (parsed.certifications || []).map((c: any, i: number) => ({ ...c, id: `cert-${Date.now()}-${i}`, visible: true })),
        publications: (parsed.publications || []).map((p: any, i: number) => ({ ...p, id: `pub-${Date.now()}-${i}`, visible: true })),
        affiliations: (parsed.affiliations || []).map((a: any, i: number) => ({ ...a, id: `aff-${Date.now()}-${i}`, visible: true }))
      } as ResumeData;
    }
    throw new Error("Failed to parse resume");
  } catch (error) {
    console.error("Error parsing resume:", error);
    throw error;
  }
}

export const generateProbingQuestion = async (resume: ResumeData, job: JobAnalysis, previousQuestions: string[], userTopic?: string): Promise<ProbingQuestion> => {
    const ai = getAI();
    const experienceText = resume.experience.map(e => e.bullets.map(b => b.text).join(' ')).join(' ');
    
      const fullPrompt = `
      You are an expert recruiter looking for "hidden gems" in a candidate's background to match a specific job description.
      Job Description: ${job.title} at ${job.company}
      Key Requirements: ${job.requiredSkills.join(', ')}
      Candidate Resume: Skills: ${resume.skills.join(', ')}, Experience: ${experienceText}
      Task: Identify a gap or a weak point in the resume that matches a key job requirement. 
      Generate a specific probing question to extract a quantifiable achievement or specific technical detail from the candidate.
      ${userTopic ? `IMPORTANT: The user specifically wants to discuss: "${userTopic}". Ask a question related to this topic.` : ''}
      Constraint: Do NOT ask questions already asked: ${previousQuestions.join(' | ')}. Return JSON.
  `;
    const response = await ai.models.generateContent({
        model: complexModel,
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    targetSkill: { type: Type.STRING },
                    reasoning: { type: Type.STRING }
                },
                required: ["question", "targetSkill", "reasoning"]
            }
        }
    });
    if (response.text) return JSON.parse(response.text) as ProbingQuestion;
    throw new Error("Failed");
};

export const transformAnswerToBullet = async (question: string, answer: string, resume: ResumeData): Promise<GeneratedAchievement> => {
    const ai = getAI();
     const prompt = `
      Transform the candidate's answer into a high-impact, professional resume bullet point using the STAR method (Situation, Task, Action, Result).
      Recruiter Question: "${question}"
      Candidate Answer: "${answer}"
      Task:
      1. Create a bullet point that uses action verbs and numbers (if provided in the answer).
      2. Suggest where this bullet belongs in the resume (Experience section, Projects, or Summary).
      3. If it belongs in Experience, try to identify which existing role in the resume (by ID or Company name) it fits best based on context.
      Resume Context (for matching roles):
      ${JSON.stringify(resume.experience.map(e => ({ id: e.id, company: e.company, role: e.role })))}
      Return JSON.
  `;
    const response = await ai.models.generateContent({
        model: complexModel,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    improvedBullet: { type: Type.STRING },
                    suggestedSection: { type: Type.STRING, enum: ['experience', 'projects', 'summary'] },
                    relatedId: { type: Type.STRING, description: "The ID of the experience item this best fits, if applicable." }
                },
                required: ["improvedBullet", "suggestedSection"]
            }
        }
    });
    if (response.text) {
        const result = JSON.parse(response.text);
        return {
            originalAnswer: answer,
            improvedBullet: result.improvedBullet,
            suggestedSection: result.suggestedSection,
            relatedId: result.relatedId
        };
    }
    throw new Error("Failed");
};

export const getInterviewQuestion = async (job: JobAnalysis, previousQuestions: string[]): Promise<string> => {
    const ai = getAI();
    const prompt = `Generate a challenging interview question for a ${job.title} role at ${job.company}. Focus on: ${job.requiredSkills.join(', ')}. Return ONLY the question text.`;
    const response = await ai.models.generateContent({ model: analysisModel, contents: prompt });
    return response.text?.trim() || "Tell me about yourself.";
};

export const evaluateInterviewAnswer = async (question: string, answer: string): Promise<InterviewMessage['feedback']> => {
    const ai = getAI();
    const prompt = `Evaluate this interview answer using the STAR method. Question: "${question}" Candidate Answer: "${answer}" Provide JSON with rating (0-100), strengths, improvements, and a sample answer.`;
    const response = await ai.models.generateContent({
        model: complexModel,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    rating: { type: Type.NUMBER },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
                    sampleAnswer: { type: Type.STRING }
                },
                required: ["rating", "strengths", "improvements", "sampleAnswer"]
            }
        }
    });
    if (response.text) return JSON.parse(response.text);
    throw new Error("Failed");
};

export const generateLinkedInProfile = async (resume: ResumeData): Promise<LinkedInProfile> => {
    const ai = getAI();
    const prompt = `Generate LinkedIn profile JSON (headline, about, featuredSkills, experienceHooks) based on: ${JSON.stringify(resume)}`;
    const response = await ai.models.generateContent({
        model: complexModel,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    headline: { type: Type.STRING },
                    about: { type: Type.STRING },
                    featuredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                    experienceHooks: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["headline", "about", "featuredSkills", "experienceHooks"]
            }
        }
    });
    if (response.text) return JSON.parse(response.text);
    throw new Error("Failed");
};

export const analyzeSalary = async (job: JobAnalysis): Promise<SalaryInsight> => {
    const ai = getAI();
    const prompt = `Estimate salary for ${job.title} at ${job.company} in ${job.location || 'US'}. Return JSON with range, trend, reasoning, scripts.`;
    const response = await ai.models.generateContent({
        model: analysisModel, // Flash for data retrieval
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    estimatedRange: { type: Type.OBJECT, properties: { min: { type: Type.NUMBER }, max: { type: Type.NUMBER }, currency: { type: Type.STRING } }, required: ["min", "max", "currency"] },
                    marketTrend: { type: Type.STRING },
                    reasoning: { type: Type.STRING },
                    negotiationTips: { type: Type.ARRAY, items: { type: Type.STRING } },
                    scripts: { type: Type.OBJECT, properties: { screening: { type: Type.STRING }, counterOffer: { type: Type.STRING } }, required: ["screening", "counterOffer"] }
                },
                required: ["estimatedRange", "marketTrend", "reasoning", "negotiationTips", "scripts"]
            }
        }
    });
    if (response.text) return JSON.parse(response.text);
    throw new Error("Failed");
};

export const generateNetworkingStrategy = async (job: JobAnalysis): Promise<NetworkingStrategy> => {
    const ai = getAI();
    const prompt = `Generate networking strategy JSON for ${job.title} at ${job.company}.`;
    const response = await ai.models.generateContent({
        model: analysisModel,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    targetRoles: { type: Type.ARRAY, items: { type: Type.STRING } },
                    outreachTemplates: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, subject: { type: Type.STRING }, body: { type: Type.STRING } }, required: ["type", "subject", "body"] } }
                },
                required: ["targetRoles", "outreachTemplates"]
            }
        }
    });
    if (response.text) return JSON.parse(response.text);
    throw new Error("Failed");
};

export const analyzeBias = async (resume: ResumeData): Promise<BiasAnalysis> => {
    try {
        const ai = getAI();
        const prompt = `
            ${FAIRNESS_INSTRUCTIONS}
            Analyze the following resume for potential bias (gender, age, cultural, clichés).
            Resume: ${JSON.stringify(resume)}
            
            Identify any phrasing or content that might trigger unconscious bias or ATS filtering based on protected characteristics.
            Provide a risk score and specific items to fix.
        `;

        const response = await ai.models.generateContent({
            model: analysisModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        riskScore: { type: Type.NUMBER },
                        overallAssessment: { type: Type.STRING },
                        items: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING, enum: ['Gender', 'Age', 'Cliché', 'Cultural'] },
                                    text: { type: Type.STRING },
                                    explanation: { type: Type.STRING },
                                    suggestion: { type: Type.STRING },
                                    severity: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] }
                                },
                                required: ["type", "text", "explanation", "suggestion", "severity"]
                            }
                        }
                    },
                    required: ["riskScore", "overallAssessment", "items"]
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as BiasAnalysis;
        }
        throw new Error("Failed to analyze bias");
    } catch (e) {
        console.error(e);
        throw e;
    }
};

export const getJobRecommendations = async (resume: ResumeData): Promise<RecommendedJob[]> => {
    const ai = getAI();
    const prompt = `Suggest 3 simulated job openings based on skills: ${resume.skills.join(',')}. Return JSON array.`;
    const response = await ai.models.generateContent({
        model: complexModel,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        company: { type: Type.STRING },
                        matchScore: { type: Type.NUMBER },
                        matchReason: { type: Type.STRING },
                        simulatedDescription: { type: Type.STRING }
                    },
                    required: ["title", "company", "matchScore", "matchReason", "simulatedDescription"]
                }
            }
        }
    });
    if (response.text) {
        const jobs = JSON.parse(response.text);
        return jobs.map((j: any, i: number) => ({ ...j, id: `rec-${i}` }));
    }
    throw new Error("Failed");
};

export const findVisaSponsoringJobs = async (preferences: UserPreferences, countryCode?: string, searchQuery?: string): Promise<ExternalJob[]> => {
    const ai = getAI();
    
    let scopeText = "Europe";
    
    if (countryCode && countryCode !== 'All') {
        const names: {[key:string]: string} = { 
            'nl': 'Netherlands', 'de': 'Germany', 'fr': 'France', 'hu': 'Hungary', 
            'uk': 'United Kingdom', 'ie': 'Ireland', 'se': 'Sweden', 'ch': 'Switzerland',
            'us': 'USA', 'ca': 'Canada'
        };
        const name = names[countryCode] || countryCode;
        scopeText = name;
    }

    const roleQuery = searchQuery || preferences.targetRoles.join(' or ') || "DevOps Engineer";

    const prompt = `
        You are a specialised job hunter agent.
        Goal: Find 5 REAL, recent job listings for "**${roleQuery}**" in **${scopeText}**.
        
        CRITERIA:
        1. **Visa Sponsorship**: Prioritize roles explicitly mentioning "visa sponsorship", "relocation support", or companies known to sponsor.
        2. **Recency**: Posted within the last 14 days.
        3. **Valid Links**: You MUST try to find the direct application URL.
        
        IMPORTANT RULE FOR 'applyLink':
        - Try to extract the direct URL to the job posting on the company site or LinkedIn.
        - **FAIL-SAFE**: If you cannot find a direct link, or if the link might be dead/expired, strictly return a Google Search Query URL in this format: 
          "https://www.google.com/search?q=Apply+to+${roleQuery}+at+Company+Name"
        - Do NOT hallucinate deep links like "careers.company.com/job/12345" if they don't exist in the search results.
        
        Output a JSON array of the jobs found.
        Map the fields to: title, company, location, salaryRange, description, requirements, visaSupport (boolean), postedDate, applyLink, matchScore (0-100 estimate based on visa support likelihood).
    `;

    const response = await ai.models.generateContent({
        model: complexModel,
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        company: { type: Type.STRING },
                        location: { type: Type.STRING },
                        salaryRange: { type: Type.STRING },
                        description: { type: Type.STRING },
                        requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
                        visaSupport: { type: Type.BOOLEAN },
                        postedDate: { type: Type.STRING },
                        applyLink: { type: Type.STRING },
                        matchScore: { type: Type.NUMBER }
                    },
                    required: ["title", "company", "location", "description", "visaSupport", "applyLink"]
                }
            }
        }
    });

    if (response.text) {
        const jobs = JSON.parse(response.text);
        return jobs.map((j: any, i: number) => ({ ...j, id: `ext-job-${Date.now()}-${i}` }));
    }
    throw new Error("Failed to find jobs");
};