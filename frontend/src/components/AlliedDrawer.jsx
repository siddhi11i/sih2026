import React, { useState } from 'react';
import { X, Shield, AlertTriangle, CheckCircle, ExternalLink, Layers, Beaker, Package, BookOpen, AlertOctagon } from 'lucide-react';

const RELATIONSHIP_ICONS = {
  test_method: Beaker,
  sampling: Layers,
  packaging: Package,
  labelling: BookOpen,
  terminology: BookOpen,
  safety: AlertOctagon,
  installation: Layers,
  related_product: Shield
};

const RELATIONSHIP_TITLES = {
  test_method: "🧪 Test Methods & Chemical Analysis",
  sampling: "📦 Sampling & Scale of Inspection",
  packaging: "🛡️ Packaging & Storage Containers",
  labelling: "🏷️ Marking & Labelling Requirements",
  terminology: "📖 Terminology & Definitions",
  safety: "⚠️ Safety & Screening Standards",
  installation: "⚙️ Equipment & Installation",
  related_product: "🔗 Related Product Formulations"
};

export default function AlliedDrawer({ standard, alliedData, onClose, onSelectStandard }) {
  if (!standard) return null;

  const [activeRelTab, setActiveRelTab] = useState('all');

  const hasData = alliedData && alliedData.has_verified_data;
  const groups = (alliedData && alliedData.grouped_allied) || {};
  const allAllied = (alliedData && alliedData.all_allied) || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50 dark:bg-slate-950">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm font-bold text-blue-700 dark:text-white bg-blue-100 dark:bg-blue-900/60 px-2.5 py-0.5 rounded-md border border-blue-300 dark:border-blue-700">
                {standard.is_number}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Normative References (Clause 2)</span>
            </div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1 line-clamp-2">
              {standard.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Data Status Alert */}
        <div className="px-5 py-3 bg-slate-100/60 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800/80 text-xs">
          {hasData ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-400">
                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Status: <strong>{alliedData.data_status}</strong></span>
              </div>
              <span className="text-slate-500 dark:text-slate-400">{alliedData.notice}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-300 dark:border-amber-500/30">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>No verified allied data yet:</strong> Clause 2 normative references have not been verified from official Gazette text for this standard.
              </span>
            </div>
          )}
        </div>

        {/* Grouped Tabs */}
        {hasData && (
          <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 bg-slate-50 dark:bg-slate-900 overflow-x-auto gap-2 py-2">
            <button
              onClick={() => setActiveRelTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeRelTab === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              All Allied ({allAllied.length})
            </button>
            {Object.keys(groups).map((grpKey) => (
              <button
                key={grpKey}
                onClick={() => setActiveRelTab(grpKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap capitalize transition-all cursor-pointer ${
                  activeRelTab === grpKey
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {grpKey.replace('_', ' ')} ({groups[grpKey].length})
              </button>
            ))}
          </div>
        )}

        {/* Normative References List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!hasData || allAllied.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Normative Reference Graph Pending Verification</p>
              <p className="text-xs mt-1 max-w-sm mx-auto">
                Once official Clause 2 Gazette extracts are ingested, normative test methods and sampling schedules will be linked automatically.
              </p>
            </div>
          ) : activeRelTab === 'all' ? (
            Object.keys(groups).map((grpKey) => {
              const items = groups[grpKey];
              const Icon = RELATIONSHIP_ICONS[grpKey] || Shield;
              return (
                <div key={grpKey} className="space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>{RELATIONSHIP_TITLES[grpKey] || grpKey}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 hover:border-blue-400 dark:hover:border-blue-500 transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-amber-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                            {item.allied_standard_number}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize bg-slate-200 dark:bg-slate-900 px-2 py-0.5 rounded">
                            {item.relationship_type.replace('_', ' ')}
                          </span>
                        </div>
                        <h4 className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          {item.allied_title}
                        </h4>
                        {item.clause_reference && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Clause: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.clause_reference}</span> • {item.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="space-y-2">
              {groups[activeRelTab]?.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-amber-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                      {item.allied_standard_number}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                      {item.relationship_type.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    {item.allied_title}
                  </h4>
                  {item.clause_reference && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Clause: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.clause_reference}</span> • {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
