// Bureau of Indian Standards (BIS) — Standards Recommender Engine
// Food & Dairy Procurement Division • Government of India

// Formal Demonstration Cases
const PRESETS = [
  "Supply of packaged pasteurized toned milk and skimmed milk powder for mid-day school meals program in district primary schools.",
  "Bulk procurement, handling, and silo storage of milling wheat and parboiled rice for Food Corporation godowns.",
  "Purchase of refined edible sunflower oil and vanaspati in food-grade tins for public distribution system.",
  "Procurement of traditional dairy products including Paneer, Chhana, Khoa, and Shrikhand for festival rations.",
  "Microbiological food safety testing, pathogen screening (E. coli, Salmonella), and hygiene audit for food manufacturing units.",
  "Procurement of modular ergonomic office workstations, conference tables, and laptop computers for administrative department."
];

// Commodity and Domain Weights for High-Precision Matching
const COMMODITY_WEIGHTS = {
  // Dairy
  'milk': 20.0, 'pasteurized': 22.0, 'skimmed': 20.0, 'powder': 16.0, 'toned': 18.0,
  'butter': 18.0, 'ghee': 20.0, 'cheese': 18.0, 'paneer': 24.0, 'chhana': 24.0,
  'khoa': 24.0, 'shrikhand': 24.0, 'dahi': 18.0, 'curd': 16.0, 'yoghurt': 18.0,
  'kulfi': 16.0, 'ice cream': 16.0, 'condensed': 18.0, 'lactose': 16.0, 'casein': 18.0,
  'dairy': 14.0, 'lactometer': 16.0, 'whey': 15.0,
  // Grains & Cereals
  'wheat': 20.0, 'atta': 20.0, 'maida': 20.0, 'suji': 20.0, 'rice': 20.0,
  'paddy': 20.0, 'dal': 18.0, 'pulse': 18.0, 'pulses': 18.0, 'cereal': 15.0,
  'cereals': 15.0, 'grain': 15.0, 'foodgrain': 18.0, 'foodgrains': 18.0,
  'barley': 16.0, 'maize': 16.0, 'corn': 16.0, 'millet': 16.0, 'besan': 18.0,
  'sattu': 18.0, 'silo': 18.0, 'silos': 18.0, 'godown': 18.0, 'godowns': 18.0,
  // Oils & Sugar
  'sunflower': 22.0, 'mustard': 18.0, 'soybean': 18.0, 'groundnut': 18.0,
  'vanaspati': 24.0, 'palm': 16.0, 'palmolein': 16.0, 'edible oil': 20.0,
  'sugar': 18.0, 'jaggery': 18.0, 'gur': 18.0, 'shortening': 16.0,
  // Safety & Hygiene
  'salmonella': 22.0, 'coliform': 22.0, 'escherichia': 22.0, 'coli': 22.0,
  'pathogen': 18.0, 'haccp': 22.0, 'microbiology': 16.0, 'hygiene': 16.0,
  'aflatoxin': 18.0, 'pesticide': 16.0, 'drinking water': 18.0
};

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'these', 'those', 'are', 'was', 'were', 'will', 'shall',
  'been', 'have', 'has', 'had', 'supply', 'procurement', 'purchase', 'tender', 'delivery', 'bulk', 'distribution',
  'scheme', 'program', 'programs', 'state', 'central', 'department', 'corporation', 'unit', 'units', 'under', 'etc',
  'including', 'such', 'per', 'district', 'conforming', 'required', 'food', 'products', 'product', 'common', 'system',
  'quality', 'standard', 'standards', 'methods', 'method', 'requirements', 'general', 'part'
]);

const FOOD_KEYWORDS = new Set([
  'milk', 'dairy', 'butter', 'ghee', 'cheese', 'paneer', 'chhana', 'curd', 'dahi', 'yoghurt', 'kulfi', 'ice cream',
  'grain', 'cereal', 'pulse', 'pulses', 'wheat', 'rice', 'paddy', 'flour', 'atta', 'maida', 'dal', 'oil', 'fats',
  'vanaspati', 'sugar', 'jaggery', 'gur', 'food', 'foodstuff', 'food safety', 'microbiology', 'hygiene', 'storage',
  'godown', 'silo', 'drinking water', 'edible', 'bakery', 'confectionery', 'tea', 'coffee', 'spice', 'spices',
  'sweet', 'sweets', 'rasogolla', 'gulab jamun', 'shrikhand', 'khoa', 'cream'
]);

