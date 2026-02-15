import React, { useMemo, useState } from 'react';
import { Application, ResumeData, JobAnalysis } from '../types';
import { Plus, Search, Pin, Copy, Trash2, FileText, FileBadge2 } from 'lucide-react';
import KanbanBoard from './KanbanBoard';

interface ExtendedDashboardProps {
  applications: Application[];
  masterResume: ResumeData;
  onNewApplication: () => void;
  onSelectApplication: (id: string) => void;
  onEditProfile: () => void;
  onAnalyzeJob?: (analysis: JobAnalysis, text: string) => void;
  onUpdateStatus?: (id: string, status: Application['status']) => void;
  onNavigateToJobBoard?: () => void;
  onDuplicateApplication?: (id: string) => void;
  onDeleteApplication?: (id: string) => void;
}

type DocTab = 'all' | 'resumes' | 'cover-letters';

const Dashboard: React.FC<ExtendedDashboardProps> = ({
  applications,
  onNewApplication,
  onSelectApplication,
  onDuplicateApplication,
  onDeleteApplication,
}) => {
  const [workspaceMode, setWorkspaceMode] = useState<'documents' | 'pipeline'>('documents');
  const [activeTab, setActiveTab] = useState<DocTab>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  const docs = useMemo(() => {
    const mapped = applications.flatMap(app => {
      const hasCover = Boolean(app.coverLetter && app.coverLetter.content?.trim());
      const resumeDoc = {
        id: `${app.id}-resume`,
        appId: app.id,
        name: app.resumes.find(r => r.id === app.activeResumeId)?.versionName || `${app.jobTitle} Resume`,
        job: `${app.jobTitle} @ ${app.companyName}`,
        type: 'Resume' as const,
        createdAt: app.dateCreated,
        modifiedAt: app.resumes.find(r => r.id === app.activeResumeId)?.timestamp || Date.now(),
      };
      const coverDoc = {
        id: `${app.id}-cover`,
        appId: app.id,
        name: `${app.companyName} Cover Letter`,
        job: `${app.jobTitle} @ ${app.companyName}`,
        type: 'Cover Letter' as const,
        createdAt: app.dateCreated,
        modifiedAt: app.dateCreated ? new Date(app.dateCreated).getTime() : Date.now(),
      };
      return hasCover ? [resumeDoc, coverDoc] : [resumeDoc];
    });

    const filteredByTab = mapped.filter(doc => {
      if (activeTab === 'resumes') return doc.type === 'Resume';
      if (activeTab === 'cover-letters') return doc.type === 'Cover Letter';
      return true;
    });

    const q = searchTerm.trim().toLowerCase();
    const filtered = q
      ? filteredByTab.filter(doc => doc.name.toLowerCase().includes(q) || doc.job.toLowerCase().includes(q))
      : filteredByTab;

    return filtered.sort((a, b) => {
      const aPinned = pinnedIds.includes(a.id) ? 1 : 0;
      const bPinned = pinnedIds.includes(b.id) ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      return b.modifiedAt - a.modifiedAt;
    });
  }, [applications, activeTab, searchTerm, pinnedIds]);

  const pipelineApps = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter(app =>
      app.jobTitle.toLowerCase().includes(q) ||
      app.companyName.toLowerCase().includes(q)
    );
  }, [applications, searchTerm]);

  const resumeCount = applications.length;
  const coverCount = applications.filter(a => a.coverLetter?.content?.trim()).length;

  const togglePin = (docId: string) => {
    setPinnedIds(prev => (prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]));
  };

  const formatDate = (input: string | number) => {
    const date = typeof input === 'number' ? new Date(input) : new Date(input);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-slate-100/70 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display font-bold text-slate-900">Welcome back, Career Builder</h1>
            <p className="text-slate-600 mt-2">You have {docs.length} document{docs.length === 1 ? '' : 's'} in your workspace.</p>
          </div>
          <button
            onClick={onNewApplication}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-hunj-600 hover:bg-hunj-500 text-white font-bold rounded-xl shadow-md"
          >
            <Plus className="w-4 h-4" /> New Document
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-5">
            <div className="inline-flex bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setWorkspaceMode('documents')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${workspaceMode === 'documents' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                Documents
              </button>
              <button
                onClick={() => setWorkspaceMode('pipeline')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${workspaceMode === 'pipeline' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                Pipeline (Kanban)
              </button>
            </div>
          </div>

          {workspaceMode === 'documents' && (
          <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-5 pt-5">
            <div className="flex items-center gap-6 border-b border-slate-200 md:border-b-0">
              <button
                onClick={() => setActiveTab('all')}
                className={`pb-3 text-sm font-bold border-b-2 ${activeTab === 'all' ? 'text-hunj-700 border-hunj-600' : 'text-slate-500 border-transparent'}`}
              >
                All documents ({resumeCount + coverCount})
              </button>
              <button
                onClick={() => setActiveTab('resumes')}
                className={`pb-3 text-sm font-bold border-b-2 ${activeTab === 'resumes' ? 'text-hunj-700 border-hunj-600' : 'text-slate-500 border-transparent'}`}
              >
                Resumes ({resumeCount})
              </button>
              <button
                onClick={() => setActiveTab('cover-letters')}
                className={`pb-3 text-sm font-bold border-b-2 ${activeTab === 'cover-letters' ? 'text-hunj-700 border-hunj-600' : 'text-slate-500 border-transparent'}`}
              >
                Cover letters ({coverCount})
              </button>
            </div>

            <div className="relative w-full md:w-96 mb-4 md:mb-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-hunj-500/20 focus:border-hunj-500"
                placeholder="Search documents"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead className="text-xs uppercase tracking-wider text-slate-500 border-t border-slate-200">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Job</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3">Modified</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.map(doc => (
                  <tr key={doc.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <button onClick={() => onSelectApplication(doc.appId)} className="flex items-center gap-2 text-slate-900 font-semibold hover:text-hunj-700">
                        {doc.type === 'Resume' ? <FileText className="w-4 h-4 text-slate-400" /> : <FileBadge2 className="w-4 h-4 text-slate-400" />}
                        {doc.name}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-sm">{doc.job}</td>
                    <td className="px-5 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${doc.type === 'Resume' ? 'bg-indigo-50 text-indigo-700' : 'bg-purple-50 text-purple-700'}`}>
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-sm">{formatDate(doc.createdAt)}</td>
                    <td className="px-5 py-4 text-slate-600 text-sm">{formatDate(doc.modifiedAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => togglePin(doc.id)} className={`p-2 rounded-lg border ${pinnedIds.includes(doc.id) ? 'border-hunj-300 bg-hunj-50 text-hunj-700' : 'border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`} title="Pin">
                          <Pin className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDuplicateApplication?.(doc.appId)} className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100" title="Duplicate">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDeleteApplication?.(doc.appId)} className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {docs.length === 0 && (
            <div className="p-10 text-center border-t border-slate-200 bg-slate-50/40">
              <div className="text-5xl mb-3">🧭</div>
              <h3 className="text-lg font-bold text-slate-800">No documents yet</h3>
              <p className="text-slate-500 text-sm mt-1">Create your first document and start building your application stack.</p>
            </div>
          )}
          </>
          )}

          {workspaceMode === 'pipeline' && (
            <div className="p-5">
              <KanbanBoard
                applications={pipelineApps}
                onSelectApplication={onSelectApplication}
                onUpdateStatus={onUpdateStatus || (() => {})}
                onInspect={onSelectApplication}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
