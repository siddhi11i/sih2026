import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SearchHeader from './components/SearchHeader';
import ClarificationModal from './components/ClarificationModal';
import StandardCard from './components/StandardCard';
import AlliedDrawer from './components/AlliedDrawer';
import ComplianceModal from './components/ComplianceModal';
import ComparisonView from './components/ComparisonView';
import TenderChecker from './components/TenderChecker';
import BulkBOQView from './components/BulkBOQView';
import SupplierCheckView from './components/SupplierCheckView';
import SavedTendersView from './components/SavedTendersView';
import DeveloperPortalView from './components/DeveloperPortalView';
import DataReadiness from './components/DataReadiness';
import AnalyticsView from './components/AnalyticsView';
import ChatbotWidget from './components/ChatbotWidget';
import GuidedTourModal from './components/GuidedTourModal';
import OfficialLoginModal from './components/OfficialLoginModal';
import { fetchApi, API_BASE } from './api';
import { getTranslation, LANGUAGE_SCENARIO_PRESETS } from './i18n';
import { AlertTriangle, AlertCircle, RefreshCw, BookOpen, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('search');
  const [userRole, setUserRole] = useState('drafter');
  const [currentUser, setCurrentUser] = useState(null);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Theme State: Default to 'light' as requested
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('bis_theme') || 'light';
  });

  // Language State: Default to 'en' with option to change to hi, mr, ta, te, bn, gu, kn, hinglish
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('bis_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('bis_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('bis_lang', currentLang);
  }, [currentLang]);

  const t = (key, params) => getTranslation(currentLang, key, params);

  // Search State: No auto-search on startup (do not show standards unless scenario or search is selected)
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [detectedLang, setDetectedLang] = useState('en');
  const [isNonFood, setIsNonFood] = useState(false);
  const [clarification, setClarification] = useState(null);
  const [filters, setFilters] = useState({ category: '', yearMin: '', status: '' });
  const [errorMessage, setErrorMessage] = useState(null);

  // Modals & Drawers
  const [selectedAlliedStd, setSelectedAlliedStd] = useState(null);
  const [alliedData, setAlliedData] = useState(null);
  const [selectedComplianceStd, setSelectedComplianceStd] = useState(null);
  const [complianceData, setComplianceData] = useState(null);

  // Comparison Deck
  const [comparisonList, setComparisonList] = useState([]);

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setHasSearched(true);
    setClarification(null);
    setErrorMessage(null);

    try {
      const data = await fetchApi('/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tender: searchQuery,
          category_filter: filters.category || undefined,
          status_filter: filters.status || undefined,
          year_min: filters.yearMin ? parseInt(filters.yearMin) : undefined,
          top_k: 12
        })
      });

      setResults(data.standards || []);
      setDetectedLang(data.detected_language || 'en');
      setIsNonFood(data.is_non_food || false);
      if (data.requires_clarification && data.clarification) {
        setClarification(data.clarification);
      }
    } catch (err) {
      console.error("Search failed:", err);
      setErrorMessage(err.message || "Failed to communicate with the BIS recommendation server.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAllied = async (std) => {
    setSelectedAlliedStd(std);
    try {
      const data = await fetchApi(`/allied/${encodeURIComponent(std.is_number)}`);
      setAlliedData(data);
    } catch (e) {
      console.error("Allied fetch failed:", e);
      setErrorMessage(e.message);
    }
  };

  const handleOpenCompliance = async (std) => {
    setSelectedComplianceStd(std);
    try {
      const data = await fetchApi(`/compliance/${encodeURIComponent(std.is_number)}`);
      setComplianceData(data);
    } catch (e) {
      console.error("Compliance fetch failed:", e);
      setErrorMessage(e.message);
    }
  };

  const handleToggleCompare = (std) => {
    if (comparisonList.some((s) => s.id === std.id)) {
      setComparisonList(comparisonList.filter((s) => s.id !== std.id));
    } else {
      if (comparisonList.length >= 4) {
        alert("You can compare up to 4 standards at a time.");
        return;
      }
      setComparisonList([...comparisonList, std]);
    }
  };

  const handleReview = async (standardNumber, decision) => {
    try {
      await fetchApi('/audit/review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query_text: query,
          standard_number: standardNumber,
          decision: decision,
          reviewer_name: userRole === 'admin' ? 'Chief Technical Director' : 'Verification Officer',
          reviewer_role: userRole,
          feedback: `Decision marked as ${decision} from executive portal.`
        })
      });
      alert(`Decision recorded: Standard ${standardNumber} marked as ${decision}.`);
    } catch (e) {
      console.error(e);
      setErrorMessage(e.message);
    }
  };

  const handleExportDocx = async () => {
    try {
      const tenderQuery = query?.trim() || 'Food and Dairy BIS Standards Procurement Schedule';
      const url = `${API_BASE}/export/docx`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tender: tenderQuery, top_k: 25 })
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`DOCX export failed (${res.status}): ${errText || res.statusText}`);
      }
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = "BIS_Standards_Annexure.docx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
    } catch (e) {
      console.error(e);
      setErrorMessage(`DOCX Export Error: ${e.message}`);
    }
  };

  const handleExportCsv = () => {
    try {
      const itemsToExport = results.length > 0 ? results : [];
      if (itemsToExport.length === 0) {
        alert("Please perform a search before exporting the CSV schedule.");
        return;
      }

      // Build CSV with UTF-8 BOM for full compatibility with Excel & Indian scripts
      let csvRows = [];
      csvRows.push(`"Procurement Query","${(query || 'BIS Standards Schedule').replace(/"/g, '""')}"`);
      csvRows.push("");
      csvRows.push(`"Rank","IS Number","Title","Year","Sector / Category","Match Percentage","Relevance Tier","Data Status","Why Matched"`);

      itemsToExport.forEach((s, idx) => {
        const whyMatchedStr = Array.isArray(s.why_matched) ? s.why_matched.join('; ') : (s.why_matched || '');
        csvRows.push([
          `"${idx + 1}"`,
          `"${(s.is_number || '').replace(/"/g, '""')}"`,
          `"${(s.title || '').replace(/"/g, '""')}"`,
          `"${s.year || ''}"`,
          `"${(s.category || '').replace(/"/g, '""')}"`,
          `"${s.match_pct || 0}%"`,
          `"${s.match_tier || ''}"`,
          `"${s.data_status || 'REAL'}"`,
          `"${whyMatchedStr.replace(/"/g, '""')}"`
        ].join(','));
      });

      const csvString = '\uFEFF' + csvRows.join('\r\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = "BIS_Standards_Schedule.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
    } catch (e) {
      console.error(e);
      setErrorMessage(`CSV Export Error: ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors">
      <div>
        {/* Top Navbar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userRole={userRole}
          setUserRole={setUserRole}
          selectedCount={comparisonList.length}
          onStartTour={() => setIsTourOpen(true)}
          theme={theme}
          setTheme={setTheme}
          currentLang={currentLang}
          setCurrentLang={setCurrentLang}
          onOpenLogin={() => setIsLoginOpen(true)}
          currentUser={currentUser}
        />

        {/* Tab 1: Semantic Search */}
        {activeTab === 'search' && (
          <main>
            <SearchHeader
              query={query}
              setQuery={setQuery}
              onSearch={handleSearch}
              loading={loading}
              filters={filters}
              setFilters={setFilters}
              onExportDocx={handleExportDocx}
              onExportCsv={handleExportCsv}
              detectedLang={detectedLang}
              totalResults={results.length}
              currentLang={currentLang}
              setCurrentLang={setCurrentLang}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Visible Error Banner */}
              {errorMessage && (
                <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-500/50 p-4 rounded-2xl mb-6 text-xs text-red-800 dark:text-red-200 flex items-start justify-between shadow-sm">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-red-900 dark:text-red-300 text-sm">{t('server_error_title')}</h4>
                      <p className="mt-1 text-slate-700 dark:text-slate-300">{errorMessage}</p>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        Check that the backend is running via <code>python server.py</code> on port 8080.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSearch(query)}
                    className="flex items-center space-x-1 bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-xl text-xs transition-all font-medium cursor-pointer shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{t('retry_btn')}</span>
                  </button>
                </div>
              )}

              {/* Clarification Alert */}
              <ClarificationModal
                clarification={clarification}
                onSelectChoice={(modQuery) => {
                  setQuery(modQuery);
                  handleSearch(modQuery);
                }}
                onDismiss={() => setClarification(null)}
              />

              {/* Non-Food Out-of-Scope Warning */}
              {isNonFood && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 p-4 rounded-2xl mb-6 text-xs text-amber-900 dark:text-amber-200 flex items-center space-x-3 shadow-xs">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <span>
                    <strong>{t('out_of_domain_title')}:</strong> {t('out_of_domain_desc')}
                  </span>
                </div>
              )}

              {/* State 1: Initial Empty State (Do not show standards unless scenario or query is selected) */}
              {!hasSearched && !loading && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 sm:p-14 text-center max-w-3xl mx-auto shadow-sm space-y-5 animate-in fade-in duration-300">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center border border-blue-200 dark:border-blue-800">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit']">
                      {t('welcome_title')}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                      {t('welcome_desc')}
                    </p>
                  </div>
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                    {(LANGUAGE_SCENARIO_PRESETS[currentLang] || LANGUAGE_SCENARIO_PRESETS['en'] || []).slice(0, 2).map((sample, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setQuery(sample.query);
                          handleSearch(sample.query);
                        }}
                        className={`text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center space-x-2 ${
                          idx === 0
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white'
                        }`}
                      >
                        <span>{sample.label}</span>
                        {idx === 0 && <ArrowRight className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* State 2: Loading State */}
              {loading && (
                <div className="text-center py-20 text-slate-400 dark:text-slate-500">
                  <div className="w-10 h-10 border-2 border-blue-600 dark:border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-xs">Computing hybrid BM25 + dense semantic embeddings across 3,144 standards...</p>
                </div>
              )}

              {/* State 3: No Match Found */}
              {hasSearched && !loading && results.length === 0 && !errorMessage && (
                <div className="text-center py-20 text-slate-400 dark:text-slate-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('no_match_title')}</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    {t('no_match_desc')}
                  </p>
                </div>
              )}

              {/* State 4: Standards Results Deck */}
              {hasSearched && !loading && results.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-300">
                  {results.map((std) => (
                    <StandardCard
                      key={std.id}
                      standard={std}
                      onOpenAllied={handleOpenAllied}
                      onOpenCompliance={handleOpenCompliance}
                      onToggleCompare={handleToggleCompare}
                      isCompared={comparisonList.some((s) => s.id === std.id)}
                      onReview={handleReview}
                      userRole={userRole}
                      currentLang={currentLang}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>
        )}

        {/* Tab 2: Bulk BOQ & Requirement Extraction */}
        {activeTab === 'bulk_boq' && (
          <BulkBOQView
            onOpenAllied={handleOpenAllied}
            onOpenCompliance={handleOpenCompliance}
          />
        )}

        {/* Tab 3: Tender Checker & Restrictive Spec Detector */}
        {activeTab === 'tender_checker' && (
          <TenderChecker onOpenAllied={handleOpenAllied} />
        )}

        {/* Tab 4: Normative & Allied Explorer */}
        {activeTab === 'allied_graph' && (
          <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit']">Normative References & Allied Standards Explorer</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Explore Clause 2 normative links for Whole Milk Powder (IS 1165:2022) and other products.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => handleOpenAllied({ is_number: "IS 1165:2022", title: "Whole Milk Powder - Specification (Sixth Revision)" })}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 p-5 rounded-2xl cursor-pointer transition-all shadow-xs"
              >
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-amber-400 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  IS 1165:2022
                </span>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mt-2">Whole Milk Powder Specification (Clause 2)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">8 Normative Test Method & Sampling Standards Linked (EXTRACTED-UNVERIFIED)</p>
              </div>

              <div
                onClick={() => handleOpenAllied({ is_number: "IS 1005:1992", title: "Edible Maize Starch (Corn Flour)" })}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 p-5 rounded-2xl cursor-pointer transition-all shadow-xs"
              >
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-amber-400 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  IS 1005:1992
                </span>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mt-2">Edible Maize Starch Specification</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">2 Sample Normative References Linked (SAMPLE - verify before use)</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Comparison View */}
        {activeTab === 'comparison' && (
          <ComparisonView
            comparisonList={comparisonList}
            onRemoveFromComparison={(id) => setComparisonList(comparisonList.filter((s) => s.id !== id))}
            onClearComparison={() => setComparisonList([])}
            onOpenAllied={handleOpenAllied}
            onOpenCompliance={handleOpenCompliance}
          />
        )}

        {/* Tab 6: Supplier Pre-Bid Check */}
        {activeTab === 'supplier_check' && (
          <SupplierCheckView />
        )}

        {/* Tab 7: Saved Tenders & Revision Alerts */}
        {activeTab === 'saved_tenders' && (
          <SavedTendersView
            onOpenAllied={handleOpenAllied}
            onOpenCompliance={handleOpenCompliance}
          />
        )}

        {/* Tab 8: Public Developer Portal */}
        {activeTab === 'dev_portal' && (
          <DeveloperPortalView />
        )}

        {/* Tab 9: Data Readiness & Governance */}
        {activeTab === 'data_readiness' && (
          <DataReadiness userRole={userRole} />
        )}

        {/* Tab 10: Ministry Analytics */}
        {activeTab === 'analytics' && (
          <AnalyticsView />
        )}
      </div>

      {/* Allied Drawer */}
      {selectedAlliedStd && (
        <AlliedDrawer
          standard={selectedAlliedStd}
          alliedData={alliedData}
          onClose={() => setSelectedAlliedStd(null)}
          onSelectStandard={handleOpenAllied}
        />
      )}

      {/* Compliance Modal */}
      {selectedComplianceStd && (
        <ComplianceModal
          standard={selectedComplianceStd}
          complianceData={complianceData}
          onClose={() => setSelectedComplianceStd(null)}
        />
      )}

      {/* Floating Chatbot Assistant */}
      <ChatbotWidget activeScreen={activeTab} />

      {/* Interactive Guided Tour Modal */}
      <GuidedTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onSelectSampleQuery={(sample) => {
          setActiveTab('search');
          setQuery(sample);
          handleSearch(sample);
        }}
      />

      {/* Official Government Login & RBAC Modal */}
      <OfficialLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        userRole={userRole}
        setUserRole={setUserRole}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
      />

      {/* Executive Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <p>
          Bureau of Indian Standards (BIS) • National Public Procurement Decision Support Portal • SIH 2026 (SIH26108, Team Aavishkara)
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1">
          Zero Hallucination Retrieval Architecture • Local Grounded Model Execution • DPDP Act & CERT-In Compliant
        </p>
      </footer>
    </div>
  );
}
