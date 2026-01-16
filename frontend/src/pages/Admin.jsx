import React, { useEffect, useState } from "react";
import axios from "axios";

// Service API layer for Admin
const AdminService = {
  getChallenges: async (adminKey) => {
    try {
      console.log("Fetching challenges with admin key...");
      const res = await axios.get("/api/admin/challenges", {
        headers: { 'X-ADMIN-KEY': adminKey }
      });
      console.log("Admin API Response:", res.data);
      return res.data;
    } catch (err) {
      console.error("Admin API Error (getChallenges):", err.response?.data || err.message);
      throw err;
    }
  },
  updateChallengeStatus: async (id, status, adminKey) => {
    try {
      const res = await axios.post(`/api/admin/challenge/${id}/status`, { status }, {
        headers: { 'X-ADMIN-KEY': adminKey }
      });
      return res.data;
    } catch (err) {
      console.error("Admin API Error (updateStatus):", err.response?.data || err.message);
      throw err;
    }
  }
};

export default function Admin() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adminKey, setAdminKey] = useState(localStorage.getItem('admin_key') || "");
  const [error, setError] = useState(null);
  const [dbMessage, setDbMessage] = useState("");

  const loadData = async () => {
    if (!adminKey) return;
    setLoading(true);
    setError(null);
    try {
      const data = await AdminService.getChallenges(adminKey);
      setChallenges(data.items || []);
      setDbMessage(data.message || "");
      localStorage.setItem('admin_key', adminKey);
    } catch (err) {
      setError("Unauthorized or server error. Check the console and your Admin Key.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminKey) loadData();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await AdminService.updateChallengeStatus(id, status, adminKey);
      await loadData();
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.error || err.message));
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    loadData();
  };

  if (!adminKey || error) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-bold mb-4">Admin Access</h2>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 text-sm rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="Enter Admin Key"
            className="w-full px-4 py-2 rounded mb-4 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
            value={adminKey}
            onChange={e => setAdminKey(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-colors disabled:opacity-50"
          >
            {loading ? "Checking..." : "Access Dashboard"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="py-10 max-w-6xl mx-auto px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold">Admin Panel</h2>
          <p className="text-xs text-gray-500 mt-1">Manage user challenges and accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={() => { localStorage.removeItem('admin_key'); setAdminKey(""); setChallenges([]); }}
            className="text-xs text-red-500 hover:underline"
          >
            Logout Admin
          </button>
        </div>
      </div>

      {loading && challenges.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Loading challenge data...</p>
        </div>
      ) : challenges.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-gray-500 font-medium">No challenges found</p>
          <p className="text-xs text-gray-400 mt-1">{dbMessage || "The database appears to be empty."}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">User Email</th>
                  <th className="px-6 py-4">Challenge Plan</th>
                  <th className="px-6 py-4">Current Equity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {challenges.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{c.user}</td>
                    <td className="px-6 py-4">{c.plan}</td>
                    <td className="px-6 py-4 font-mono font-semibold">${c.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${c.status === 'active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                          c.status === 'passed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleUpdateStatus(c.id, 'passed')}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded font-semibold transition-all shadow-sm shadow-green-600/20"
                      >
                        Pass
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(c.id, 'failed')}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded font-semibold transition-all shadow-sm shadow-red-600/20"
                      >
                        Fail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400 text-right uppercase tracking-widest font-bold">
            {challenges.length} Records Found
          </div>
        </div>
      )}
    </div>
  );
}