const NON_FOOD_TERMS = new Set([
  'furniture', 'chair', 'table', 'desk', 'computer', 'laptop', 'software', 'hardware', 'printer', 'vehicle', 'car',
  'cement', 'steel', 'concrete', 'building', 'textile', 'clothing', 'garment', 'stationery', 'paper', 'office'
]);

// Helper: Decode HTML entities
function decodeHtml(html) {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value.replace(/&mdash;/g, '—').replace(/&apos;/g, "'").replace(/&quot;/g, '"');
}

// Tokenizers
function tokenize(text) {
  const clean = decodeHtml(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  return clean.split(/\s+/).filter(w => w.length > 1 && !STOPWORDS.has(w));
}

function fullTokenize(text) {
  const clean = decodeHtml(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  return clean.split(/\s+/).filter(w => w.length > 0);
}

function getNgrams(tokens, n) {
  const ngrams = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(' '));
  }
  return ngrams;
}

// Domain Classification
function isFoodRelated(query) {
  const tokens = new Set(query.toLowerCase().match(/\b[a-zA-Z]+\b/g) || []);
  let foodHits = 0;
  let nonFoodHits = 0;
  tokens.forEach(t => {
    if (FOOD_KEYWORDS.has(t)) foodHits++;
    if (NON_FOOD_TERMS.has(t)) nonFoodHits++;
  });
  if (foodHits > 0) return true;
  if (nonFoodHits > 0 && foodHits === 0) return false;
  return true;
}

