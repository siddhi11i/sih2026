#!/usr/bin/env python3
"""
Bureau of Indian Standards (BIS) — Standards Recommender Server
Food & Dairy Procurement Division • Government of India
Serves the web application and provides a JSON REST API for technical standards compliance.
"""

import http.server
import socketserver
import json
import os
import re
import html
import urllib.parse
import sys

PORT = int(os.environ.get("PORT", 8080))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "data", "standards.json")

# Load official BIS standards dataset
with open(DATA_FILE, "r", encoding="utf-8") as f:
    STANDARDS = json.load(f)

for s in STANDARDS:
    s['clean_title'] = html.unescape(s['title']).replace('&mdash;', '—').replace('&quot;', '"').replace('&apos;', "'")

COMMODITY_WEIGHTS = {
    # Dairy
    'milk': 20.0, 'pasteurized': 22.0, 'skimmed': 20.0, 'powder': 16.0, 'toned': 18.0,
    'butter': 18.0, 'ghee': 20.0, 'cheese': 18.0, 'paneer': 24.0, 'chhana': 24.0,
    'khoa': 24.0, 'shrikhand': 24.0, 'dahi': 18.0, 'curd': 16.0, 'yoghurt': 18.0,
    'kulfi': 16.0, 'ice cream': 16.0, 'condensed': 18.0, 'lactose': 16.0, 'casein': 18.0,
    'dairy': 14.0, 'lactometer': 16.0, 'whey': 15.0,
    # Grains & Cereals
    'wheat': 20.0, 'atta': 20.0, 'maida': 20.0, 'suji': 20.0, 'rice': 20.0,
    'paddy': 20.0, 'dal': 18.0, 'pulse': 18.0, 'pulses': 18.0, 'cereal': 15.0,
    'cereals': 15.0, 'grain': 15.0, 'foodgrain': 18.0, 'foodgrains': 18.0,
    'barley': 16.0, 'maize': 16.0, 'corn': 16.0, 'millet': 16.0, 'besan': 18.0,
    'sattu': 18.0, 'silo': 18.0, 'silos': 18.0, 'godown': 18.0, 'godowns': 18.0,
    # Oils & Sugar
    'sunflower': 22.0, 'mustard': 18.0, 'soybean': 18.0, 'groundnut': 18.0,
    'vanaspati': 24.0, 'palm': 16.0, 'palmolein': 16.0, 'edible oil': 20.0,
    'sugar': 18.0, 'jaggery': 18.0, 'gur': 18.0, 'shortening': 16.0,
    # Safety & Hygiene
    'salmonella': 22.0, 'coliform': 22.0, 'escherichia': 22.0, 'coli': 22.0,
    'pathogen': 18.0, 'haccp': 22.0, 'microbiology': 16.0, 'hygiene': 16.0,
    'aflatoxin': 18.0, 'pesticide': 16.0, 'drinking water': 18.0
}

STOPWORDS = {
    'the', 'and', 'for', 'with', 'from', 'this', 'that', 'these', 'those', 'are', 'was', 'were', 'will', 'shall',
    'been', 'have', 'has', 'had', 'supply', 'procurement', 'purchase', 'tender', 'delivery', 'bulk', 'distribution',
    'scheme', 'program', 'programs', 'state', 'central', 'department', 'corporation', 'unit', 'units', 'under',
    'food', 'products', 'product', 'common', 'system', 'quality', 'standard', 'standards', 'methods', 'method',
    'including', 'requirements', 'general', 'part'
}

FOOD_KEYWORDS = {
    'milk', 'dairy', 'butter', 'ghee', 'cheese', 'paneer', 'chhana', 'curd', 'dahi', 'yoghurt', 'kulfi', 'ice cream',
    'grain', 'cereal', 'pulse', 'pulses', 'wheat', 'rice', 'paddy', 'flour', 'atta', 'maida', 'dal', 'oil', 'fats',
    'vanaspati', 'sugar', 'jaggery', 'gur', 'food', 'foodstuff', 'food safety', 'microbiology', 'hygiene', 'storage',
    'godown', 'silo', 'drinking water', 'edible', 'bakery', 'confectionery', 'tea', 'coffee', 'spice', 'spices',
    'sweet', 'sweets', 'rasogolla', 'gulab jamun', 'shrikhand', 'khoa', 'cream'
}

NON_FOOD_TERMS = {
    'furniture', 'chair', 'table', 'desk', 'computer', 'laptop', 'software', 'hardware', 'printer', 'vehicle', 'car',
    'cement', 'steel', 'concrete', 'building', 'textile', 'clothing', 'garment', 'stationery', 'paper', 'office'
}

def is_food_related(query):
    tokens = set(re.findall(r'\b[a-zA-Z]+\b', query.lower()))
    food_hits = sum(1 for w in tokens if w in FOOD_KEYWORDS)
    non_food_hits = sum(1 for w in tokens if w in NON_FOOD_TERMS)
    if food_hits > 0:
        return True
    if non_food_hits > 0 and food_hits == 0:
        return False
    return True

