from flask import Blueprint, jsonify, request
import requests
from bs4 import BeautifulSoup
import yfinance as yf
from ..services.price_service import PriceService

from datetime import datetime

market_bp = Blueprint("market", __name__)

# Mapping between Tickers and BVC internal codes if necessary, or just using the symbol
BVC_MAPPING = {
    "IAM": "IAM",
    "ATW": "ATW",
    "BCP": "BCP",
    "LXV": "LXV",
    "SID": "SID"
}

# In-memory cache for last known prices
last_known_maroc_prices = {}

@market_bp.get("/price")
def price():
    symbol = request.args.get("symbol", "AAPL")
    price_val = PriceService.get_price(symbol)
    return jsonify({"symbol": symbol, "price": price_val})

@market_bp.get("/maroc/price")
def maroc_price():
    symbol = request.args.get("symbol", "IAM").upper()
    ticker = BVC_MAPPING.get(symbol, symbol)
    url = f"https://www.casablanca-bourse.com/bourseweb/indice-cours-entreprise.aspx?code={ticker}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
    }

    print(f"[MAROC_SCRAPER] Fetching {symbol} from {url}")
    
    try:
        r = requests.get(url, timeout=10, headers=headers)
        print(f"[MAROC_SCRAPER] Status: {r.status_code}, HTML Length: {len(r.text)}")
        
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            
            # Strategy 1: Specific ID
            price_el = soup.find("span", {"id": "ctl00_Contenu_PlaceHolder_Contenu_lblCours"})
            
            # Strategy 2: Alternative IDs or classes
            if not price_el:
                price_el = soup.find("span", {"class": "val-closing"}) or soup.find("td", {"class": "val-closing"})
            
            # Strategy 3: Search by text label
            if not price_el:
                labels = soup.find_all(string=lambda t: "Cours" in t or "Dernier" in t)
                for label in labels:
                    val = label.parent.find_next("span") or label.parent.find_next("td")
                    if val and any(c.isdigit() for c in val.text):
                        price_el = val
                        break

            if price_el and price_el.text.strip():
                raw_text = price_el.text.strip()
                print(f"[MAROC_SCRAPER] Raw text: '{raw_text}'")
                
                # Robust cleaning
                clean_text = raw_text.replace(" ", "").replace("\xa0", "").replace(",", ".").upper()
                # Extract only numbers and dots
                clean_text = "".join(c for c in clean_text if c.isdigit() or c == ".")
                
                if clean_text:
                    try:
                        price = float(clean_text)
                        if price > 0:
                            last_known_maroc_prices[symbol] = price
                            return jsonify({
                                "symbol": symbol,
                                "price": price,
                                "source": "Casablanca (Scraper)",
                                "last_update": datetime.utcnow().isoformat()
                            })
                    except ValueError:
                        print(f"[MAROC_SCRAPER] Value conversion failed for '{clean_text}'")

        # Log snippet on failure
        snippet = r.text[:200].replace("\n", " ")
        print(f"[MAROC_SCRAPER] Parsing failed for {symbol}. Snippet: {snippet}")

    except Exception as e:
        print(f"[MAROC_SCRAPER] Request failed: {str(e)}")

    # Fallback to last known or simulation
    fallback_price = last_known_maroc_prices.get(symbol)
    if fallback_price:
        return jsonify({
            "symbol": symbol,
            "price": fallback_price,
            "source": "Casablanca (Cache)",
            "warning": "SCRAPE_FAILED_USED_CACHE"
        }), 200

    return jsonify({
        "error": "SCRAPE_FAILED",
        "details": f"Impossible de récupérer le prix live pour {symbol}",
        "symbol": symbol
    }), 502

@market_bp.get("/casablanca")
def casablanca_legacy():
    # Keep this for backward compatibility with existing FE calls if any remains
    return maroc_price()

@market_bp.get("/ai/signal")
def ai_signal():
    symbol = request.args.get("symbol", "AAPL")
    current_price = PriceService.get_price(symbol)
    
    try:
        data = yf.Ticker(symbol).history(period="30d")
    except Exception:
        data = None
        
    if data is None or data.empty:
        return jsonify({"symbol": symbol, "action": "HOLD", "confidence": 0, "ma20": current_price, "price": current_price})
        
    closes = data["Close"]
    ma20 = float(closes.tail(20).mean())
    
    if current_price > ma20:
        action = "BUY"
    elif current_price < ma20:
        action = "SELL"
    else:
        action = "HOLD"
    
    confidence = min(100, round(abs(current_price - ma20) / (ma20 or 1) * 100))
    return jsonify({"symbol": symbol, "action": action, "confidence": confidence, "ma20": ma20, "price": current_price})