// Core Semantic Recommendation Engine (Dynamic Inclusion & Strict Percentage Arrangement)
function recommendStandards(tenderText) {
  const dataset = window.BIS_STANDARDS || [];
  if (!dataset.length) return { formatted: 'Error: Standards dataset not loaded.', items: [], isNonFood: false };

  const qLower = tenderText.toLowerCase();
  const qAllTokens = fullTokenize(tenderText);
  const qSigTokens = tokenize(tenderText);
  const qBigrams = getNgrams(qAllTokens, 2);
  const qTrigrams = getNgrams(qAllTokens, 3);
  const isFood = isFoodRelated(tenderText);

  const scored = [];

  for (let i = 0; i < dataset.length; i++) {
    const item = dataset[i];
    const cleanTitle = decodeHtml(item.title);
    const titleLower = cleanTitle.toLowerCase();
    const isLower = item.is_number.toLowerCase();
    let score = 0.0;

    // 1. Direct IS number match (e.g. user entered IS 13688 or 13688)
    for (let t of qAllTokens) {
      if (t.length >= 3 && isLower.includes(t)) {
        score += 150.0;
      }
    }

    // 2. High-value Commodity term matches
    for (const [term, weight] of Object.entries(COMMODITY_WEIGHTS)) {
      if (qLower.includes(term) && titleLower.includes(term)) {
        score += weight * 4.5;
      }
    }

    // 3. Subject matching (Part before hyphen or em-dash)
    const subjectMatch = cleanTitle.split(/[-—–]/)[0].trim().toLowerCase();
    if (subjectMatch.length > 3 && qLower.includes(subjectMatch)) {
      score += 48.0;
    }

    // 4. Trigram match in title
    for (let tri of qTrigrams) {
      if (tri.length > 8 && titleLower.includes(tri)) {
        score += 35.0;
      }
    }

    // 5. Bigram match in title
    for (let bi of qBigrams) {
      if (bi.length > 5 && titleLower.includes(bi)) {
        score += 26.0;
      }
    }

    // 6. Significant token overlap
    for (let w of qSigTokens) {
      if (titleLower.includes(w)) {
        const regex = new RegExp('\\b' + w + '\\b', 'i');
        score += regex.test(titleLower) ? 6.0 : 2.0;
      }
    }

    // 7. Specification boost for purchasing
    if (titleLower.includes('specification')) {
      score += 10.0;
    }

    // 8. Category affinity bonus
    if (['Milk & Dairy', 'Foodgrains, Cereals & Pulses', 'Edible Oils, Fats & Sugar', 'Food Safety, Microbiology & Hygiene'].includes(item.category)) {
      score += 5.0;
    }

    // 9. Avoid bilingual duplicates in English queries
    if ((isLower.includes('hindi') || titleLower.includes('hindi')) && !qLower.includes('hindi')) {
      score *= 0.40;
    }

    // 10. Penalty for amendment notices so core standard specifications rank higher
    if (item.is_amendment && !qLower.includes('amendment')) {
      score *= 0.10;
    }

    // 11. Non-food query fallback
    if (!isFood) {
      if (titleLower.includes('hygiene') || titleLower.includes('food safety') || titleLower.includes('storage') || titleLower.includes('code of practice')) {
        score += 30.0;
      }
      if (item.category === 'Food Safety, Microbiology & Hygiene' || item.category === 'Agricultural Equipment & Storage') {
        score += 15.0;
      }
    }

    if (score > 0) {
      scored.push({
        score: score,
        item: {
          sno: item.sno,
          is_number: item.is_number,
          year: item.year,
          title: cleanTitle,
          category: item.category
        }
      });
    }
  }

  if (!scored.length) {
    return { formatted: 'No matching Indian Standards found.', items: [], isNonFood: !isFood };
  }

  // Sort descending by raw score first
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const yA = parseInt(a.item.year) || 0;
    const yB = parseInt(b.item.year) || 0;
    return yB - yA;
  });

  const topScore = scored[0].score;

  // Dynamically include all relevant standards meeting conformance threshold
  // and compute calibrated percentage match
  const recommended = [];
  const seenBase = new Set();

  for (let s of scored) {
    const rawPct = (s.score / topScore) * 98;
    const matchPct = Math.min(99, Math.max(50, Math.round(rawPct)));

    // Dynamic threshold: Include all instances with strong-to-moderate relevance
    // Cut off if match percentage falls below 62% or if we exceed top 12 standards
    if (matchPct < 62 && recommended.length >= 3) {
      break;
    }

    const baseCode = s.item.is_number.split(/[:(Amd]/)[0].trim();
    if (!seenBase.has(baseCode) || seenBase.size < 3 || s.score > topScore * 0.75) {
      recommended.push({
        ...s.item,
        score: s.score,
        match_pct: matchPct
      });
      seenBase.add(baseCode);
    }

    if (recommended.length >= 12) break;
  }

  // Arrange instances strictly according to percentage match in descending order
  recommended.sort((a, b) => {
    if (b.match_pct !== a.match_pct) return b.match_pct - a.match_pct;
    const yA = parseInt(a.year) || 0;
    const yB = parseInt(b.year) || 0;
    return yB - yA;
  });

  // Formal Text Output Formatting
  const oneLineTender = tenderText.replace(/\s+/g, ' ').trim();
  const lines = [
    `Input tender: ${oneLineTender}`,
    "",
    "Recommended standards (from dataset, arranged by percentage match):"
  ];

  recommended.forEach((rec, idx) => {
    lines.push(`${idx + 1}) is_number: ${rec.is_number} | year: ${rec.year} | title: ${rec.title} | match: ${rec.match_pct}%`);
  });

  lines.push("");
  if (!isFood) {
    lines.push("Note: The input appears to be unrelated to food or dairy. This portal is specialized in Food & Dairy procurement compliance, so general quality assurance and storage standards from the dataset have been displayed.");
    lines.push("");
  }
  lines.push("Note: Recommended Indian Standards are curated from the official BIS repository to assist procurement authorities in technical compliance, quality assurance, and tender specification drafting.");

  return {
    formatted: lines.join('\n'),
    items: recommended,
    isNonFood: !isFood
  };
}

