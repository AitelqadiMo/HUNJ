
import React, { useState } from 'react';
import { DocumentItem } from '../types';
import { FileText, Download, Trash2, Upload, File, Image, Tag, Plus, Grid, List, Search } from 'lucide-react';

interface DocumentLibraryProps {
  documents: DocumentItem[];
  onAddDocument: (doc: DocumentItem) => void;
  onDeleteDocument: (id: string) => void;
}

const DocumentLibrary: React.FC<DocumentLibraryProps> = ({ documents, onAddDocument, onDeleteDocument }) => {
  const [filter, setFilter] = useState<string>('All');
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = ['All', 'Resume', 'Cover Letter', 'Certificate'];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Simulation
    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      name: 'Uploaded_File.pdf',
      type: 'Resume',
      format: 'PDF',
      dateAdded: new Date().toLocaleDateString(),
      size: '2.4 MB',
      tags: ['New']
    };
    onAddDocument(newDoc);
  };

  const filteredDocs = filter === 'All' 
    ? documents 
    : documents.filter(d => d.type === filter);

  const getIcon = (format: string) => {
    if (format === 'PDF') return <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500"><FileText className="w-6 h-6" /></div>;
    if (format === 'DOCX') return <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500"><FileText className="w-6 h-6" /></div>;
    return <div className="w-10 h-10 bg-gray-500/10 rounded-lg flex items-center justify-center text-gray-500"><File className="w-6 h-6" /></div>;
  };

  return (
    <div className="h-full flex flex-col p-6 md:p-10 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
        <div>
            <h2 className="text-3xl font-bold text-white mb-2">Digital Vault</h2>
            <p className="text-devops-400">Secure storage for your raw career assets.</p>
        </div>
        <div className="flex items-center gap-2 bg-devops-900 p-1 rounded-xl border border-devops-700">
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        filter === cat ? 'bg-devops-800 text-white shadow-sm' : 'text-devops-500 hover:text-white'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>
      </div>

      {/* Upload Zone */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all duration-300 mb-10 group overflow-hidden ${
          isDragging 
          ? 'border-hunj-500 bg-hunj-500/10 scale-[1.01]' 
          : 'border-devops-700 bg-devops-900/30 hover:border-devops-500 hover:bg-devops-900/50'
        }`}
      >
        <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full duration-1000 ${isDragging ? 'translate-x-full' : ''}`}></div>
        
        <div className="w-16 h-16 bg-devops-800 rounded-2xl flex items-center justify-center mb-4 shadow-xl border border-devops-700 group-hover:scale-110 transition-transform">
          <Upload className={`w-8 h-8 ${isDragging ? 'text-hunj-400' : 'text-devops-400'}`} />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">Drop files to secure</h3>
        <p className="text-sm text-devops-500">Support for PDF, DOCX, JPG (Max 50MB)</p>
      </div>

      {/* File Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredDocs.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <div className="w-20 h-20 bg-devops-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <File className="w-8 h-8 text-devops-600" />
            </div>
            <p className="text-devops-400">Vault is empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredDocs.map(doc => (
              <div key={doc.id} className="group bg-devops-900 border border-devops-700 rounded-2xl p-5 hover:border-hunj-500/50 hover:shadow-2xl hover:shadow-hunj-500/10 transition-all relative overflow-hidden flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    {getIcon(doc.format)}
                    <span className="text-[10px] font-bold bg-devops-950 border border-devops-800 text-devops-400 px-2 py-1 rounded uppercase">
                        {doc.format}
                    </span>
                </div>
                
                <h4 className="font-bold text-white text-sm line-clamp-1 mb-1 group-hover:text-hunj-400 transition-colors">{doc.name}</h4>
                <div className="flex items-center gap-2 text-xs text-devops-500 mb-4">
                    <span>{doc.size}</span>
                    <span>•</span>
                    <span>{doc.dateAdded}</span>
                </div>

                <div className="mt-auto pt-4 border-t border-devops-800 flex justify-between items-center opacity-50 group-hover:opacity-100 transition-opacity">
                    <button className="text-xs font-bold text-devops-400 hover:text-white flex items-center gap-1">
                        <Download className="w-3 h-3" /> Download
                    </button>
                    <button onClick={() => onDeleteDocument(doc.id)} className="p-1.5 hover:bg-red-500/20 text-devops-500 hover:text-red-400 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentLibrary;
