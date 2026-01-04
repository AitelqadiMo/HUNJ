import React, { useState } from 'react';
import { Application, ResumeData, JobAnalysis } from '../types';
import { Plus, Briefcase, Calendar, ChevronRight, User, LayoutGrid, Kanban as KanbanIcon, Globe } from 'lucide-react';
import JobRecommendations from './JobRecommendations';
import KanbanBoard from './KanbanBoard';

interface DashboardProps {
  applications: Application[];
  masterResume: ResumeData;
  onNewApplication: () => void;
  onSelectApplication: (id: string) => void;
  onEditProfile: () => void;
  // We need a way to add an app from recommendations, usually passed down from App.tsx
  // Since we don't have that prop in the interface yet, I'll assume App.tsx will handle the logic 
  // if we pass a callback up, or we can just pass onNewApplication but customized.
  // Actually, let's add a specialized callback for instant analysis.
}

// Extended props to support the new features properly
interface ExtendedDashboardProps extends DashboardProps {
    onAnalyzeJob?: (analysis: JobAnalysis, text: string) => void;
    onUpdateStatus?: (id: string, status: Application['status']) => void;
    onNavigateToJobBoard?: () => void;
}

const Dashboard: React.FC<ExtendedDashboardProps> = ({ 
  applications, 
  masterResume, 
  onNewApplication, 
  onSelectApplication,
  onEditProfile,
  onAnalyzeJob,
  onUpdateStatus,
  onNavigateToJobBoard
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 h-full flex flex-col">
      
      {/* Top Section: Profile & Actions */}
      <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Summary Card */}
          <div className="flex-1 bg-gradient-to-r from-devops-800 to-devops-900 border border-devops-700 rounded-2xl p-6 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-accent-600 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-accent-500/30">
                    {masterResume.fullName.charAt(0)}
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white mb-1">Welcome, {masterResume.fullName.split(' ')[0]}</h1>
                    <p className="text-devops-300 text-sm flex items-center gap-2">
                        <User className="w-3 h-3" /> Master Profile Active
                    </p>
                </div>
            </div>
            <button 
                onClick={onEditProfile}
                className="px-4 py-2 bg-devops-800 border border-devops-600 rounded-lg hover:bg-devops-700 transition-all text-devops-200 text-sm font-medium"
            >
                Edit Profile
            </button>
          </div>

          {/* Quick Stats or Mini-Action */}
          <div className="md:w-64 bg-devops-800 border border-devops-700 rounded-2xl p-6 flex flex-col justify-center items-center">
              <span className="text-3xl font-bold text-white mb-1">{applications.length}</span>
              <span className="text-xs text-devops-400 uppercase tracking-wide">Active Applications</span>
          </div>
      </div>

      {/* Recommendations Widget (Only show if we have the callback) */}
      {onAnalyzeJob && (
          <JobRecommendations masterResume={masterResume} onApply={onAnalyzeJob} />
      )}

      {/* Pipeline Header */}
      <div className="flex items-center justify-between mt-8">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-accent-500" />
            Application Pipeline
        </h2>
        <div className="flex items-center gap-4">
            {onNavigateToJobBoard && (
                <button 
                    onClick={onNavigateToJobBoard}
                    className="flex items-center gap-2 px-4 py-2 bg-devops-800 hover:bg-devops-700 text-devops-200 rounded-lg border border-devops-600 transition-all text-sm font-medium"
                >
                    <Globe className="w-4 h-4" /> Find Jobs
                </button>
            )}
            <div className="flex bg-devops-800 rounded-lg p-1 border border-devops-700">
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-devops-700 text-white' : 'text-devops-400 hover:text-white'}`}
                    title="Grid View"
                >
                    <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => setViewMode('kanban')}
                    className={`p-2 rounded transition-colors ${viewMode === 'kanban' ? 'bg-devops-700 text-white' : 'text-devops-400 hover:text-white'}`}
                    title="Kanban Board"
                >
                    <KanbanIcon className="w-4 h-4" />
                </button>
            </div>
            <button 
                onClick={onNewApplication}
                className="flex items-center gap-2 px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-lg shadow-lg shadow-accent-600/20 transition-all text-sm font-bold"
            >
                <Plus className="w-4 h-4" /> New Application
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-[400px]">
        {applications.length === 0 ? (
            <div className="text-center py-20 bg-devops-800/50 rounded-2xl border border-dashed border-devops-700 h-full flex flex-col items-center justify-center">
                <Briefcase className="w-16 h-16 text-devops-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No applications yet</h3>
                <p className="text-devops-400 mb-6">Start tracking your first job application to get AI-powered insights.</p>
                <button 
                    onClick={onNewApplication}
                    className="text-accent-400 hover:text-accent-300 font-medium"
                >
                    Create your first application &rarr;
                </button>
            </div>
        ) : viewMode === 'kanban' ? (
             <KanbanBoard 
                applications={applications} 
                onSelectApplication={onSelectApplication}
                onUpdateStatus={onUpdateStatus || (() => {})}
             />
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {applications.map(app => (
                    <div 
                        key={app.id}
                        onClick={() => onSelectApplication(app.id)}
                        className="group bg-devops-800 border border-devops-700 hover:border-accent-500/50 rounded-xl p-6 cursor-pointer transition-all hover:shadow-xl hover:shadow-accent-500/5 hover:-translate-y-1 relative overflow-hidden"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg text-white group-hover:text-accent-400 transition-colors line-clamp-1">{app.jobTitle}</h3>
                                <p className="text-devops-400 text-sm">{app.companyName}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-md text-xs font-medium border ${
                                app.status === 'Applied' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                                app.status === 'Offer' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                                app.status === 'Rejected' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                                'bg-devops-700/50 border-devops-600 text-devops-300'
                            }`}>
                                {app.status}
                            </span>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-devops-500">ATS Score</span>
                                <span className={`font-mono font-bold ${
                                    (app.atsScore?.total || 0) > 80 ? 'text-success' : 'text-warning'
                                }`}>
                                    {app.atsScore?.total || 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-devops-500">Probability</span>
                                <span className="font-mono text-devops-200">
                                    {app.jobAnalysis?.hiringProbability ? `${app.jobAnalysis.hiringProbability}%` : 'N/A'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-devops-700/50 text-xs text-devops-500">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(app.dateCreated).toLocaleDateString()}
                            </span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;