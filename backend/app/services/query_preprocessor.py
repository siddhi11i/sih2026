import re
import html
from typing import Dict, Tuple, List, Set

HINGLISH_TRANSLITERATION_MAP = {
    "doodh": "milk dairy",
    "dudh": "milk dairy",
    "doodha": "milk dairy",
    "paschurised": "pasteurized",
    "pasteurised": "pasteurized",
    "toned": "toned",
    "skimmed": "skimmed",
    "powder": "powder",
    "gehu": "wheat foodgrain",
    "gehun": "wheat foodgrain",
    "chawal": "rice parboiled grain",
    "tandul": "rice grain",
    "tel": "oil edible",
    "tail": "oil edible",
    "surajmukhi": "sunflower edible oil",
    "sarson": "mustard edible oil",
    "godam": "godown storage silo",
    "godavare": "godown storage",
    "khareedna": "procurement purchase",
    "kharedi": "procurement purchase",
    "purvatha": "supply procurement",
    "aapoorti": "supply procurement",
    "makka": "maize starch corn flour",
    "maka": "maize starch corn flour",
    "atta": "wheat flour atta",
    "suji": "semolina suji",
    "maida": "refined wheat flour maida",
    "mawa": "khoa traditional dairy",
    "khoya": "khoa traditional dairy",
    "chhana": "chhana paneer dairy",
    "chana": "chhana gram",
    "paneer": "paneer cheese dairy",
    "dal": "pulses dal cereals",
    "daal": "pulses dal cereals",
    "kadhanaya": "pulses dal",
    "dhanya": "grain cereal storage",
    "anaj": "grain cereal foodgrain",
    "shrikhand": "shrikhand traditional dairy",
    "dahi": "curd dahi yoghurt",
    "kulfi": "kulfi ice cream",
    "traktor": "tractor agricultural safety rops",
    "tractor": "tractor agricultural safety rops",
    "machinery": "equipment agricultural",
    "rops": "roll over protective structures rops dynamic static test",
    "undir": "rodent post harvest grain loss",
    "chooha": "rodent post harvest grain loss",
    "choha": "rodent post harvest grain loss",
    "kitak": "pest insect control",
    "keeda": "pest insect control",
    "keetnashak": "pesticide organochlorine",
    "swachhata": "hygiene sanitation food safety",
    "suraksha": "safety protection",
    "manak": "standard specification",
    "manake": "standards specifications",
    "gunvatta": "quality specification",
    "tapasani": "testing examination analysis",
    "parikshan": "testing examination analysis",
    "whol": "whole milk powder",
    "powdr": "powder",
    "packagng": "packaging packing",
    "complianc": "compliance specification",
    "edibl": "edible maize starch",
    "maiz": "maize starch",
    "strch": "starch corn flour",
    "cornflour": "corn flour maize starch",
    "salmonela": "salmonella microbiology pathogen",
    "coliform": "coliform mesophilic bacteria",
    "aflatoksin": "aflatoxin pathogen",
    "pesticid": "pesticide residues gas chromatographic"
}

