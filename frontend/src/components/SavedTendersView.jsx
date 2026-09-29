import React, { useState, useEffect } from 'react';
import { Bookmark, Bell, Plus, FolderKanban, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { fetchApi } from '../api';

export default function SavedTendersView({ onOpenAllied, onOpenCompliance }) {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // New Tender Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newOrg, setNewOrg] = useState('Department of School Education');
  const [selectedStdNum, setSelectedStdNum] = useState('IS 1165:2022');

  const loadSavedTenders = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchApi('/advanced/saved-tenders');
      setTenders(data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedTenders();
  }, []);

  const handleCreateTender = async () => {
    if (!newTitle.trim()) return;
    try {
      await fetchApi('/advanced/saved-tenders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tender_title: newTitle,
          organization: newOrg,
          items: [{ is_number: selectedStdNum, title: "Referenced Product Specification", grade: "Standard" }]
        })
      });
      setShowAddModal(false);
      setNewTitle('');
      loadSavedTenders();
    } catch (err) {
      alert("Failed to save tender: " + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <FolderKanban className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit']">Saved Tender Workspace & Revision Alerts</h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Track active tenders across procurement cycles. The system continuously checks referenced standards against the latest BIS Gazette amendments and alerts officers upon standard withdrawal or revision.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 flex items-center space-x-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Save New Tender</span>
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-500/50 p-4 rounded-xl text-xs text-red-800 dark:text-red-200">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-400 dark:text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600 dark:text-blue-500" />
          <p className="text-xs">Loading saved procurement workspaces and checking revision statuses...</p>
        </div>
      ) : tenders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 p-12 rounded-2xl text-center text-slate-500">
          <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-600 dark:text-blue-400" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-300">No Saved Tenders Yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Save draft tenders here to automatically monitor revisions and gazette amendments.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
          >
            Create Sample Tender
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tenders.map((tender) => (
            <div key={tender.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 hover:border-blue-400 dark:hover:border-slate-700 transition-all shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded font-mono">
                    ID #{tender.id} • {tender.organization}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mt-1.5">{tender.tender_title}</h3>
                </div>
                <span className="text-[10px] text-slate-400">{tender.created_at ? tender.created_at.slice(0, 10) : 'Recent'}</span>
              </div>

              {/* Revision Alert Banner */}
              {tender.status_alerts ? (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/40 p-3 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-start space-x-2.5">
                  <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5 animate-bounce" />
                  <div>
                    <strong className="text-amber-800 dark:text-amber-300 font-medium block">Gazette Amendment / Revision Alert:</strong>
                    <span className="text-[11px] text-slate-700 dark:text-slate-300">{tender.status_alerts}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 p-2.5 rounded-xl text-xs text-emerald-800 dark:text-emerald-400 flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>All referenced standards are currently active and unamended.</span>
                </div>
              )}

              {/* Referenced Items List */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Referenced BIS Standards:</span>
                {tender.items && tender.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-900 dark:text-amber-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                      {item.is_number}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Tender Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Save Tender to Workspace</h3>
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">Tender Title / Subject:</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Mid-Day Meal Nutrition Procurement 2026-27"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">Procuring Department / Authority:</label>
              <input
                type="text"
                value={newOrg}
                onChange={(e) => setNewOrg(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">Standard to Track:</label>
              <select
                value={selectedStdNum}
                onChange={(e) => setSelectedStdNum(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              >
                <option value="IS 1165:2022">IS 1165:2022 (Whole Milk Powder)</option>
                <option value="IS 1005:1992">IS 1005:1992 (Edible Maize Starch)</option>
                <option value="IS 4251:2014">IS 4251:2014 (Quality tolerances for water)</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTender}
                disabled={!newTitle.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Save Tender
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
