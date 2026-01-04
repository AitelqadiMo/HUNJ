import React, { useState } from 'react';
import { ResumeData } from '../types';
import { Copy, Check, ExternalLink, List, ClipboardList } from 'lucide-react';

interface AutofillAssistantProps {
  resume: ResumeData;
}

const AutofillAssistant: React.FC<AutofillAssistantProps> = ({ resume }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const Field = ({ label, value, id }: { label: string, value: string, id: string }) => (
    <div className="flex items-center justify-between p-2 hover:bg-devops-700/50 rounded group transition-colors">
        <div className="min-w-0 flex-1 mr-4">
            <p className="text-xs text-devops-400 uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-sm text-devops-100 truncate font-mono">{value}</p>
        </div>
        <button
            onClick={() => copy(value, id)}
            className="p-1.5 text-devops-400 hover:text-white hover:bg-devops-600 rounded transition-colors"
            title="Copy"
        >
            {copiedId === id ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
        </button>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto pr-2 pb-10">
        <div className="bg-devops-800 rounded-xl border border-devops-700 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-accent-600/20 rounded-lg">
                    <ClipboardList className="w-6 h-6 text-accent-500" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Autofill Assistant</h2>
                    <p className="text-sm text-devops-400">Quickly copy data for external ATS applications</p>
                </div>
            </div>

            {/* Personal Info */}
            <div className="mb-8">
                <h3 className="text-sm font-bold text-white mb-3 border-b border-devops-700 pb-2">Personal Information</h3>
                <div className="space-y-1">
                    <Field label="Full Name" value={resume.fullName} id="fullname" />
                    <Field label="First Name" value={resume.fullName.split(' ')[0]} id="firstname" />
                    <Field label="Last Name" value={resume.fullName.split(' ').slice(1).join(' ')} id="lastname" />
                    <Field label="Email" value={resume.email} id="email" />
                    <Field label="Phone" value={resume.phone} id="phone" />
                    <Field label="Location" value={resume.location} id="location" />
                    <Field label="LinkedIn" value={resume.linkedin} id="linkedin" />
                    <Field label="Website" value={resume.website} id="website" />
                </div>
            </div>

            {/* Work Experience */}
            <div className="mb-8">
                <h3 className="text-sm font-bold text-white mb-3 border-b border-devops-700 pb-2">Work Experience</h3>
                <div className="space-y-6">
                    {resume.experience.filter(e => e.visible !== false).map((exp, i) => (
                        <div key={i} className="bg-devops-900/30 rounded-lg p-3 border border-devops-700/50">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-sm text-white">{exp.company}</span>
                                <span className="text-xs text-devops-400">{i + 1}</span>
                            </div>
                            <div className="space-y-1">
                                <Field label="Job Title" value={exp.role} id={`exp-role-${i}`} />
                                <Field label="Company" value={exp.company} id={`exp-comp-${i}`} />
                                <Field label="Dates" value={exp.period} id={`exp-date-${i}`} />
                                <Field 
                                    label="Description (Bullets)" 
                                    value={exp.bullets.filter(b => b.visible !== false).map(b => b.text).join('\n• ')} 
                                    id={`exp-desc-${i}`} 
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

             {/* Education */}
             <div className="mb-8">
                <h3 className="text-sm font-bold text-white mb-3 border-b border-devops-700 pb-2">Education</h3>
                <div className="bg-devops-900/30 rounded-lg p-3 border border-devops-700/50">
                    <div className="space-y-1">
                         {/* Simple parser for demo, assuming structured like the example */}
                        <Field label="Full Text" value={resume.education} id="edu-full" />
                    </div>
                </div>
            </div>

             {/* Skills */}
             <div>
                <h3 className="text-sm font-bold text-white mb-3 border-b border-devops-700 pb-2">Skills</h3>
                 <div className="bg-devops-900/30 rounded-lg p-3 border border-devops-700/50">
                    <Field label="Comma Separated" value={resume.skills.join(', ')} id="skills-csv" />
                    <Field label="New Line Separated" value={resume.skills.join('\n')} id="skills-lines" />
                 </div>
            </div>

        </div>
    </div>
  );
};

export default AutofillAssistant;