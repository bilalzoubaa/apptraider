import yfinance as yf
import random
from typing import Dict, Tuple, Optional
from datetime import datetime, timedelta

class PriceService:
    _cache: Dict[str, Tuple[float, datetime]] = {}
    _simulated_base: Dict[str, float] = {}
    CACHE_DURATION = timedelta(seconds=10)

    @classmethod
    def get_price(cls, symbol: str) -> float:
        """
        Get the current price for a symbol.
        Priority:
        1. Cache (valid for 10s)
        2. Real market data (yfinance)
        3. Simulation fallback
        """
        now = datetime.utcnow()
        
        # 1. Check Cache
        if symbol in cls._cache:
            price, timestamp = cls._cache[symbol]
            if now - timestamp < cls.CACHE_DURATION:
                return price

        # 2. Try Real Market Data
        try:
            # Optimize: use '1d' period and just get the last close if market is closed, or real-time if open.
            # yfinance history is blocking, so we accept the latency here.
            ticker = yf.Ticker(symbol)
            # fast_info is often faster/more reliable for current price if available
            price = None
            
            # Try fast_info first (newer yfinance versions)
            try:
                if hasattr(ticker, 'fast_info'):
                    last_price = ticker.fast_info.last_price
                    if last_price and last_price > 0:
                        price = float(last_price)
            except:
                pass

            # Fallback to history if fast_info failed
            if price is None:
                data = ticker.history(period="1d", interval="1m")
                if not data.empty:
                    val = data["Close"].iloc[-1]
                    if val > 0:
                        price = float(val)

            if price and price > 0:
                # Update cache and simulation base (so if we switch to sim later, it starts from here)
                cls._cache[symbol] = (price, now)
                cls._simulated_base[symbol] = price
                return price

        except Exception as e:
            # Log error if needed, but we proceed to fallback
            print(f"PriceService error for {symbol}: {e}")

        # 3. Simulation Fallback
        return cls._get_simulated_price(symbol)

    @classmethod
    def _get_simulated_price(cls, symbol: str) -> float:
        """
        Generates a simulated price based on random walk from the last known price.
        """
        # Default bases if we've never seen a real price for this symbol
        defaults = {
            "AAPL": 190.0,
            "TSLA": 220.0,
            "NVDA": 500.0,
            "AMD": 110.0,
            "GOOG": 140.0,
            "MSFT": 370.0,
            "AMZN": 150.0,
            "EURUSD": 1.09,
            "GBPUSD": 1.27
        }
        
        base = cls._simulated_base.get(symbol) or defaults.get(symbol, 100.0)
        
        # Apply a random drift: -0.2% to +0.2%
        change_pct = random.uniform(-0.002, 0.002)
        new_price = base * (1 + change_pct)
        new_price = round(max(0.01, new_price), 2)
        
        # Update state
        cls._simulated_base[symbol] = new_price
        cls._cache[symbol] = (new_price, datetime.utcnow())
        
        return new_price

    @classmethod
    def get_prices(cls, symbols: list[str]) -> Dict[str, float]:
        """
        Batch get prices (could be optimized, for now sequential).
        """
        return {s: cls.get_price(s) for s in symbols}
