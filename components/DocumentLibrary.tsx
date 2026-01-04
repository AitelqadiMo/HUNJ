import React, { useState } from 'react';
import { DocumentItem } from '../types';
import { FileText, Download, Trash2, Upload, File, Image, Tag, Plus } from 'lucide-react';

interface DocumentLibraryProps {
  documents: DocumentItem[];
  onAddDocument: (doc: DocumentItem) => void;
  onDeleteDocument: (id: string) => void;
}

const DocumentLibrary: React.FC<DocumentLibraryProps> = ({ documents, onAddDocument, onDeleteDocument }) => {
  const [filter, setFilter] = useState<string>('All');
  const [isDragging, setIsDragging] = useState(false);

  const categories = ['All', 'Resume', 'Cover Letter', 'Certificate', 'Portfolio'];

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
    // Simulation of file drop
    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      name: 'Uploaded_Document.pdf',
      type: 'Resume',
      format: 'PDF',
      dateAdded: new Date().toLocaleDateString(),
      size: '1.2 MB',
      tags: ['New']
    };
    onAddDocument(newDoc);
  };

  const filteredDocs = filter === 'All' 
    ? documents 
    : documents.filter(d => d.type === filter);

  const getIcon = (format: string) => {
    if (format === 'PDF') return <FileText className="w-5 h-5 text-red-400" />;
    if (format === 'DOCX') return <FileText className="w-5 h-5 text-blue-400" />;
    if (format === 'IMG') return <Image className="w-5 h-5 text-purple-400" />;
    return <File className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header & Filter */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-white">Document Library</h2>
        <div className="flex gap-2">
           {categories.map(cat => (
             <button
               key={cat}
               onClick={() => setFilter(cat)}
               className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                 filter === cat 
                 ? 'bg-accent-600 text-white' 
                 : 'bg-devops-800 text-devops-400 hover:text-white'
               }`}
             >
               {cat}
             </button>
           ))}
        </div>
      </div>

      {/* Drop Zone */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 mb-6 flex flex-col items-center justify-center transition-all ${
          isDragging 
          ? 'border-accent-500 bg-accent-500/10' 
          : 'border-devops-700 bg-devops-900/30 hover:border-devops-500'
        }`}
      >
        <div className="w-12 h-12 bg-devops-800 rounded-full flex items-center justify-center mb-3">
          <Upload className="w-6 h-6 text-devops-400" />
        </div>
        <p className="text-white font-medium mb-1">Click or drag files to upload</p>
        <p className="text-xs text-devops-500">PDF, DOCX, JPG (Max 10MB)</p>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {filteredDocs.length === 0 ? (
          <div className="text-center py-10 text-devops-500 text-sm">
            No documents found in this category.
          </div>
        ) : (
          filteredDocs.map(doc => (
            <div key={doc.id} className="bg-devops-800 border border-devops-700 rounded-lg p-4 flex items-center justify-between group hover:border-devops-600 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-devops-900 rounded-lg">
                  {getIcon(doc.format)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white mb-1">{doc.name}</h4>
                  <div className="flex items-center gap-3 text-xs text-devops-400">
                    <span>{doc.size}</span>
                    <span>•</span>
                    <span>{doc.dateAdded}</span>
                    <span className="bg-devops-700 px-2 py-0.5 rounded text-devops-300 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> {doc.type}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 hover:bg-devops-700 rounded-lg text-devops-400 hover:text-white" title="Download">
                  <Download className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onDeleteDocument(doc.id)}
                  className="p-2 hover:bg-devops-700 rounded-lg text-devops-400 hover:text-danger" 
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DocumentLibrary;