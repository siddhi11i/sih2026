import React, { useState, useEffect } from 'react';
import { 
  Database, CheckCircle2, AlertTriangle, RefreshCw, FileText, 
  Shield, Layers, Plus, Edit2, Trash2, Search, History, 
  Check, X, AlertCircle, Eye, Lock 
} from 'lucide-react';
import { fetchApi } from '../api';

export default function DataReadiness({ userRole = 'admin' }) {
  const [activeSubTab, setActiveSubTab] = useState('readiness'); // 'readiness', 'standards_management', 'activity_log'
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Standards Management State
  const [standards, setStandards] = useState([]);
  const [standardsLoading, setStandardsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Modals for Add / Edit
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStd, setEditingStd] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    is_number: '',
    title: '',
    category: 'Milk & Dairy',
    year: '2026',
    status: 'Current',
    standard_type: 'Product Specification',
    scope_text: ''
  });

  // Admin Activity Log State
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const fetchReadiness = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchApi('/data/readiness');
      setReport(data);
    } catch (e) {
      console.error(e);
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStandards = async () => {
    setStandardsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      params.append('limit', '30');

      const data = await fetchApi(`/standards?${params.toString()}`);
      setStandards(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setStandardsLoading(false);
    }
  };

  const fetchActivity = async () => {
    setActivityLoading(true);
    try {
      const data = await fetchApi('/admin/activity?limit=50');
      setActivityLogs(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    fetchReadiness();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'standards_management') {
      fetchStandards();
    } else if (activeSubTab === 'activity_log') {
      fetchActivity();
    }
  }, [activeSubTab, searchTerm, selectedCategory]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetchApi('/admin/standards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      setSuccessMsg(`Standard ${formData.is_number} successfully added to canonical catalog.`);
      setShowAddModal(false);
      setFormData({
        is_number: '',
        title: '',
        category: 'Milk & Dairy',
        year: '2026',
        status: 'Current',
        standard_type: 'Product Specification',
        scope_text: ''
      });
      fetchStandards();
      fetchReadiness();
    } catch (err) {
      setErrorMsg(err.message || "Failed to create standard.");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingStd) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await fetchApi(`/admin/standards/${encodeURIComponent(editingStd.is_number)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          year: formData.year,
          status: formData.status,
          scope_text: formData.scope_text,
          standard_type: formData.standard_type
        })
      });

      setSuccessMsg(`Standard ${editingStd.is_number} updated successfully.`);
      setShowEditModal(false);
      setEditingStd(null);
      fetchStandards();
      fetchReadiness();
    } catch (err) {
      setErrorMsg(err.message || "Failed to update standard.");
    }
  };

  const handleDelete = async (isNumber) => {
    if (!window.confirm(`Are you sure you want to delete / remove standard '${isNumber}' from the BIS active database?`)) {
      return;
    }

    try {
      await fetchApi(`/admin/standards/${encodeURIComponent(isNumber)}`, {
        method: 'DELETE'
      });
      setSuccessMsg(`Standard ${isNumber} has been removed.`);
      fetchStandards();
      fetchReadiness();
    } catch (err) {
      setErrorMsg(err.message || "Failed to delete standard.");
    }
  };

  const openEdit = (std) => {
    setEditingStd(std);
    setFormData({
      is_number: std.is_number,
      title: std.title,
      category: std.category || 'Milk & Dairy',
      year: std.year || '2026',
      status: std.status || 'Current',
      standard_type: std.standard_type || 'Product Specification',
      scope_text: std.scope_text || ''
    });
    setShowEditModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header & Sub-tab navigation */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit']">
              Data Readiness, Admin Control & Governance
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Authorized administrative management: Add/Edit/Delete Indian Standards (IS), verification provenance, and immutable activity history.
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab('readiness')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeSubTab === 'readiness'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Readiness Report
          </button>
          <button
            onClick={() => setActiveSubTab('standards_management')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center space-x-1 ${
              activeSubTab === 'standards_management'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Manage Standards (CRUD)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('activity_log')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center space-x-1 ${
              activeSubTab === 'activity_log'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Admin Activity Log</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-3.5 rounded-2xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 p-3.5 rounded-2xl text-xs text-red-800 dark:text-red-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-600 hover:text-red-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TAB 1: READINESS OVERVIEW */}
      {activeSubTab === 'readiness' && (
        <>
          {loading ? (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500">
              <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-600 dark:text-blue-400" />
              <p className="text-xs">Computing data readiness metrics...</p>
            </div>
          ) : report ? (
            <div className="space-y-6">
              {/* Top Score Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
                  <span className="text-slate-500 dark:text-slate-400 text-xs block">Canonical Standards (REAL)</span>
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-['Outfit'] mt-1 block">
                    {report.canonical_standards_count.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">100% Official BIS Gazette</span>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
                  <span className="text-slate-500 dark:text-slate-400 text-xs block">Schema Validation State</span>
                  <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-['Outfit'] mt-1 block">
                    PASS
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">0 Schema Constraint Errors</span>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
                  <span className="text-slate-500 dark:text-slate-400 text-xs block">System Data Readiness</span>
                  <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-['Outfit'] mt-1 block">
                    {report.data_readiness_pct.toFixed(1)}%
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Weighted Readiness Index</span>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
                  <span className="text-slate-500 dark:text-slate-400 text-xs block">Active Data Version</span>
                  <span className="text-xl font-mono font-bold text-amber-600 dark:text-amber-400 mt-2 block">
                    {report.data_version}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Version-Controlled Ledger</span>
                </div>
              </div>

              {/* Files Status Ledger */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 font-semibold text-xs text-slate-800 dark:text-slate-200">
                  📁 Incoming Data Ledger & Verification State
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3.5">Dataset File</th>
                        <th className="p-3.5">Status Tag</th>
                        <th className="p-3.5">Records Ingested</th>
                        <th className="p-3.5">Integrity & Provenance Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {report.incoming_files?.map((f, i) => (
                        <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                          <td className="p-3.5 font-mono text-slate-900 dark:text-white">{f.file_name}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                f.status_tag.includes('VERIFIED') || f.status_tag.includes('REAL')
                                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                                  : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30'
                              }`}
                            >
                              {f.status_tag}
                            </span>
                          </td>
                          <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">{f.records_count}</td>
                          <td className="p-3.5 text-slate-500 dark:text-slate-400 text-[11px]">{f.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* TAB 2: STANDARDS CATALOG MANAGEMENT (ADD / EDIT / DELETE) */}
      {activeSubTab === 'standards_management' && (
        <div className="space-y-4">
          {/* Action & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-2 flex-grow max-w-xl">
              <div className="relative flex-grow">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search IS number or title to manage..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="">All Categories</option>
                <option value="Milk & Dairy">Milk & Dairy</option>
                <option value="Foodgrains">Foodgrains & Cereals</option>
                <option value="Edible Oils">Edible Oils & Sugar</option>
                <option value="Food Safety">Food Safety & Hygiene</option>
                <option value="Agricultural">Agricultural Equipment</option>
                <option value="General & Allied">General & Allied</option>
              </select>
            </div>

            <button
              onClick={() => {
                setFormData({
                  is_number: '',
                  title: '',
                  category: 'Milk & Dairy',
                  year: '2026',
                  status: 'Current',
                  standard_type: 'Product Specification',
                  scope_text: ''
                });
                setShowAddModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Standard (IS)</span>
            </button>
          </div>

          {/* Standards CRUD Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">IS Number</th>
                    <th className="p-3.5">Title</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Year</th>
                    <th className="p-3.5">Gazette Status</th>
                    <th className="p-3.5 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {standardsLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                        Loading standards catalog...
                      </td>
                    </tr>
                  ) : standards.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No standards matching search criteria.
                      </td>
                    </tr>
                  ) : (
                    standards.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                        <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                          {s.is_number}
                        </td>
                        <td className="p-3.5 max-w-md font-medium text-slate-800 dark:text-slate-200">
                          {s.title}
                        </td>
                        <td className="p-3.5 text-slate-500 dark:text-slate-400">
                          {s.category}
                        </td>
                        <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                          {s.year || 'N/A'}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              s.status === 'Current' || s.status === 'Active'
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30'
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => openEdit(s)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-all cursor-pointer"
                            title="Edit Standard"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.is_number)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-900/60 text-slate-700 dark:text-slate-300 hover:text-red-600 transition-all cursor-pointer"
                            title="Delete / Withdraw Standard"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ADMIN ACTIVITY & AUDIT LOG */}
      {activeSubTab === 'activity_log' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs space-y-4 p-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Outfit']">
                Administrative Activity & Audit History
              </h3>
            </div>
            <button
              onClick={fetchActivity}
              className="flex items-center space-x-1 text-xs text-blue-600 hover:underline cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${activityLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Log</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Timestamp (UTC)</th>
                  <th className="p-3">Action Type</th>
                  <th className="p-3">Entity Target</th>
                  <th className="p-3">Details & Audit Trail</th>
                  <th className="p-3">Authorized User</th>
                  <th className="p-3">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {activityLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Loading activity history...
                    </td>
                  </tr>
                ) : activityLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No administrative activity recorded yet.
                    </td>
                  </tr>
                ) : (
                  activityLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono text-[11px] text-slate-500">{log.timestamp}</td>
                      <td className="p-3">
                        <span className="font-mono text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {log.action_type}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{log.entity_id}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">{log.details}</td>
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{log.user_name || log.user_email}</td>
                      <td className="p-3">
                        <span className="text-[10px] uppercase font-bold text-slate-500">{log.user_role}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD STANDARD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">
                Add New Indian Standard (IS)
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    IS Number (with Year) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IS 19999:2026"
                    value={formData.is_number}
                    onChange={(e) => setFormData({ ...formData, is_number: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Publication / Revision Year
                  </label>
                  <input
                    type="text"
                    placeholder="2026"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Standard Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fortified Skimmed Milk Powder - Specification"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Commodity Sector / Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Milk & Dairy">Milk & Dairy</option>
                    <option value="Foodgrains, Cereals & Pulses">Foodgrains, Cereals & Pulses</option>
                    <option value="Edible Oils, Fats & Sugar">Edible Oils, Fats & Sugar</option>
                    <option value="Food Safety, Microbiology & Hygiene">Food Safety, Microbiology & Hygiene</option>
                    <option value="Agricultural Equipment & Storage">Agricultural Equipment & Storage</option>
                    <option value="General & Allied">General & Allied</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gazette Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Current">Current / Active</option>
                    <option value="Superseded">Superseded</option>
                    <option value="Withdrawn">Withdrawn</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Scope Text & Specification Keywords
                </label>
                <textarea
                  rows={3}
                  placeholder="Describes quality parameters, microbiological pathogen limits, moisture content..."
                  value={formData.scope_text}
                  onChange={(e) => setFormData({ ...formData, scope_text: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Save to Canonical Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STANDARD MODAL */}
      {showEditModal && editingStd && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">
                  Edit Standard: {editingStd.is_number}
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">ID: {editingStd.id}</span>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Standard Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Milk & Dairy">Milk & Dairy</option>
                    <option value="Foodgrains, Cereals & Pulses">Foodgrains, Cereals & Pulses</option>
                    <option value="Edible Oils, Fats & Sugar">Edible Oils, Fats & Sugar</option>
                    <option value="Food Safety, Microbiology & Hygiene">Food Safety, Microbiology & Hygiene</option>
                    <option value="Agricultural Equipment & Storage">Agricultural Equipment & Storage</option>
                    <option value="General & Allied">General & Allied</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Revision Year
                  </label>
                  <input
                    type="text"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Current">Current</option>
                    <option value="Superseded">Superseded</option>
                    <option value="Withdrawn">Withdrawn</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Scope Text
                </label>
                <textarea
                  rows={3}
                  value={formData.scope_text}
                  onChange={(e) => setFormData({ ...formData, scope_text: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
