import React, { useState, useEffect } from 'react';
import { ResumeData, JobAnalysis, ExperienceItem, ProjectItem, CertificationItem, PublicationItem, AffiliationItem } from '../types';
import { improveBulletPoint, updateResumeWithAI } from '../services/geminiService';
import { Wand2, Save, RotateCcw, Plus, Trash2, Loader2, Eye, EyeOff } from 'lucide-react';

interface ResumeEditorProps {
  resume: ResumeData;
  job: JobAnalysis | null;
  onUpdate: (updatedResume: ResumeData) => void;
}

const ResumeEditor: React.FC<ResumeEditorProps> = ({ resume, job, onUpdate }) => {
  const [localResume, setLocalResume] = useState<ResumeData>(resume);
  const [improvingId, setImprovingId] = useState<string | null>(null);
  const [improvingSummary, setImprovingSummary] = useState(false);

  // Sync local state when prop changes, BUT ignore changes that originated from local edits
  // to avoid circular resets/jitters if the parent re-renders for other reasons.
  // In a real app we might check deep equality or ID changes.
  useEffect(() => {
    if(resume.id !== localResume.id || resume.versionName !== localResume.versionName) {
        setLocalResume(resume);
    }
  }, [resume]);

  // Debounce updates to parent
  useEffect(() => {
      const handler = setTimeout(() => {
          if (localResume !== resume) {
              onUpdate(localResume);
          }
      }, 800); // 800ms debounce

      return () => {
          clearTimeout(handler);
      };
  }, [localResume]);

  const handleChange = (field: keyof ResumeData, value: any) => {
    const updated = { ...localResume, [field]: value };
    setLocalResume(updated);
  };

  const handleArrayChange = (field: 'skills' | 'languages' | 'achievements' | 'interests' | 'strengths', value: string) => {
    handleChange(field, value.split(',').map(s => s.trim()));
  };

  const handleExperienceChange = (id: string, field: keyof ExperienceItem, value: any) => {
    const updatedExp = localResume.experience.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    );
    handleChange('experience', updatedExp);
  };

  const toggleExperienceVisibility = (id: string) => {
      const updatedExp = localResume.experience.map(exp => 
        exp.id === id ? { ...exp, visible: exp.visible === false ? true : false } : exp
      );
      handleChange('experience', updatedExp);
  };

  const handleProjectChange = (id: string, field: keyof ProjectItem, value: any) => {
      const updatedProjects = (localResume.projects || []).map(proj => 
        proj.id === id ? { ...proj, [field]: value } : proj
      );
      handleChange('projects', updatedProjects);
  };

  const toggleProjectVisibility = (id: string) => {
      const updatedProjects = (localResume.projects || []).map(proj => 
        proj.id === id ? { ...proj, visible: proj.visible === false ? true : false } : proj
      );
      handleChange('projects', updatedProjects);
  };

  const handleAddProject = () => {
      const newProject: ProjectItem = {
          id: `proj-${Date.now()}`,
          name: 'New Project',
          description: 'Description of the project...',
          visible: true
      };
      handleChange('projects', [...(localResume.projects || []), newProject]);
  };

  const handleDeleteProject = (id: string) => {
      handleChange('projects', (localResume.projects || []).filter(p => p.id !== id));
  };

  const handleCertificationChange = (id: string, field: keyof CertificationItem, value: any) => {
      const updatedCerts = (localResume.certifications || []).map(cert => 
        cert.id === id ? { ...cert, [field]: value } : cert
      );
      handleChange('certifications', updatedCerts);
  }

  const toggleCertificationVisibility = (id: string) => {
      const updatedCerts = (localResume.certifications || []).map(cert => 
        cert.id === id ? { ...cert, visible: cert.visible === false ? true : false } : cert
      );
      handleChange('certifications', updatedCerts);
  }

  const handleAddCertification = () => {
      const newCert: CertificationItem = {
          id: `cert-${Date.now()}`,
          name: 'Scholarship / Award Name',
          issuer: 'University / Organization',
          date: '2024',
          visible: true
      };
      handleChange('certifications', [...(localResume.certifications || []), newCert]);
  }

  const handleDeleteCertification = (id: string) => {
      handleChange('certifications', (localResume.certifications || []).filter(c => c.id !== id));
  }

  const handlePublicationChange = (id: string, field: keyof PublicationItem, value: any) => {
      const updatedPubs = (localResume.publications || []).map(pub => 
        pub.id === id ? { ...pub, [field]: value } : pub
      );
      handleChange('publications', updatedPubs);
  }

  const togglePublicationVisibility = (id: string) => {
      const updatedPubs = (localResume.publications || []).map(pub => 
        pub.id === id ? { ...pub, visible: pub.visible === false ? true : false } : pub
      );
      handleChange('publications', updatedPubs);
  }

  const handleAddPublication = () => {
      const newPub: PublicationItem = {
          id: `pub-${Date.now()}`,
          title: 'New Publication',
          publisher: 'Publisher',
          date: '2023',
          visible: true
      };
      handleChange('publications', [...(localResume.publications || []), newPub]);
  }

  const handleDeletePublication = (id: string) => {
      handleChange('publications', (localResume.publications || []).filter(p => p.id !== id));
  }

  const handleAffiliationChange = (id: string, field: keyof AffiliationItem, value: any) => {
      const updatedAffs = (localResume.affiliations || []).map(aff => 
        aff.id === id ? { ...aff, [field]: value } : aff
      );
      handleChange('affiliations', updatedAffs);
  }

  const toggleAffiliationVisibility = (id: string) => {
      const updatedAffs = (localResume.affiliations || []).map(aff => 
        aff.id === id ? { ...aff, visible: aff.visible === false ? true : false } : aff
      );
      handleChange('affiliations', updatedAffs);
  }

  const handleAddAffiliation = () => {
      const newAff: AffiliationItem = {
          id: `aff-${Date.now()}`,
          organization: 'Organization',
          role: 'Member',
          period: '2023 - Present',
          visible: true
      };
      handleChange('affiliations', [...(localResume.affiliations || []), newAff]);
  }

  const handleDeleteAffiliation = (id: string) => {
      handleChange('affiliations', (localResume.affiliations || []).filter(a => a.id !== id));
  }

  const handleBulletChange = (expId: string, bulletId: string, text: string) => {
    const updatedExp = localResume.experience.map(exp => {
      if (exp.id === expId) {
        const newBullets = exp.bullets.map(b => b.id === bulletId ? { ...b, text } : b);
        return { ...exp, bullets: newBullets };
      }
      return exp;
    });
    handleChange('experience', updatedExp);
  };

  const toggleBulletVisibility = (expId: string, bulletId: string) => {
    const updatedExp = localResume.experience.map(exp => {
      if (exp.id === expId) {
        const newBullets = exp.bullets.map(b => b.id === bulletId ? { ...b, visible: !b.visible } : b);
        return { ...exp, bullets: newBullets };
      }
      return exp;
    });
    handleChange('experience', updatedExp);
  };

  const handleImproveBullet = async (expId: string, bulletId: string, currentText: string) => {
    if (!job) return;
    setImprovingId(bulletId);
    try {
      const improved = await improveBulletPoint(currentText, job);
      handleBulletChange(expId, bulletId, improved);
    } finally {
      setImprovingId(null);
    }
  };

  const handleImproveSummary = async () => {
    if (!localResume.summary) return;
    setImprovingSummary(true);
    try {
        const prompt = "Rewrite this professional summary to be more persuasive, impactful, and metric-driven. Use strong action verbs and highlight key achievements.";
        const updated = await updateResumeWithAI(localResume, prompt);
        handleChange('summary', updated.summary);
    } catch (e) {
        console.error(e);
    } finally {
        setImprovingSummary(false);
    }
  };

  return (
    <div className="bg-devops-800 rounded-xl border border-devops-700 shadow-xl overflow-hidden flex flex-col h-full">
      <div className="bg-devops-900/50 p-4 border-b border-devops-700 flex justify-between items-center sticky top-0 z-10">
        <div>
           <h2 className="text-lg font-semibold text-white">Resume Editor</h2>
           <span className={`text-xs px-2 py-0.5 rounded-full border ${
             localResume.style === 'Technical' ? 'border-blue-500/30 bg-blue-500/10 text-blue-400' :
             localResume.style === 'Leadership' ? 'border-purple-500/30 bg-purple-500/10 text-purple-400' :
             'border-green-500/30 bg-green-500/10 text-green-400'
           }`}>
             {localResume.style} Style
           </span>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => {
                    setLocalResume(resume); // Hard reset to props
                }}
                className="p-2 hover:bg-devops-700 rounded-lg text-devops-400 transition-colors" 
                title="Discard Changes"
            >
                <RotateCcw className="w-4 h-4" />
            </button>
            <button 
                onClick={() => onUpdate(localResume)}
                className="flex items-center gap-2 px-4 py-1.5 bg-success text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
            >
                <Save className="w-4 h-4" /> Save
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Personal Details */}
        <div className="space-y-4">
             <h3 className="text-md font-medium text-white border-b border-devops-700 pb-2">Personal Information</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-devops-300">Full Name</label>
                    <input 
                        className="w-full bg-devops-900 border border-devops-700 rounded-lg p-3 text-sm text-devops-100 focus:ring-2 focus:ring-accent-500 outline-none"
                        value={localResume.fullName}
                        onChange={(e) => handleChange('fullName', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-devops-300">Role Title</label>
                    <input 
                        className="w-full bg-devops-900 border border-devops-700 rounded-lg p-3 text-sm text-devops-100 focus:ring-2 focus:ring-accent-500 outline-none"
                        value={localResume.role}
                        onChange={(e) => handleChange('role', e.target.value)}
                        placeholder="e.g. Cloud DevOps Engineer"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-devops-300">Email</label>
                    <input 
                        className="w-full bg-devops-900 border border-devops-700 rounded-lg p-3 text-sm text-devops-100 focus:ring-2 focus:ring-accent-500 outline-none"
                        value={localResume.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-devops-300">Phone</label>
                    <input 
                        className="w-full bg-devops-900 border border-devops-700 rounded-lg p-3 text-sm text-devops-100 focus:ring-2 focus:ring-accent-500 outline-none"
                        value={localResume.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-devops-300">Location</label>
                    <input 
                        className="w-full bg-devops-900 border border-devops-700 rounded-lg p-3 text-sm text-devops-100 focus:ring-2 focus:ring-accent-500 outline-none"
                        value={localResume.location}
                        onChange={(e) => handleChange('location', e.target.value)}
                    />
                </div>
                 <div className="space-y-2">
                    <label className="block text-sm font-medium text-devops-300">LinkedIn URL</label>
                    <input 
                        className="w-full bg-devops-900 border border-devops-700 rounded-lg p-3 text-sm text-devops-100 focus:ring-2 focus:ring-accent-500 outline-none"
                        value={localResume.linkedin}
                        onChange={(e) => handleChange('linkedin', e.target.value)}
                        placeholder="https://linkedin.com/in/..."
                    />
                </div>
            </div>
        </div>

        {/* Header Section */}
        <div className={`space-y-4 relative group transition-opacity ${localResume.summaryVisible === false ? 'opacity-60' : ''}`}>
          <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleChange('summaryVisible', !localResume.summaryVisible)}
                    className={`p-1 rounded ${localResume.summaryVisible === false ? 'text-devops-500' : 'text-accent-400'}`}
                    title={localResume.summaryVisible === false ? "Show Section" : "Hide Section"}
                  >
                      {localResume.summaryVisible === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <label className="block text-sm font-medium text-devops-300">Professional Summary</label>
              </div>
              <button 
                  onClick={handleImproveSummary}
                  disabled={improvingSummary}
                  className="flex items-center gap-1 text-xs text-accent-400 hover:text-white transition-colors bg-accent-600/10 px-2 py-1 rounded hover:bg-accent-600/50"
                  title="Enhance with AI"
              >
                  {improvingSummary ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  Magic Rewrite
              </button>
          </div>
          <textarea 
            className="w-full h-32 bg-devops-900 border border-devops-700 rounded-lg p-3 text-sm text-devops-100 focus:ring-2 focus:ring-accent-500 outline-none"
            value={localResume.summary}
            onChange={(e) => handleChange('summary', e.target.value)}
          />
        </div>

        {/* Experience Section */}
        <div className="space-y-6">
          <h3 className="text-md font-medium text-white border-b border-devops-700 pb-2">Experience</h3>
          {localResume.experience.map((exp) => (
            <div key={exp.id} className={`bg-devops-900/30 p-4 rounded-lg border transition-all ${exp.visible === false ? 'border-devops-800 opacity-50' : 'border-devops-700/50'}`}>
              <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleExperienceVisibility(exp.id)}
                        className={`p-1 rounded ${exp.visible === false ? 'text-devops-600' : 'text-accent-400'}`}
                        title={exp.visible === false ? "Show in resume" : "Hide from resume"}
                      >
                          {exp.visible === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <span className="text-xs text-devops-500 font-mono">{exp.visible === false ? 'Hidden' : 'Visible'}</span>
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-3">
                 <input 
                    className="bg-transparent border-b border-devops-700 text-white font-medium focus:border-accent-500 outline-none pb-1"
                    value={exp.role}
                    onChange={(e) => handleExperienceChange(exp.id, 'role', e.target.value)}
                 />
                 <input 
                    className="bg-transparent border-b border-devops-700 text-devops-300 text-right focus:border-accent-500 outline-none pb-1"
                    value={exp.company}
                    onChange={(e) => handleExperienceChange(exp.id, 'company', e.target.value)}
                 />
              </div>
              
              <div className="space-y-3 mt-4">
                {exp.bullets.map((bullet) => (
                  <div key={bullet.id} className={`flex gap-2 group relative transition-opacity ${bullet.visible === false ? 'opacity-50' : ''}`}>
                    <button 
                        onClick={() => toggleBulletVisibility(exp.id, bullet.id)}
                        className={`mt-2 p-0.5 rounded h-fit hover:bg-devops-800 ${bullet.visible === false ? 'text-devops-600' : 'text-devops-400'}`}
                        title={bullet.visible === false ? "Show bullet" : "Hide bullet"}
                    >
                        {bullet.visible === false ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                    <span className="text-devops-500 mt-2">•</span>
                    <div className="flex-1 relative">
                        <textarea 
                            className="w-full bg-transparent text-sm text-devops-200 resize-none overflow-hidden focus:bg-devops-900/50 rounded p-1 outline-none focus:ring-1 focus:ring-devops-600"
                            rows={Math.max(2, Math.ceil(bullet.text.length / 80))}
                            value={bullet.text}
                            onChange={(e) => handleBulletChange(exp.id, bullet.id, e.target.value)}
                        />
                         {job && (
                            <button 
                                onClick={() => handleImproveBullet(exp.id, bullet.id, bullet.text)}
                                disabled={improvingId === bullet.id}
                                className={`absolute right-2 top-2 p-1.5 bg-devops-800 rounded-md border border-devops-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent-600 hover:text-white ${improvingId === bullet.id ? 'opacity-100' : ''}`}
                                title="Improve with AI"
                            >
                                <Wand2 className={`w-3 h-3 ${improvingId === bullet.id ? 'animate-spin' : ''}`} />
                            </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Projects Section */}
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-devops-700 pb-2">
                <h3 className="text-md font-medium text-white">Selected Projects</h3>
                <button 
                    onClick={handleAddProject}
                    className="flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300"
                >
                    <Plus className="w-3 h-3" /> Add
                </button>
            </div>
            
            {(localResume.projects || []).map((proj) => (
                <div key={proj.id} className={`bg-devops-900/30 p-4 rounded-lg border transition-all relative group ${proj.visible === false ? 'border-devops-800 opacity-50' : 'border-devops-700/50'}`}>
                    <div className="absolute top-2 right-2 flex gap-2">
                        <button 
                            onClick={() => toggleProjectVisibility(proj.id)}
                            className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${proj.visible === false ? 'text-devops-600' : 'text-devops-400 hover:text-white'}`}
                        >
                            {proj.visible === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button 
                            onClick={() => handleDeleteProject(proj.id)}
                            className="text-devops-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-3">
                         <div className="space-y-1">
                            <label className="text-xs text-devops-400">Project Name</label>
                            <input 
                                className="w-full bg-transparent border-b border-devops-700 text-white font-medium focus:border-accent-500 outline-none pb-1"
                                value={proj.name}
                                onChange={(e) => handleProjectChange(proj.id, 'name', e.target.value)}
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-xs text-devops-400">Description</label>
                            <textarea 
                                className="w-full bg-transparent text-sm text-devops-200 resize-none focus:bg-devops-900/50 rounded p-1 outline-none focus:ring-1 focus:ring-devops-600"
                                rows={3}
                                value={proj.description}
                                onChange={(e) => handleProjectChange(proj.id, 'description', e.target.value)}
                            />
                         </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Certifications Section */}
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-devops-700 pb-2">
                <h3 className="text-md font-medium text-white">Awards & Scholarships</h3>
                <button 
                    onClick={handleAddCertification}
                    className="flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300"
                >
                    <Plus className="w-3 h-3" /> Add
                </button>
            </div>
            
            {(localResume.certifications || []).map((cert) => (
                <div key={cert.id} className={`bg-devops-900/30 p-4 rounded-lg border transition-all relative group ${cert.visible === false ? 'border-devops-800 opacity-50' : 'border-devops-700/50'}`}>
                     <div className="absolute top-2 right-2 flex gap-2">
                        <button 
                            onClick={() => toggleCertificationVisibility(cert.id)}
                            className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${cert.visible === false ? 'text-devops-600' : 'text-devops-400 hover:text-white'}`}
                        >
                            {cert.visible === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button 
                            onClick={() => handleDeleteCertification(cert.id)}
                            className="text-devops-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="text-xs text-devops-400">Award/Scholarship Name</label>
                            <input 
                                className="w-full bg-transparent border-b border-devops-700 text-white font-medium focus:border-accent-500 outline-none pb-1"
                                value={cert.name}
                                onChange={(e) => handleCertificationChange(cert.id, 'name', e.target.value)}
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-xs text-devops-400">Issuer / Organization</label>
                            <input 
                                className="w-full bg-transparent border-b border-devops-700 text-devops-200 focus:border-accent-500 outline-none pb-1"
                                value={cert.issuer}
                                onChange={(e) => handleCertificationChange(cert.id, 'issuer', e.target.value)}
                            />
                         </div>
                    </div>
                     <div className="mt-2 space-y-1">
                        <label className="text-xs text-devops-400">Date</label>
                        <input 
                            className="w-full bg-transparent border-b border-devops-700 text-devops-300 text-xs focus:border-accent-500 outline-none pb-1"
                            value={cert.date}
                            onChange={(e) => handleCertificationChange(cert.id, 'date', e.target.value)}
                        />
                     </div>
                </div>
            ))}
        </div>

        {/* Publications Section */}
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-devops-700 pb-2">
                <h3 className="text-md font-medium text-white">Publications</h3>
                <button 
                    onClick={handleAddPublication}
                    className="flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300"
                >
                    <Plus className="w-3 h-3" /> Add
                </button>
            </div>
            
            {(localResume.publications || []).map((pub) => (
                <div key={pub.id} className={`bg-devops-900/30 p-4 rounded-lg border transition-all relative group ${pub.visible === false ? 'border-devops-800 opacity-50' : 'border-devops-700/50'}`}>
                     <div className="absolute top-2 right-2 flex gap-2">
                        <button 
                            onClick={() => togglePublicationVisibility(pub.id)}
                            className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${pub.visible === false ? 'text-devops-600' : 'text-devops-400 hover:text-white'}`}
                        >
                            {pub.visible === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button 
                            onClick={() => handleDeletePublication(pub.id)}
                            className="text-devops-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-2">
                         <div className="space-y-1">
                            <label className="text-xs text-devops-400">Title</label>
                            <input 
                                className="w-full bg-transparent border-b border-devops-700 text-white font-medium focus:border-accent-500 outline-none pb-1"
                                value={pub.title}
                                onChange={(e) => handlePublicationChange(pub.id, 'title', e.target.value)}
                            />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <label className="text-xs text-devops-400">Publisher</label>
                                <input 
                                    className="w-full bg-transparent border-b border-devops-700 text-devops-200 focus:border-accent-500 outline-none pb-1"
                                    value={pub.publisher}
                                    onChange={(e) => handlePublicationChange(pub.id, 'publisher', e.target.value)}
                                />
                             </div>
                             <div className="space-y-1">
                                <label className="text-xs text-devops-400">Date</label>
                                <input 
                                    className="w-full bg-transparent border-b border-devops-700 text-devops-300 focus:border-accent-500 outline-none pb-1"
                                    value={pub.date}
                                    onChange={(e) => handlePublicationChange(pub.id, 'date', e.target.value)}
                                />
                             </div>
                         </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Affiliations Section */}
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-devops-700 pb-2">
                <h3 className="text-md font-medium text-white">Affiliations & Volunteering</h3>
                <button 
                    onClick={handleAddAffiliation}
                    className="flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300"
                >
                    <Plus className="w-3 h-3" /> Add
                </button>
            </div>
            
            {(localResume.affiliations || []).map((aff) => (
                <div key={aff.id} className={`bg-devops-900/30 p-4 rounded-lg border transition-all relative group ${aff.visible === false ? 'border-devops-800 opacity-50' : 'border-devops-700/50'}`}>
                     <div className="absolute top-2 right-2 flex gap-2">
                        <button 
                            onClick={() => toggleAffiliationVisibility(aff.id)}
                            className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${aff.visible === false ? 'text-devops-600' : 'text-devops-400 hover:text-white'}`}
                        >
                            {aff.visible === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button 
                            onClick={() => handleDeleteAffiliation(aff.id)}
                            className="text-devops-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="text-xs text-devops-400">Organization</label>
                            <input 
                                className="w-full bg-transparent border-b border-devops-700 text-white font-medium focus:border-accent-500 outline-none pb-1"
                                value={aff.organization}
                                onChange={(e) => handleAffiliationChange(aff.id, 'organization', e.target.value)}
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-xs text-devops-400">Role</label>
                            <input 
                                className="w-full bg-transparent border-b border-devops-700 text-devops-200 focus:border-accent-500 outline-none pb-1"
                                value={aff.role}
                                onChange={(e) => handleAffiliationChange(aff.id, 'role', e.target.value)}
                            />
                         </div>
                    </div>
                     <div className="mt-2 space-y-1">
                        <label className="text-xs text-devops-400">Period</label>
                        <input 
                            className="w-full bg-transparent border-b border-devops-700 text-devops-300 text-xs focus:border-accent-500 outline-none pb-1"
                            value={aff.period}
                            onChange={(e) => handleAffiliationChange(aff.id, 'period', e.target.value)}
                        />
                     </div>
                </div>
            ))}
        </div>

        {/* Sidebar Sections */}
        <div className="space-y-6">
            <h3 className="text-md font-medium text-white border-b border-devops-700 pb-2">Additional Sections</h3>
            
            <div className="space-y-2">
                <label className="block text-sm font-medium text-devops-300">Skills (Comma separated)</label>
                <textarea
                    className="w-full h-20 bg-devops-900 border border-devops-700 rounded-lg p-3 text-sm text-devops-100 focus:ring-2 focus:ring-accent-500 outline-none"
                    value={localResume.skills.join(', ')}
                    onChange={(e) => handleArrayChange('skills', e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-devops-300">Languages (Comma separated)</label>
                <input
                    className="w-full bg-devops-900 border border-devops-700 rounded-lg p-3 text-sm text-devops-100 focus:ring-2 focus:ring-accent-500 outline-none"
                    value={localResume.languages?.join(', ') || ''}
                    onChange={(e) => handleArrayChange('languages', e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-devops-300">Achievements (Comma separated)</label>
                <textarea
                    className="w-full h-20 bg-devops-900 border border-devops-700 rounded-lg p-3 text-sm text-devops-100 focus:ring-2 focus:ring-accent-500 outline-none"
                    value={localResume.achievements?.join(', ') || ''}
                    onChange={(e) => handleArrayChange('achievements', e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-devops-300">Interests (Comma separated)</label>
                <input
                    className="w-full bg-devops-900 border border-devops-700 rounded-lg p-3 text-sm text-devops-100 focus:ring-2 focus:ring-accent-500 outline-none"
                    value={localResume.interests?.join(', ') || ''}
                    onChange={(e) => handleArrayChange('interests', e.target.value)}
                />
            </div>

             <div className="space-y-2">
                <label className="block text-sm font-medium text-devops-300">Strengths (Comma separated)</label>
                <input
                    className="w-full bg-devops-900 border border-devops-700 rounded-lg p-3 text-sm text-devops-100 focus:ring-2 focus:ring-accent-500 outline-none"
                    value={localResume.strengths?.join(', ') || ''}
                    onChange={(e) => handleArrayChange('strengths', e.target.value)}
                />
            </div>
        </div>

        {/* Education Section */}
        <div className={`space-y-4 transition-opacity ${localResume.educationVisible === false ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-2 border-b border-devops-700 pb-2">
                <button 
                    onClick={() => handleChange('educationVisible', !localResume.educationVisible)}
                    className={`p-1 rounded ${localResume.educationVisible === false ? 'text-devops-500' : 'text-accent-400'}`}
                    title={localResume.educationVisible === false ? "Show Section" : "Hide Section"}
                >
                    {localResume.educationVisible === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <h3 className="text-md font-medium text-white">Education</h3>
            </div>
            <textarea
                className="w-full h-32 bg-devops-900 border border-devops-700 rounded-lg p-3 text-sm text-devops-100 focus:ring-2 focus:ring-accent-500 outline-none"
                value={localResume.education}
                onChange={(e) => handleChange('education', e.target.value)}
                placeholder="Degree, University, Year..."
            />
        </div>

      </div>
    </div>
  );
};

export default ResumeEditor;