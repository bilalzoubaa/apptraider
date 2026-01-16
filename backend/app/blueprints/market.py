from flask import Blueprint, jsonify, request
import requests
from bs4 import BeautifulSoup
import yfinance as yf
from ..services.price_service import PriceService

market_bp = Blueprint("market", __name__)

@market_bp.get("/price")
def price():
    symbol = request.args.get("symbol", "AAPL")
    price_val = PriceService.get_price(symbol)
    return jsonify({"symbol": symbol, "price": price_val})

@market_bp.get("/casablanca")
def casablanca():
    ticker = request.args.get("ticker", "IAM")
    url = "https://www.casablanca-bourse.com/bourseweb/indice-cours-entreprise.aspx?code=" + ticker
    r = requests.get(url, timeout=10)
    price = 0.0
    if r.status_code == 200:
        soup = BeautifulSoup(r.text, "html.parser")
        el = soup.find("span", {"id": "ctl00_Contenu_PlaceHolder_Contenu_lblCours"})
        if el and el.text:
            try:
                price = float(el.text.replace(",", "."))
            except:
                price = 0.0
    return jsonify({"ticker": ticker, "price": price})

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
