import React from 'react';
import { Shield, ShieldAlert } from 'lucide-react';

interface PrivacyControlProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const PrivacyControl: React.FC<PrivacyControlProps> = ({ enabled, onToggle }) => {
  return (
    <div className="flex items-center gap-2">
        <button
            onClick={() => onToggle(!enabled)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                enabled 
                ? 'bg-success/10 border-success/30 text-success' 
                : 'bg-devops-800 border-devops-600 text-devops-400 hover:text-devops-200'
            }`}
            title={enabled ? "PII is removed before sending to AI" : "Data sent as-is to AI"}
        >
            {enabled ? <Shield className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
            {enabled ? 'Privacy Mode: ON' : 'Privacy Mode: OFF'}
        </button>
    </div>
  );
};

export default PrivacyControl;