// Generate Formal Procurement Rationale
function getRationale(item) {
  const t = item.title.toLowerCase();
  if (t.includes('specification')) {
    return 'Defines mandatory product quality specifications, permissible tolerances, chemical/physical limits, and labeling requirements for procurement.';
  } else if (t.includes('code of practice') || t.includes('hygienic') || t.includes('hygiene')) {
    return 'Mandates operational sanitation, hygienic production protocols, storage environments, and contamination prevention controls.';
  } else if (t.includes('method') || t.includes('determination')) {
    return 'Prescribes standardized laboratory test procedures for batch verification, active constituent analysis, and quality conformance.';
  } else if (t.includes('sampling')) {
    return 'Provides statistically validated sampling guidelines for drawing inspection lots upon shipment arrival.';
  }
  return 'Applicable Indian Standard for technical compliance verification during tender evaluation.';
}

// Global UI State
let currentCategory = 'All';
let searchQuery = '';
let currentPage = 1;
const pageSize = 20;
let lastResultText = '';
let currentRecommendedItems = [];

// DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
  const tenderInput = document.getElementById('tender-input');
  const btnRecommend = document.getElementById('btn-recommend');
  const btnClear = document.getElementById('btn-clear');
  const datasetSearch = document.getElementById('dataset-search');

  // Input counters
  tenderInput.addEventListener('input', updateInputStats);

  // Buttons
  btnRecommend.addEventListener('click', runRecommendation);
  btnClear.addEventListener('click', () => {
    tenderInput.value = '';
    updateInputStats();
    document.getElementById('empty-state').classList.remove('hidden');
    document.getElementById('content-formatted').classList.add('hidden');
    document.getElementById('content-cards').classList.add('hidden');
    document.getElementById('non-food-alert').classList.add('hidden');
    document.getElementById('results-summary-text').textContent = 'All relevant standards arranged by percentage match';
  });

  // Table Search
  datasetSearch.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    currentPage = 1;
    renderTable();
  });

  // Initial Table Render
  renderTable();

  // Load first demo case on startup
  loadPreset(0);
});

// Update character and sentence counters
function updateInputStats() {
  const text = document.getElementById('tender-input').value.trim();
  const charCount = text.length;
  const sentenceCount = text ? (text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text]).length : 0;

  document.getElementById('char-count').textContent = `Characters: ${charCount}`;
  const sentElem = document.getElementById('sentence-count');
  sentElem.textContent = `Sentences: ${sentenceCount}`;
  if (sentenceCount > 3) {
    sentElem.className = 'text-amber-600 font-semibold';
  } else {
    sentElem.className = 'text-slate-500';
  }
}

// Load Preset
function loadPreset(index) {
  const input = document.getElementById('tender-input');
  input.value = PRESETS[index] || '';
  updateInputStats();
  runRecommendation();
}

// Run Recommendation
function runRecommendation() {
  const input = document.getElementById('tender-input');
  const text = input.value.trim();
  if (!text) {
    alert('Please enter a tender or product description.');
    input.focus();
    return;
  }

  const res = recommendStandards(text);
  lastResultText = res.formatted;
  currentRecommendedItems = res.items;

  // Toggle Empty state off
  document.getElementById('empty-state').classList.add('hidden');

  // Non-food notice
  const alertBox = document.getElementById('non-food-alert');
  if (res.isNonFood) {
    alertBox.classList.remove('hidden');
  } else {
    alertBox.classList.add('hidden');
  }

  // Update summary header
  const count = res.items.length;
  const highest = count ? res.items[0].match_pct : 0;
  const lowest = count ? res.items[count - 1].match_pct : 0;
  document.getElementById('results-summary-text').textContent = `${count} applicable standards identified • Match range: ${highest}% → ${lowest}%`;
  document.getElementById('match-count-badge').textContent = `${count} Standards Identified`;

  // Update Formatted Output Text
  document.getElementById('output-text').textContent = res.formatted;

  // Render Visual Cards arranged by percentage match
  renderCards(res.items);

  // Switch to active tab view
  const isFormattedActive = document.getElementById('tab-formatted').classList.contains('bg-white');
  if (isFormattedActive) {
    document.getElementById('content-formatted').classList.remove('hidden');
    document.getElementById('content-cards').classList.add('hidden');
  } else {
    document.getElementById('content-cards').classList.remove('hidden');
    document.getElementById('content-formatted').classList.add('hidden');
  }
}

