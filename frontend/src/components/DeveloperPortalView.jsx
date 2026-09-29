import React, { useState, useEffect } from 'react';
import { Terminal, Key, Code, Copy, Check, ExternalLink, Globe } from 'lucide-react';
import { fetchApi } from '../api';

export default function DeveloperPortalView() {
  const [department, setDepartment] = useState('GeM Technical Integration Unit');
  const [email, setEmail] = useState('tech-gem@gov.in');
  const [apiKey, setApiKey] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');
  const [samples, setSamples] = useState(null);

  useEffect(() => {
    fetchApi('/developer/docs-samples').then((data) => setSamples(data)).catch(console.error);
  }, []);

  const handleGenerateKey = async () => {
    try {
      const res = await fetchApi('/developer/keys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department, contact_email: email })
      });
      setApiKey(res);
    } catch (e) {
      alert("Key generation failed: " + e.message);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedCode(type);
      setTimeout(() => setCopiedCode(''), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-200">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit']">Public Developer Portal & Integrations (GeM / CPPP)</h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Integrate the BIS Standards Recommender engine directly into e-procurement workflows, government portals (GeM, CPPP), and ERP systems via high-throughput REST APIs and embeddable widgets.
          </p>
        </div>
        <a
          href="/docs"
          target="_blank"
          rel="noreferrer"
          className="flex items-center space-x-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
        >
          <span>FastAPI Swagger Docs</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* API Key Generation Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4 shadow-xs">
        <div className="flex items-center space-x-2">
          <Key className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Generate Departmental API Access Token</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">Government Department / Portal:</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">Nodal Officer Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>
        <button
          onClick={handleGenerateKey}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          Generate Production API Key
        </button>

        {apiKey && (
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-emerald-300 dark:border-emerald-500/40 space-y-2 mt-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">API Key Created for {apiKey.department}</span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                Rate Limit: {apiKey.rate_limit}
              </span>
            </div>
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <code className="font-mono text-xs text-amber-700 dark:text-amber-300 select-all">{apiKey.api_key}</code>
              <button
                onClick={() => copyToClipboard(apiKey.api_key, 'key')}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded transition-all cursor-pointer"
              >
                {copiedKey ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Code Snippets & Embeddable Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Python Sample */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white">REST API Endpoint Sample (Python Requests)</h3>
            </div>
            <button
              onClick={() => samples && copyToClipboard(samples.python_sample, 'python')}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-1 cursor-pointer"
            >
              {copiedCode === 'python' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto border border-slate-800">
            {samples?.python_sample || 'Loading python snippet...'}
          </pre>
        </div>

        {/* Embeddable Widget Snippet */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white">Embeddable Widget for GeM & State Portals (Idea 49)</h3>
            </div>
            <button
              onClick={() => samples && copyToClipboard(samples.embed_widget_script, 'widget')}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-1 cursor-pointer"
            >
              {copiedCode === 'widget' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Paste this snippet into any e-procurement tender creation page to automatically render the live BIS Standards assistant inline.
          </p>
          <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto border border-slate-800">
            {samples?.embed_widget_script || 'Loading widget snippet...'}
          </pre>
        </div>
      </div>
    </div>
  );
}
