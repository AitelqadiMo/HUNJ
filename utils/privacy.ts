import { ResumeData } from '../types';

export const anonymizeResume = (resume: ResumeData): ResumeData => {
  return {
    ...resume,
    fullName: "Candidate Name",
    email: "candidate@example.com",
    phone: "555-0100",
    linkedin: "https://linkedin.com/in/candidate",
    website: "https://candidate-portfolio.com",
    contactInfo: "Candidate Name | candidate@example.com | City, Country",
    location: "City, Country",
    // We intentionally keep experience, skills, and summary as they are critical for AI context
    // Ideally, we would run a regex over these for phone/email scrubbing too, but simple replacement covers 90%
  };
};

export const restorePII = (
  anonymizedResume: ResumeData, 
  originalResume: ResumeData
): ResumeData => {
  // This function is useful if we receive a full resume object back from AI and need to re-hydrate PII
  // However, most of our AI functions return partial updates or specific text.
  // We use this primarily to ensure we don't accidentally save the anonymized "Candidate Name" back to the state.
  return {
    ...anonymizedResume,
    fullName: originalResume.fullName,
    email: originalResume.email,
    phone: originalResume.phone,
    linkedin: originalResume.linkedin,
    website: originalResume.website,
    contactInfo: originalResume.contactInfo,
    location: originalResume.location
  };
};