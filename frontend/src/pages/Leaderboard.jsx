import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Leaderboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [error, setError] = useState(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filterDate) params.month = filterDate;
      const res = await axios.get("/api/leaderboard/top10", { params });
      // Ensure data is an array
      if (Array.isArray(res.data)) {
        setData(res.data);
      } else {
        console.warn("API did not return an array", res.data);
        setData([]);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard", err);
      setError("Impossible de charger le classement. Veuillez réessayer plus tard.");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Default to current month if not set, or just let backend handle default
    fetchLeaderboard();
  }, [filterDate]);

  const getRankBadge = (rank) => {
    if (rank === 1) return <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-400 text-white font-bold shadow-lg">1</span>;
    if (rank === 2) return <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-300 text-gray-700 font-bold shadow-lg">2</span>;
    if (rank === 3) return <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-600 text-white font-bold shadow-lg">3</span>;
    return <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 font-bold">{rank}</span>;
  };

  return (
    <div className="py-10 max-w-5xl mx-auto px-4">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Top Traders du Mois</h2>
        <p className="text-gray-500 dark:text-gray-400">Classement basé sur le pourcentage de profit réalisé.</p>

        <div className="mt-6 flex justify-center">
          <input
            type="month"
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rang</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trader</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">% Profit</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">PnL Total ($)</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nb. Trades</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">Chargement du classement...</td></tr>
              ) : error ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-red-500">{error}</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">Aucune donnée pour cette période.</td></tr>
              ) : (
                data.map((row) => (
                  <tr key={row.rank} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRankBadge(row.rank)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                          {(row.user_name || "?").charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{row.user_name || "Utilisateur inconnu"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(row.profit_percent || 0) >= 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800'}`}>
                        {(row.profit_percent || 0) > 0 ? '+' : ''}{row.profit_percent || 0}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-700 dark:text-gray-300">
                      ${(row.total_pnl || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500 dark:text-gray-400">
                      {row.trades_count || 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