// Render Visual Recommendation Cards (Sorted by Percentage Match)
function renderCards(items) {
  const container = document.getElementById('cards-container');
  container.innerHTML = '';

  if (!items.length) {
    container.innerHTML = '<div class="text-xs text-slate-500 py-8 text-center font-medium">No matching standards found in dataset for this description.</div>';
    return;
  }

  items.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-md transition space-y-3';

    // Percentage color styling
    let pctBadgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    let progressBg = 'bg-emerald-500';
    if (item.match_pct >= 90) {
      pctBadgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      progressBg = 'bg-emerald-600';
    } else if (item.match_pct >= 80) {
      pctBadgeClass = 'bg-blue-50 text-blue-800 border-blue-300';
      progressBg = 'bg-blue-600';
    } else {
      pctBadgeClass = 'bg-amber-50 text-amber-800 border-amber-300';
      progressBg = 'bg-amber-600';
    }

    // Category badge styling
    let catBadgeColor = 'bg-slate-100 text-slate-800 border-slate-200';
    if (item.category.includes('Dairy')) catBadgeColor = 'bg-amber-100/80 text-amber-900 border-amber-300';
    else if (item.category.includes('Cereals')) catBadgeColor = 'bg-emerald-100/80 text-emerald-900 border-emerald-300';
    else if (item.category.includes('Oils')) catBadgeColor = 'bg-yellow-100/80 text-yellow-900 border-yellow-300';
    else if (item.category.includes('Safety')) catBadgeColor = 'bg-rose-100/80 text-rose-900 border-rose-300';

    card.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="flex items-center justify-center w-5 h-5 rounded-full bg-gov-navy text-white text-[11px] font-mono font-bold">${idx + 1}</span>
          <span class="font-mono font-bold text-sm text-gov-navy bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-sm">${item.is_number}</span>
          <span class="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">${item.year}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border ${catBadgeColor}">${item.category}</span>
          <span class="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${pctBadgeClass}">
            ${item.match_pct}% Match
          </span>
        </div>
      </div>

      <!-- Match Progress Bar -->
      <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div class="${progressBg} h-1.5 rounded-full transition-all duration-500" style="width: ${item.match_pct}%"></div>
      </div>

      <h4 class="text-sm font-bold text-slate-900 leading-snug">${item.title}</h4>

      <p class="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
        <span class="font-semibold text-slate-800">Procurement Application:</span> ${getRationale(item)}
      </p>

      <div class="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
        <span class="font-mono">Authoritative Record #${item.sno} in BIS Dataset</span>
        <button onclick="copySingleStandard('${item.is_number}', '${item.year}', '${item.title.replace(/'/g, "\\'")}', '${item.match_pct}')" class="text-blue-700 hover:text-gov-navy font-semibold hover:underline flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          Copy Standard
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

// Switch between Ranked Cards and Formal Text Output tab
function switchTab(tab) {
  const btnCards = document.getElementById('tab-cards');
  const btnFormatted = document.getElementById('tab-formatted');
  const contentCards = document.getElementById('content-cards');
  const contentFormatted = document.getElementById('content-formatted');

  if (tab === 'cards') {
    btnCards.className = 'px-3 py-1 rounded-md bg-white text-slate-900 font-semibold shadow-sm transition';
    btnFormatted.className = 'px-3 py-1 rounded-md text-slate-600 hover:text-slate-900 transition';
    contentCards.classList.remove('hidden');
    contentFormatted.classList.add('hidden');
  } else {
    btnFormatted.className = 'px-3 py-1 rounded-md bg-white text-slate-900 font-semibold shadow-sm transition';
    btnCards.className = 'px-3 py-1 rounded-md text-slate-600 hover:text-slate-900 transition';
    contentFormatted.classList.remove('hidden');
    contentCards.classList.add('hidden');
  }
}

// Copy full formatted response
function copyFormattedResponse() {
  if (!lastResultText) return;
  navigator.clipboard.writeText(lastResultText).then(() => {
    showToast('Formal Standards List copied to clipboard!');
  }).catch(() => {
    showToast('Copied to clipboard!');
  });
}

// Copy single standard line
function copySingleStandard(isNum, year, title, pct) {
  const line = `is_number: ${isNum} | year: ${year} | title: ${title} | match: ${pct}%`;
  navigator.clipboard.writeText(line).then(() => {
    showToast(`Copied ${isNum}!`);
  });
}

