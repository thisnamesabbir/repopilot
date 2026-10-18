import React, { useState } from 'react';
import { useRepoPilot } from '../context/RepoPilotContext';
import { ActivityItem } from '../../types';
import { 
  Clock, 
  FolderGit2, 
  Sparkles, 
  Bot, 
  GitCompare, 
  FlaskConical, 
  ShieldCheck, 
  CheckCircle2, 
  Filter 
} from 'lucide-react';

export default function ActivityTimeline() {
  const { activities, setActiveTab } = useRepoPilot();
  const [filterType, setFilterType] = useState<string>('all');

  const filteredActivities = activities.filter(act => 
    filterType === 'all' || act.type === filterType
  );

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'repo_imported':
        return <FolderGit2 className="w-4 h-4 text-purple-400" />;
      case 'repo_analyzed':
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
      case 'ai_task':
        return <Bot className="w-4 h-4 text-blue-400" />;
      case 'diff_generated':
      case 'patch_applied':
        return <GitCompare className="w-4 h-4 text-emerald-400" />;
      case 'tests_run':
        return <FlaskConical className="w-4 h-4 text-cyan-400" />;
      case 'security_audit':
        return <ShieldCheck className="w-4 h-4 text-amber-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#0b0f17] overflow-hidden">
      {/* Sub Header */}
      <div className="h-12 border-b border-slate-800 bg-[#0e131f] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-slate-200">Activity Timeline & Workspace Audit Log</span>
          <span className="text-slate-500 font-mono">({activities.length} total events)</span>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-mono text-[11px] mr-1">Filter:</span>
          {[
            { id: 'all', label: 'All' },
            { id: 'repo_imported', label: 'Imports' },
            { id: 'ai_task', label: 'AI Tasks' },
            { id: 'diff_generated', label: 'Code Diffs' },
            { id: 'tests_run', label: 'Tests' },
            { id: 'security_audit', label: 'Security' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                filterType === f.id
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
        <div className="relative pl-6 border-l border-slate-800 space-y-6">
          {filteredActivities.map((act, index) => (
            <div key={act.id} className="relative group">
              {/* Dot on the timeline */}
              <div className="absolute -left-[31px] top-1 w-6 h-6 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shadow">
                {getIcon(act.type)}
              </div>

              {/* Card content */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">{act.title}</h4>
                  <span className="text-[11px] font-mono text-slate-500">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{act.description}</p>
              </div>
            </div>
          ))}

          {filteredActivities.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500">
              No activity logs match the selected filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