INDIC_KEYWORD_PATTERNS = [
    # Milk & Dairy across languages
    (r'(दूध|दुग्ध|दही|पनीर|मावा|खोया|श्रीखंड|पाश्चुरीकृत|पाश्चराइज्ड|टोंड|स्किम्ड)', 'pasteurized milk toned skimmed powder dairy product'),
    (r'(பால்|தயிர|பன்னீர்|வெண்ணெய்|நெய்|பதப்படுத்தப்பட்ட)', 'pasteurized milk toned skimmed powder dairy product'),
    (r'(పాలు|పాల|పెరుగు|పన్నీర్|వెన్న|నెయ్యి|పాశ్చరైజ్డ్)', 'pasteurized milk toned skimmed powder dairy product'),
    (r'(দুধ|দুধের|দই|পনির|মাখন|ঘি|পাস্তুরিত)', 'pasteurized milk toned skimmed powder dairy product'),
    (r'(દૂધ|દહીં|પનીર|માખણ|ઘી|પાશ્ચરાઇઝ્ડ)', 'pasteurized milk toned skimmed powder dairy product'),
    (r'(ಹಾಲು|ಹಾಲಿನ|ಮೊಸರು|ಪನ್ನೀರ್|ಬೆಣ್ಣೆ|ತುಪ್ಪ|ಪಾಶ್ಚರೀಕರಿಸಿದ)', 'pasteurized milk toned skimmed powder dairy product'),

    # Powder & Milk powder
    (r'(पावडर|पाउडर|தூள்|பவுடர்|పొడి|গুঁড়ো|গুঁড়ো|પાવડર|ಪುಡಿ)', 'whole milk powder skimmed milk powder'),

    # Edible Oils & Vanaspati
    (r'(तेल|सूरजमुखी|सरसों|तिल|सोयाबीन|वनस्पति)', 'refined edible sunflower mustard oil vanaspati tins'),
    (r'(எண்ணெய்|சூரியகாந்தி|கடுகு|வனஸ்பதி)', 'refined edible sunflower mustard oil vanaspati tins'),
    (r'(నూనె|సూర్యకాంతి|ఆవాలు|వనస్పతి)', 'refined edible sunflower mustard oil vanaspati tins'),
    (r'(তেল|সূর্যমুখী|সরিষা|বনস্পতি)', 'refined edible sunflower mustard oil vanaspati tins'),
    (r'(તેલ|સૂર્યમુખી|રાઈ|વનસ્પતિ)', 'refined edible sunflower mustard oil vanaspati tins'),
    (r'(ಎಣ್ಣೆ|ಸೂರ್ಯಕಾಂತಿ|ಸಾಸಿವೆ|ವನಸ್ಪತಿ)', 'refined edible sunflower mustard oil vanaspati tins'),

    # Grains, Cereals, Rice, Wheat, Pulses & Silo Storage
    (r'(गेहूं|चावल|धान|अनाज|धान्य|कडधान्य|दाल|भंडारण|गोदाम|साइलो|साठवणूक)', 'wheat rice parboiled grain pulses silo godown storage bulk'),
    (r'(கோதுமை|அரிசி|நெல்|தானிய|பருப்பு|சேமிப்பு|கிடங்கு)', 'wheat rice parboiled grain pulses silo godown storage bulk'),
    (r'(గోధుమలు|వరి|బియ్యం|ధాన్యం|పప్పు|నిల్వ|గోడౌన్)', 'wheat rice parboiled grain pulses silo godown storage bulk'),
    (r'(গম|চাল|ধান|শস্য|ডাল|সংরক্ষণ|গুদাম)', 'wheat rice parboiled grain pulses silo godown storage bulk'),
    (r'(ઘઉં|ચોખા|ડાંગર|અનાજ|દાળ|સંગ્રહ|ગોદામ)', 'wheat rice parboiled grain pulses silo godown storage bulk'),
    (r'(ಗೋಧಿ|ಅಕ್ಕಿ|ಭತ್ತ|ಧಾನ್ಯ|ಬೇಳೆ|ಸಂಗ್ರಹಣೆ|ಗೋದಾಮು)', 'wheat rice parboiled grain pulses silo godown storage bulk'),

    # Starch & Corn flour
    (r'(मका|स्टार्च|फ्लोअर|कॉर्नफ्लोर|காளான்|మొక్కజొన్న|ভুট্টা|મકાઈ|ಮೆಕ್ಕೆಜೋಳ)', 'edible maize starch corn flour'),

    # Sugar, Jaggery, Gur
    (r'(चीनी|शक्कर|गुड़|சர்க்கரை|வெல்லம்|చక్కెర|బెల్లం|চিনি|গুড়|ખાંડ|ગોળ|ಸಕ್ಕರೆ|ಬೆಲ್ಲ)', 'sugar refined white jaggery gur confectionery'),

    # Microbiological Testing, Pathogens & Food Safety across languages
    (r'(सूक्ष्मजीव|जीवाणु|साल्मोनेला|स्वच्छता|परीक्षण|तपासणी|चाचणी)', 'microbiological food safety pathogen salmonella coliform testing hygiene audit'),
    (r'(நுண்ணுயிரியல்|பாக்டீரியா|பரிசோதனை|பாதுகாப்பு)', 'microbiological food safety pathogen salmonella coliform testing hygiene audit'),
    (r'(మైక్రోబయోలాజికల్|బాక్టీరియా|పరీక్ష|భద్రత)', 'microbiological food safety pathogen salmonella coliform testing hygiene audit'),
    (r'(জীবাণু|অণুজীব|ব্যাকটেরিয়া|পরীক্ষা|নিরাপত্তা)', 'microbiological food safety pathogen salmonella coliform testing hygiene audit'),
    (r'(માઇક્રોબાયોલોજી|બેક્ટેરિયા|પરીક્ષણ|સલામતી)', 'microbiological food safety pathogen salmonella coliform testing hygiene audit'),
    (r'(ಸೂಕ್ಷ್ಮಜೀವವಿಜ್ಞಾನ|ಬ್ಯಾಕ್ಟೀರಿಯಾ|ಪರೀಕ್ಷೆ|ಸುರಕ್ಷತೆ)', 'microbiological food safety pathogen salmonella coliform testing hygiene audit'),

    # Procurement & Supply terms
    (r'(आपूर्ति|खरीद|खरेदी|पुरवठा|கொள்முதல்|வழங்கல்|సేకరణ|సరఫరా|সংগ্রহ|সরবরাহ|ખરીદી|પુરવઠો|ಖರೀದಿ|ಸರಬರಾಜು)', 'procurement supply specification schedule tender')
]