// Export Results to CSV
function exportResultsCSV() {
  if (!currentRecommendedItems.length) {
    alert('No recommended standards to export.');
    return;
  }
  let csv = 'Rank,IS Number,Year,Title,Category,Match Percentage\n';
  currentRecommendedItems.forEach((it, idx) => {
    const escapedTitle = `"${it.title.replace(/"/g, '""')}"`;
    csv += `${idx + 1},"${it.is_number}","${it.year}",${escapedTitle},"${it.category}",${it.match_pct}%\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BIS_Recommended_Standards_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported CSV report!');
}

// Toast notification
function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-message').textContent = msg;
  toast.classList.remove('translate-y-20', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
    toast.classList.remove('translate-y-0', 'opacity-100');
  }, 2500);
}

// Dataset Explorer Filtering and Pagination
function filterCategory(cat) {
  currentCategory = cat;
  currentPage = 1;

  document.querySelectorAll('.cat-pill').forEach(btn => {
    if (btn.textContent.includes(cat) || (cat === 'All' && btn.textContent.includes('All'))) {
      btn.className = 'cat-pill px-3 py-1.5 rounded-lg bg-gov-navy text-white font-medium whitespace-nowrap transition';
    } else {
      btn.className = 'cat-pill px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium whitespace-nowrap transition';
    }
  });

  renderTable();
}

function getFilteredData() {
  const dataset = window.BIS_STANDARDS || [];
  return dataset.filter(item => {
    const matchCat = (currentCategory === 'All') || (item.category === currentCategory);
    if (!matchCat) return false;

    if (!searchQuery) return true;

    const query = searchQuery;
    const isNum = item.is_number.toLowerCase();
    const title = item.title.toLowerCase();
    const year = item.year.toString();

    return isNum.includes(query) || title.includes(query) || year.includes(query);
  });
}

function renderTable() {
  const filtered = getFilteredData();
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize) || 1;

  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const pageItems = filtered.slice(startIdx, endIdx);

  const tbody = document.getElementById('table-body');
  tbody.innerHTML = '';

  if (!pageItems.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-slate-400 font-medium">No standards found matching "${searchQuery}" in ${currentCategory}.</td></tr>`;
  } else {
    pageItems.forEach(item => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50/80 transition';
      tr.innerHTML = `
        <td class="py-2.5 px-3 font-mono text-slate-400">${item.sno}</td>
        <td class="py-2.5 px-3 font-mono font-bold text-gov-navy">${item.is_number}</td>
        <td class="py-2.5 px-3 font-mono text-slate-500">${item.year}</td>
        <td class="py-2.5 px-3 font-medium text-slate-800 leading-snug">${decodeHtml(item.title)}</td>
        <td class="py-2.5 px-3">
          <span class="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 whitespace-nowrap">
            ${item.category}
          </span>
        </td>
        <td class="py-2.5 px-3 text-right">
          <button onclick="useInTender('${item.is_number}', '${decodeHtml(item.title).replace(/'/g, "\\'")}')" class="text-xs font-semibold text-blue-700 hover:text-gov-navy hover:underline whitespace-nowrap">
            Select for Tender →
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Update Page Info
  document.getElementById('page-info').textContent = total > 0 
    ? `Showing ${startIdx + 1} to ${endIdx} of ${total.toLocaleString()} standards`
    : `0 standards found`;
  document.getElementById('current-page-num').textContent = `${currentPage} / ${totalPages}`;

  document.getElementById('btn-prev').disabled = (currentPage === 1);
  document.getElementById('btn-next').disabled = (currentPage === totalPages);
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderTable();
  }
}

function nextPage() {
  const filtered = getFilteredData();
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  if (currentPage < totalPages) {
    currentPage++;
    renderTable();
  }
}

// "Select for Tender" action from Table
function useInTender(isNum, title) {
  const tenderInput = document.getElementById('tender-input');
  tenderInput.value = `Procurement tender specification requiring conformance to Indian Standard for ${title} (${isNum}).`;
  updateInputStats();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  runRecommendation();
}