def recommend_standards(tender_text):
    q_lower = tender_text.lower()
    q_tokens = re.findall(r'\b[a-z0-9]+\b', q_lower)
    is_food = is_food_related(tender_text)
    
    scored = []
    for s in STANDARDS:
        title_lower = s['clean_title'].lower()
        is_lower = s['is_number'].lower()
        score = 0.0
        
        # 1. Exact IS code
        for t in q_tokens:
            if len(t) >= 3 and t in is_lower:
                score += 150.0
                
        # 2. Commodity term matches
        for term, weight in COMMODITY_WEIGHTS.items():
            if term in q_lower and term in title_lower:
                score += weight * 4.5
                
        # 3. Subject match
        subject = re.split(r'[-—–]', s['clean_title'])[0].strip().lower()
        if len(subject) > 3 and subject in q_lower:
            score += 48.0
            
        # 4. Bigrams
        for i in range(len(q_tokens)-1):
            bi = f"{q_tokens[i]} {q_tokens[i+1]}"
            if len(bi) > 5 and bi in title_lower:
                score += 26.0
                
        # 5. Token overlap
        for w in q_tokens:
            if w not in STOPWORDS and len(w) > 2 and w in title_lower:
                score += 5.0
                
        # 6. Specification boost
        if 'specification' in title_lower:
            score += 10.0
            
        # 7. Category bonus
        if s['category'] in ['Milk & Dairy', 'Foodgrains, Cereals & Pulses', 'Edible Oils, Fats & Sugar', 'Food Safety, Microbiology & Hygiene']:
            score += 5.0
            
        # 8. Avoid bilingual duplicate in English searches
        if ('hindi' in is_lower or 'hindi' in title_lower) and 'hindi' not in q_lower:
            score *= 0.40
            
        # 9. Amendment penalty
        if s['is_amendment'] and 'amendment' not in q_lower:
            score *= 0.10
            
        # 10. Non-food fallback
        if not is_food:
            if 'hygiene' in title_lower or 'food safety' in title_lower or 'storage' in title_lower or 'code of practice' in title_lower:
                score += 30.0
            if s['category'] in ['Food Safety, Microbiology & Hygiene', 'Agricultural Equipment & Storage']:
                score += 15.0

        if score > 0:
            scored.append((score, s))
            
    if not scored:
        return {'formatted': 'No matching Indian Standards found.', 'standards': [], 'is_non_food': not is_food}

    # Sort descending by raw score
    scored.sort(key=lambda x: (x[0], int(x[1]['year']) if x[1]['year'].isdigit() else 0), reverse=True)
    top_score = scored[0][0]
    
    # Dynamically select all relevant standards and calculate percentage match
    recommended = []
    seen = set()
    for sc, item in scored:
        raw_pct = (sc / top_score) * 98
        match_pct = min(99, max(50, round(raw_pct)))
        
        if match_pct < 62 and len(recommended) >= 3:
            break
            
        base = re.split(r'[:(Amd]', item['is_number'])[0].strip()
        if base not in seen or len(seen) < 3 or sc > top_score * 0.75:
            recommended.append({
                'sno': item['sno'],
                'is_number': item['is_number'],
                'year': item['year'],
                'title': item['clean_title'],
                'category': item['category'],
                'match_pct': match_pct
            })
            seen.add(base)
            
        if len(recommended) >= 12:
            break
            
    # Arrange strictly according to percentage match in descending order
    recommended.sort(key=lambda x: (x['match_pct'], int(x['year']) if x['year'].isdigit() else 0), reverse=True)
            
    # Formal text format
    one_line = re.sub(r'\s+', ' ', tender_text).strip()
    lines = [
        f"Input tender: {one_line}",
        "",
        "Recommended standards (from dataset, arranged by percentage match):"
    ]
    for idx, r in enumerate(recommended, 1):
        lines.append(f"{idx}) is_number: {r['is_number']} | year: {r['year']} | title: {r['title']} | match: {r['match_pct']}%")
        
    lines.append("")
    if not is_food:
        lines.append("Note: The input appears to be unrelated to food or dairy. This portal is specialized in Food & Dairy procurement compliance, so general quality assurance and storage standards from the dataset have been displayed.")
        lines.append("")
        
    lines.append("Note: Recommended Indian Standards are curated from the official BIS repository to assist procurement authorities in technical compliance, quality assurance, and tender specification drafting.")
    
    return {
        'formatted': "\n".join(lines),
        'standards': recommended,
        'is_non_food': not is_food
    }

class RequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/recommend":
            params = urllib.parse.parse_qs(parsed.query)
            q = params.get("q", [""])[0]
            result = recommend_standards(q)
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(result, ensure_ascii=False, indent=2).encode("utf-8"))
            return
        elif parsed.path == "/api/standards":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(STANDARDS[:50], ensure_ascii=False).encode("utf-8"))
            return
        super().do_GET()

    def do_POST(self):
        if self.path == "/api/recommend":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8")
            try:
                data = json.loads(body)
                q = data.get("tender", "")
            except Exception:
                q = body
                
            result = recommend_standards(q)
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(result, ensure_ascii=False, indent=2).encode("utf-8"))
            return
        self.send_error(404, "Endpoint not found")

def run():
    server_address = ("", PORT)
    with socketserver.TCPServer(server_address, RequestHandler) as httpd:
        print(f"==================================================================")
        print(f" Bureau of Indian Standards (BIS) — Standards Recommender Server")
        print(f" Department of Consumer Affairs • Government of India")
        print(f" Active at: http://localhost:{PORT}")
        print(f" Ingested 3,144 Indian Standards (Food & Dairy Procurement)")
        print(f"==================================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer shutting down gracefully.")

if __name__ == "__main__":
    run()