SYNONYMS = {
    "smp": "skimmed milk powder",
    "wmp": "whole milk powder",
    "pds": "public distribution system ration",
    "fci": "food corporation godown silo storage",
    "mid day meal": "school child nutrition meal complementary",
    "mdm": "school meals program nutrition",
    "rops": "roll over protective structures static dynamic test",
    "haccp": "hazard analysis critical control point food safety hygiene"
}

def detect_language(text: str) -> str:
    """Detects primary language: hi, mr, ta, te, bn, gu, kn, hinglish, or en."""
    # Tamil Unicode block: 0B80 - 0BFF
    if any('\u0B80' <= char <= '\u0BFF' for char in text):
        return "ta"
    # Telugu Unicode block: 0C00 - 0C7F
    if any('\u0C00' <= char <= '\u0C7F' for char in text):
        return "te"
    # Bengali Unicode block: 0980 - 09FF
    if any('\u0980' <= char <= '\u09FF' for char in text):
        return "bn"
    # Gujarati Unicode block: 0A80 - 0AFF
    if any('\u0A80' <= char <= '\u0AFF' for char in text):
        return "gu"
    # Kannada Unicode block: 0C80 - 0CFF
    if any('\u0C80' <= char <= '\u0CFF' for char in text):
        return "kn"
    # Devanagari Unicode block: 0900 - 097F
    if any('\u0900' <= char <= '\u097F' for char in text):
        marathi_markers = {"आणि", "कडधान्य", "साठवणूक", "पुरवठा", "खरेदी", "तपासणी", "चाचणी", "उंदीर", "गव्हाचे", "शालेय"}
        words = set(text.split())
        if any(m in words or m in text for m in marathi_markers):
            return "mr"
        return "hi"
    
    # Check for Hinglish / Romanized
    tokens = set(re.findall(r'\b[a-zA-Z]+\b', text.lower()))
    hinglish_hits = sum(1 for t in tokens if t in HINGLISH_TRANSLITERATION_MAP)
    if hinglish_hits >= 2 or (hinglish_hits >= 1 and len(tokens) <= 5):
        return "hinglish"
    
    return "en"

def clean_and_normalize_query(query: str) -> Tuple[str, str, List[str]]:
    """
    Cleans, corrects spelling, normalizes transliterations & multi-lingual Indic terms,
    and returns (cleaned_query, detected_language, expanded_keywords).
    """
    raw = html.unescape(query).strip()
    detected_lang = detect_language(raw)
    
    # Expand acronyms
    q_lower = raw.lower()
    for acr, expansion in SYNONYMS.items():
        pattern = r'\b' + re.escape(acr) + r'\b'
        q_lower = re.sub(pattern, expansion, q_lower)
        
    cleaned_tokens = []
    
    # Check Indic languages via Regex Pattern Matching
    if detected_lang in {"hi", "mr", "ta", "te", "bn", "gu", "kn"}:
        translated_expansions = []
        for pattern, english_kw in INDIC_KEYWORD_PATTERNS:
            if re.search(pattern, raw):
                translated_expansions.append(english_kw)
        
        # Also preserve any alphanumeric codes (e.g. IS numbers like 1165, 1005)
        codes = re.findall(r'\b(?:IS\s*)?\d{3,5}(?::\d{4})?\b|[a-zA-Z0-9]+', raw, re.IGNORECASE)
        for c in codes:
            if re.match(r'^\d{3,5}$', c) or re.match(r'^IS\s*\d+', c, re.I):
                translated_expansions.append(c)

        if not translated_expansions:
            # Fallback if no specific keywords matched
            translated_expansions.append("food dairy agricultural specification standard")
            
        cleaned_text = " ".join(translated_expansions)
        return cleaned_text, detected_lang, translated_expansions

    # Process English / Hinglish
    tokens = re.findall(r'\b[a-zA-Z0-9_:-]+\b', q_lower)
    for tok in tokens:
        if tok in HINGLISH_TRANSLITERATION_MAP:
            cleaned_tokens.append(HINGLISH_TRANSLITERATION_MAP[tok])
        else:
            cleaned_tokens.append(tok)
            
    cleaned_text = " ".join(cleaned_tokens)
    return cleaned_text, detected_lang, cleaned_tokens
