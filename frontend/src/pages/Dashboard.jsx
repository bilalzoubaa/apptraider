import React, { useEffect, useRef, useState, useContext } from "react";
import axios from "axios";
import { createChart } from "lightweight-charts";
import { UserContext } from "../context/UserContext";
import { useTranslation } from "react-i18next";

const STATUS_CONFIG = {
  active: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", labelKey: "active" },
  failed: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", labelKey: "failed" },
  passed: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", labelKey: "passed" },
  none: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-500", labelKey: "inactif" }
};

const TICKERS = {
  US: ["AAPL", "TSLA", "MSFT", "GOOGL", "AMZN"],
  Crypto: ["BTC-USD", "ETH-USD", "BNB-USD", "SOL-USD"],
  Maroc: ["IAM", "ATW", "BCP", "LXV", "SID"]
};

export default function Dashboard() {
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const { t } = useTranslation();
  const [symbol, setSymbol] = useState("AAPL");
  const [price, setPrice] = useState(null);
  const [signals, setSignals] = useState([]);
  const [market, setMarket] = useState("US");
  const [status, setStatus] = useState(null);
  const [startingBalance, setStartingBalance] = useState(null);
  const [equity, setEquity] = useState(null);
  const [priceError, setPriceError] = useState(null);
  const [profitTargetPct, setProfitTargetPct] = useState(10);
  const [maxDailyLossPct, setMaxDailyLossPct] = useState(5);
  const [maxTotalLossPct, setMaxTotalLossPct] = useState(10);
  const [trades, setTrades] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [notification, setNotification] = useState(null);
  const [priceSource, setPriceSource] = useState("Yahoo");
  const [dailyLossPct, setDailyLossPct] = useState(0);
  const [totalLossPct, setTotalLossPct] = useState(0);
  const [profitPct, setProfitPct] = useState(0);

  const { challengeId } = useContext(UserContext);

  const showToast = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const computeSimpleAction = (prevPrice, currentPrice) => {
    if (currentPrice > prevPrice) return "BUY";
    if (currentPrice < prevPrice) return "SELL";
    return "HOLD";
  };

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const chart = createChart(el, {
      width: el.clientWidth,
      height: 350,
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#e5e7eb' }, // lighter grid for lightmode, dark mode handled via css usually or config
        horzLines: { color: '#e5e7eb' },
      },
      crosshair: {
        mode: 1, // CrosshairMode.Normal
      },
      rightPriceScale: {
        borderColor: '#d1d5db',
      },
      timeScale: {
        borderColor: '#d1d5db',
      },
    });

    // Check dark mode for better chart config - simplistic check
    if (document.documentElement.classList.contains('dark')) {
      chart.applyOptions({
        layout: { textColor: '#9ca3af' },
        grid: { vertLines: { color: '#374151' }, horzLines: { color: '#374151' } },
        rightPriceScale: { borderColor: '#4b5563' },
        timeScale: { borderColor: '#4b5563' },
      });
    }

    const series = chart.addLineSeries({
      color: '#2563eb',
      lineWidth: 2,
    });
    seriesRef.current = series;

    const handle = () => chart.applyOptions({ width: el.clientWidth });
    window.addEventListener("resize", handle);
    return () => {
      window.removeEventListener("resize", handle);
      chart.remove();
    };
  }, []); // Re-init if dark mode changes isn't handled here perfectly but 'good enough' for now.

  const fetchPrice = async () => {
    setLoadingPrice(true);
    try {
      let p = 0;
      let source = "Yahoo Finance";
      let error = null;

      if (market === "Maroc") {
        const r = await axios.get("/api/market/maroc/price", { params: { symbol } });
        p = r.data.price;
        source = r.data.source || "Casablanca (Scraper)";
        if (r.data.warning === "SCRAPE_FAILED_USED_CACHE") {
          error = "Mode dégradé : Live indisponible (Prix en cache)";
        }
      } else {
        const r = await axios.get("/api/market/price", { params: { symbol } });
        p = r.data.price;
        source = market === "Crypto" ? "Binance/Crypto" : "Yahoo Finance";
      }

      setPriceError(error);
      setPrice(p);
      setPriceSource(source);
      setLastUpdated(new Date());

      const t = Math.floor(Date.now() / 1000);
      seriesRef.current?.update({ time: t, value: p });
      updateSignals(p, t);
    } catch (err) {
      console.error("Erreur récupération prix:", err);
      setPriceError(market === "Maroc" ? "Live IAM indisponible" : "Serveur déconnecté");
    } finally {
      setLoadingPrice(false);
    }
  };

  const fetchSummary = async () => {
    if (!challengeId) return;
    try {
      const summary = await axios.get("/api/trades/summary", { params: { user_challenge_id: challengeId } });
      setStatus(summary.data.status);
      setEquity(summary.data.equity);
      setStartingBalance(summary.data.starting_balance);
      setProfitTargetPct(summary.data.profit_target_pct);
      setMaxDailyLossPct(summary.data.max_daily_loss_pct);
      setMaxTotalLossPct(summary.data.max_total_loss_pct);
      setDailyLossPct(summary.data.daily_loss_pct);
      setTotalLossPct(summary.data.total_loss_pct);
      setProfitPct(summary.data.profit_pct);
      setTrades(summary.data.trades || []);
    } catch (err) {
      console.error("Erreur sync challenge:", err);
    }
  };

  useEffect(() => {
    fetchPrice(); // Initial fetch
    fetchSummary();

    const priceIv = setInterval(fetchPrice, 30000); // 30s polling for price
    const summaryIv = setInterval(fetchSummary, 10000); // 10s for summary

    return () => {
      clearInterval(priceIv);
      clearInterval(summaryIv);
    };
  }, [symbol, market, challengeId]);

  const updateSignals = (p, t) => {
    const lastPrice = signals.at(-1)?.price ?? p;
    const action = computeSimpleAction(lastPrice, p);
    setSignals(s => [...s.slice(-20), { time: t, ts: new Date().toLocaleTimeString(), price: p, action }]);
  };

  useEffect(() => {
    const markers = signals
      .slice(-50)
      .filter(s => s.action === "BUY" || s.action === "SELL")
      .map(s => ({
        time: s.time,
        position: s.action === "BUY" ? "belowBar" : "aboveBar",
        color: s.action === "BUY" ? "#16a34a" : "#dc2626",
        shape: s.action === "BUY" ? "arrowUp" : "arrowDown",
        text: s.action
      }));
    seriesRef.current?.setMarkers(markers);
  }, [signals]);

  const postTrade = async (side) => {
    if (!challengeId) return showToast("error", "Veuillez acheter un challenge pour commencer.");
    if (price == null || priceError) return showToast("error", "Prix indisponible, réessayez plus tard");
    if (quantity <= 0) return showToast("error", "La quantité doit être supérieure à 0");

    try {
      await axios.post("/api/trades/execute", { user_challenge_id: challengeId, symbol, side, quantity, price });
      // Refresh immediate
      await fetchSummary();
      showToast("success", `Ordre ${side.toUpperCase()} de ${quantity} ${symbol} exécuté !`);
    } catch (err) {
      showToast("error", "Échec de l'exécution de l'ordre");
    }
  };

  const nearDailyLimit = dailyLossPct >= (maxDailyLossPct * 0.8);
  const nearTotalLimit = totalLossPct >= (maxTotalLossPct * 0.8);

  const statusInfo = STATUS_CONFIG[status] || STATUS_CONFIG.none;

  return (
    <div className="relative pb-10">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-20 right-5 z-50 px-4 py-3 rounded shadow-lg animate-fade-in text-white ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('observation_mode')}
          </p>
        </div>

        {/* Market Selector & User Status */}
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded text-xs font-bold tracking-wider ${statusInfo.bg} ${statusInfo.text}`}>
            {t(statusInfo.labelKey)}
          </div>
          {challengeId && (
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {t('equity')}: <span className="text-gray-900 dark:text-white">${equity?.toFixed(2)}</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart & Controls Area */}
        <div className="lg:col-span-2 space-y-6">

          {/* Control Bar */}
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-3 items-center">
              <select
                className="px-3 py-2 rounded focus:ring-2 focus:ring-brand outline-none border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                value={market}
                onChange={e => { setMarket(e.target.value); setSymbol(TICKERS[e.target.value][0]); }}
              >
                <option value="US">🇺🇸 US Market</option>
                <option value="Crypto">₿ Crypto</option>
                <option value="Maroc">🇲🇦 Casablanca</option>
              </select>

              <select
                className="px-3 py-2 rounded focus:ring-2 focus:ring-brand outline-none border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-semibold"
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
              >
                {TICKERS[market].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="flex gap-4 items-center ml-auto">
              <div className="text-right rtl:text-left">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {priceError ? <span className="text-red-500">{t('error')}</span> : (price ? `$${price.toFixed(2)}` : "...")}
                </div>
                <div className="text-xs text-gray-500">
                  {loadingPrice ? "..." : (lastUpdated ? `${t('last_updated')} ${lastUpdated.toLocaleTimeString()}` : "")} • {t('source')}: {priceSource}
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm relative group">
            {!challengeId && (
              <div className="absolute inset-0 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
                <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-lg text-center border border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium mb-2">{t('observation_mode')}</p>
                  <button onClick={() => window.location.href = '/pricing'} className="text-brand text-sm hover:underline font-semibold">{t('buy_challenge')}</button>
                </div>
              </div>
            )}
            <div ref={chartRef} className="w-full h-[350px]" />
          </div>

          {/* Order Entry */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">{t('execute_order')}</h3>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('quantity')}</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-brand outline-none"
                />
              </div>
              <button
                onClick={() => postTrade("buy")}
                disabled={loadingPrice || !price || !challengeId}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium disabled:opacity-50 transition-colors"
              >
                {t('buy')} {symbol}
              </button>
              <button
                onClick={() => postTrade("sell")}
                disabled={loadingPrice || !price || !challengeId}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium disabled:opacity-50 transition-colors"
              >
                {t('sell')} {symbol}
              </button>
            </div>
          </div>

          {/* Trades History */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <h3 className="text-sm font-semibold mb-4 text-gray-800 dark:text-white rtl:text-right">{t('recent_history')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left rtl:text-right">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-left rtl:text-right font-medium">{t('trader')}</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-right rtl:text-left">{t('quantity')}</th>
                    <th className="px-4 py-3 text-right rtl:text-left">Prix</th>
                    <th className="px-4 py-3 text-right rtl:text-left">PnL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {trades.length === 0 ? (
                    <tr><td colSpan="6" className="px-4 py-4 text-center text-gray-500">...</td></tr>
                  ) : trades.slice(0, 10).map(t => (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {new Date(t.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 font-medium">{t.symbol}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${t.side === 'buy' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                          {t.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{t.quantity}</td>
                      <td className="px-4 py-3 text-right">${t.price.toFixed(2)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${!t.pnl ? 'text-gray-500' : t.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {t.pnl ? `${t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Sidebar Status */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-semibold mb-4 rtl:text-right">{t('challenge')}</h3>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span>{t('profit_target')}</span>
                <span className="font-medium text-green-600">{profitPct.toFixed(1)}% / {profitTargetPct}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div className="bg-green-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, (profitPct / profitTargetPct) * 100))}%` }}></div>
              </div>
            </div>

            <div className="space-y-4">
              <div className={`p-3 rounded-lg border ${nearDailyLimit ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-gray-50 border-gray-100 dark:bg-gray-800 dark:border-gray-700'}`}>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{t('daily_loss')}</span>
                  <span className={`font-mono ${nearDailyLimit ? 'text-red-600 font-bold' : ''}`}>-{dailyLossPct.toFixed(2)}% <span className="text-gray-400 text-xs">/ {maxDailyLossPct}%</span></span>
                </div>
              </div>

              <div className={`p-3 rounded-lg border ${nearTotalLimit ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-gray-50 border-gray-100 dark:bg-gray-800 dark:border-gray-700'}`}>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{t('total_loss')}</span>
                  <span className={`font-mono ${nearTotalLimit ? 'text-red-600 font-bold' : ''}`}>-{totalLossPct.toFixed(2)}% <span className="text-gray-400 text-xs">/ {maxTotalLossPct}%</span></span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">{t('starting_balance')}</span>
                <span className="font-mono text-gray-900 dark:text-white">${startingBalance?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* AI Signals */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-semibold rtl:text-right">Signaux IA</h3>
              <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {signals.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">...</div>
              ) : (
                [...signals].reverse().slice(0, 8).map((s, i) => (
                  <div key={i} className="flex justify-between items-center p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm">
                    <span className="text-gray-400 text-xs">{s.ts}</span>
                    <span className="font-medium">{s.price.toFixed(2)}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${s.action === "BUY" ? "bg-green-100 text-green-700" : s.action === "SELL" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                      {s.action}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
