import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, Mic, MicOff, Filter, Download, FileText, Printer, X, Globe, ChevronDown, Check, AlertCircle } from 'lucide-react';
import { LANGUAGES, getTranslation, LANGUAGE_SCENARIO_PRESETS, CATEGORY_TRANSLATIONS, STATUS_TRANSLATIONS } from '../i18n';

export default function SearchHeader({
  query,
  setQuery,
  onSearch,
  loading,
  filters,
  setFilters,
  onExportDocx,
  onExportCsv,
  detectedLang,
  totalResults = 0,
  currentLang = 'en',
  setCurrentLang
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState(null);
  const [interimText, setInterimText] = useState('');
  const langDropdownRef = useRef(null);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const silenceTimerRef = useRef(null);

  const t = (key, params) => getTranslation(currentLang, key, params);
  const currentLangObj = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];
  const presets = LANGUAGE_SCENARIO_PRESETS[currentLang] || LANGUAGE_SCENARIO_PRESETS['en'] || [];

  // Speech Recognition Capability Check
  const SpeechRecognition = typeof window !== 'undefined' 
    ? (window.SpeechRecognition || window.webkitSpeechRecognition) 
    : null;

  useEffect(() => {
    function handleClickOutside(event) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setShowLangDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup speech recognition and timers on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  const resetSilenceTimer = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      // If user has spoken something and stopped talking for 2.2 seconds, finish
      if (finalTranscriptRef.current.trim() || query.trim()) {
        stopVoiceInput(true);
      }
    }, 2400);
  };

  const startVoiceInput = () => {
    setSpeechError(null);
    setInterimText('');
    finalTranscriptRef.current = query ? query.trim() + ' ' : '';

    if (!SpeechRecognition) {
      setSpeechError(t('mic_unsupported'));
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = currentLangObj.speechCode || 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
        resetSilenceTimer();
      };

      recognition.onresult = (event) => {
        resetSilenceTimer();
        let currentInterim = '';
        let newFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const transcriptChunk = result[0].transcript;
          if (result.isFinal) {
            newFinal += (newFinal ? ' ' : '') + transcriptChunk;
          } else {
            currentInterim += transcriptChunk;
          }
        }

        if (newFinal) {
          finalTranscriptRef.current = (finalTranscriptRef.current + (finalTranscriptRef.current ? ' ' : '') + newFinal.trim()).trim();
        }

        setInterimText(currentInterim);
        const combined = (finalTranscriptRef.current + (currentInterim ? ' ' + currentInterim : '')).trim();
        if (combined) {
          setQuery(combined);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition warning:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setIsListening(false);
          setSpeechError(t('mic_permission_denied'));
        } else if (event.error === 'no-speech') {
          // Keep listening or allow user to speak
        } else if (event.error === 'language-not-supported') {
          // Fallback to en-IN or hi-IN
          try {
            recognition.lang = 'en-IN';
            recognition.start();
          } catch (e) {
            setIsListening(false);
            setSpeechError(t('mic_unsupported'));
          }
        } else {
          setIsListening(false);
          setSpeechError(t('mic_unsupported'));
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition exception:', err);
      setIsListening(false);
      setSpeechError(t('mic_unsupported'));
    }
  };

  const stopVoiceInput = (shouldSearch = false) => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
    setInterimText('');
    const fullText = (finalTranscriptRef.current || query).trim();
    if (shouldSearch && fullText) {
      onSearch(fullText);
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopVoiceInput(true);
    } else {
      startVoiceInput();
    }
  };

  const handleClear = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (isListening) stopVoiceInput(false);
    setQuery("");
    setInterimText("");
    finalTranscriptRef.current = "";
    setFilters({ category: "", yearMin: "", status: "" });
    setSpeechError(null);
  };

  return (
    <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 py-6 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Preset Chips (Strictly filtered by selected language) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('demo_scenarios')}</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(p.query);
                  onSearch(p.query);
                }}
                className="bg-slate-100 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 text-xs px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-700 transition-all text-left shadow-xs cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Box Container */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearch(query);
          }}
          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl p-2 sm:p-3 shadow-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Input Icon + Text Area */}
            <div className="flex items-start flex-grow gap-2.5 px-2">
              <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-2 flex-shrink-0" />
              <textarea
                rows={2}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (speechError) setSpeechError(null);
                }}
                placeholder={t('search_placeholder')}
                className="w-full py-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none text-xs sm:text-sm resize-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 mt-1 rounded-lg cursor-pointer"
                  title={t('clear')}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center justify-end space-x-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 sm:pl-3 sm:border-l sm:border-slate-200 dark:sm:border-slate-800 flex-shrink-0">
              {/* Web Speech Recognition Microphone Button */}
              <button
                type="button"
                onClick={handleMicClick}
                title={isListening ? t('mic_listening') : t('mic_tooltip')}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                  isListening 
                    ? 'bg-red-600 text-white animate-pulse border-red-700 ring-2 ring-red-400' 
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                aria-label="Voice Input"
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>

              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-semibold text-xs shadow-md shadow-blue-600/20 flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap"
              >
                <span>{loading ? t('searching') : t('search_btn')}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Live Listening Feedback or Error Banner */}
        {isListening && (
          <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 p-3 rounded-2xl text-xs text-red-800 dark:text-red-200 flex flex-wrap items-center justify-between gap-2 animate-pulse">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
              <span className="font-semibold">{t('mic_listening')} ({currentLangObj.nativeName})</span>
              {interimText && (
                <span className="text-[11px] bg-red-200/70 dark:bg-red-900/60 text-red-900 dark:text-red-200 px-2 py-0.5 rounded-md italic">
                  "{interimText}"
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => stopVoiceInput(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {t('search_btn')}
              </button>
              <button
                type="button"
                onClick={() => stopVoiceInput(false)}
                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2 py-1 text-xs cursor-pointer"
              >
                {t('clear')}
              </button>
            </div>
          </div>
        )}

        {speechError && (
          <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 p-2.5 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{speechError}</span>
            </div>
            <button
              type="button"
              onClick={() => setSpeechError(null)}
              className="text-amber-500 hover:text-amber-800 dark:hover:text-amber-200 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Toolbar, Language Switcher & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all shadow-xs cursor-pointer ${
                showFilters || filters.category || filters.yearMin || filters.status
                  ? 'bg-amber-100 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{filters.category || filters.yearMin || filters.status ? t('active_filters') : t('filters')}</span>
            </button>

            {/* Interactive Multi-Language Dropdown Selector (Next to Filters) */}
            <div className="relative" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center space-x-1.5 bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800/80 text-blue-800 dark:text-blue-300 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all cursor-pointer"
                title="Select preferred output language"
              >
                <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{t('language_select')}: <strong className="underline">{currentLangObj.nativeName}</strong></span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showLangDropdown && (
                <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1">
                    {t('language_select')}
                  </div>
                  <div className="space-y-0.5 max-h-56 overflow-y-auto">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          if (setCurrentLang) setCurrentLang(lang.code);
                          setShowLangDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                          currentLang === lang.code
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span>{lang.nativeName}</span>
                          <span className={`text-[10px] ${currentLang === lang.code ? 'text-blue-100' : 'text-slate-400'}`}>
                            ({lang.label})
                          </span>
                        </div>
                        {currentLang === lang.code && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {totalResults > 0 && (
              <span className="text-slate-500 dark:text-slate-400">
                {t('found_standards', { count: totalResults })}
              </span>
            )}
          </div>

          {/* Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onExportDocx}
              disabled={totalResults === 0}
              className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-all shadow-xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">{t('export_docx')}</span>
              <span className="sm:hidden">DOCX</span>
            </button>
            <button
              onClick={onExportCsv}
              disabled={totalResults === 0}
              className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('export_csv')}</span>
            </button>
            <button
              onClick={() => window.print()}
              disabled={totalResults === 0}
              className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{t('print')}</span>
            </button>
          </div>
        </div>

        {/* Filter Drawer Panel */}
        {showFilters && (
          <div className="bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 shadow-inner animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {t('filter_sector')}
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
              >
                <option value="">{t('filter_all_sectors')}</option>
                {Object.keys(CATEGORY_TRANSLATIONS).map((catKey) => (
                  <option key={catKey} value={catKey}>
                    {CATEGORY_TRANSLATIONS[catKey][currentLang] || CATEGORY_TRANSLATIONS[catKey]['en'] || catKey}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {t('filter_year_min')}
              </label>
              <input
                type="number"
                placeholder="2015"
                value={filters.yearMin}
                onChange={(e) => setFilters({ ...filters, yearMin: e.target.value })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {t('filter_status')}
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
              >
                <option value="">{t('filter_all_statuses')}</option>
                {Object.keys(STATUS_TRANSLATIONS).map((statKey) => (
                  <option key={statKey} value={statKey}>
                    {STATUS_TRANSLATIONS[statKey][currentLang] || STATUS_TRANSLATIONS[statKey]['en'] || statKey}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
