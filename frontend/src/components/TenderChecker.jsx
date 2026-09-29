import React, { useState } from 'react';
import { FileCheck, Upload, AlertOctagon, AlertTriangle, CheckCircle2, FileText, ArrowRight, RefreshCw } from 'lucide-react';
import { fetchApi } from '../api';

export default function TenderChecker({ onOpenAllied }) {
  const [tenderText, setTenderText] = useState(
    `TECHNICAL SPECIFICATION SCHEDULE:\n1. Supply of Whole Milk Powder packed in 25kg bulk hermetic bags conforming to IS 1165:2022.\n2. Edible maize starch conforming to IS 1005.\n3. Civil works structural cement conforming to IS 99999 (Invalid/Non-Food).\n4. All testing shall adhere to standard laboratory reference procedures.`
  );
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleScanText = async () => {
    if (!tenderText.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchApi('/tender/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tender_text: tenderText, tender_file_name: 'Procurement Text Inspection' })
      });
      setResults(data);
    } catch (e) {
      console.error(e);
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const data = await fetchApi('/tender/upload-and-check', {
        method: 'POST',
        body: formData
      });
      setResults(data);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <FileCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit']">Tender Technical Compliance Checker</h2>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Scans tender documents and Bill of Quantities (BOQ) to verify cited Indian Standards, amendments, and mandatory Clause 2 allied test methods.
        </p>
      </div>

      {/* Input Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Paste Text Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-300">Option 1: Paste Procurement Schedule Text</span>
            <button
              onClick={() => setTenderText("")}
              className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
            >
              Clear
            </button>
          </div>
          <textarea
            rows={7}
            value={tenderText}
            onChange={(e) => setTenderText(e.target.value)}
            placeholder="Paste tender technical criteria or item specifications here..."
            className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-mono"
          />
          <button
            onClick={handleScanText}
            disabled={loading || !tenderText.trim()}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-medium text-xs shadow-md shadow-blue-600/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
            <span>{loading ? 'Analyzing Tender Schedule...' : 'Scan Tender Text'}</span>
          </button>
        </div>

        {/* 2. File Upload Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-3">
              Option 2: Upload Tender RFP Document (PDF / DOCX / XLSX / TXT)
            </span>
            <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50 dark:bg-slate-950/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all">
              <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {file ? file.name : "Click to select or drag and drop tender file"}
              </span>
              <span className="text-[11px] text-slate-500 mt-1">
                Supports Tender Notices, Schedule of Requirements, Technical Specs
              </span>
              <input
                type="file"
                accept=".pdf,.docx,.xlsx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            Engine automatically parses clauses, finds IS codes, verifies current validity, and identifies missing normative references.
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-500/50 p-4 rounded-xl text-xs text-red-800 dark:text-red-200">
          {errorMsg}
        </div>
      )}

      {/* Analysis Results Display */}
      {results && (
        <div className="space-y-6 pt-4 animate-in fade-in duration-300">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">
              Audit Findings for {results.tender_file_name}
            </h3>
            <span className="text-xs bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800">
              Total IS Standards Cited: <strong>{results.total_citations}</strong>
            </span>
          </div>

          {/* Standards Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Verified & Current */}
            <div className="bg-emerald-50 dark:bg-slate-900 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-400 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Current & Valid Standards ({results.valid_standards?.length || 0})</span>
              </div>
              <div className="space-y-2">
                {results.valid_standards?.length > 0 ? (
                  results.valid_standards.map((s, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-emerald-100 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{s.is_number}</span>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Valid (Rev: {s.year})</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] line-clamp-1">{s.title}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No current standards matched.</p>
                )}
              </div>
            </div>

            {/* 2. Outdated or Superseded */}
            <div className="bg-amber-50 dark:bg-slate-900 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-400 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>Superseded / Outdated ({results.superseded_standards?.length || 0})</span>
              </div>
              <div className="space-y-2">
                {results.superseded_standards?.length > 0 ? (
                  results.superseded_standards.map((s, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-amber-100 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{s.is_number}</span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Outdated</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] line-clamp-1">{s.title}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No superseded standards detected.</p>
                )}
              </div>
            </div>

            {/* 3. Unrecognized or Invalid */}
            <div className="bg-red-50 dark:bg-slate-900 border border-red-200 dark:border-red-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center space-x-2 text-red-800 dark:text-red-400 font-semibold text-xs">
                <AlertOctagon className="w-4 h-4" />
                <span>Unrecognized / Invalid ({results.unrecognized_standards?.length || 0})</span>
              </div>
              <div className="space-y-2">
                {results.unrecognized_standards?.length > 0 ? (
                  results.unrecognized_standards.map((s, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-red-100 dark:border-slate-800 text-xs">
                      <span className="font-mono font-bold text-red-700 dark:text-red-400 block">{s}</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Not present in Food & Dairy division dataset.</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No unrecognized citations.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
