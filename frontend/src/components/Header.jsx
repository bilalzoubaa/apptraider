import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import { UserContext } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Header() {
  const { user, challengeId, logout } = useContext(UserContext);
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [equity, setEquity] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  useEffect(() => {
    // Initial RTL setting
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    let iv;
    const fetchEquity = async () => {
      if (!challengeId) return setEquity(null);
      try {
        const r = await axios.get("/api/trades/summary", { params: { user_challenge_id: challengeId } });
        setEquity(r.data.equity);
      } catch (e) {
        console.error("Error fetching equity", e);
      }
    };
    fetchEquity();
    iv = setInterval(fetchEquity, 10000);
    return () => iv && clearInterval(iv);
  }, [challengeId]);

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const currentLang = i18n.language ? i18n.language.split('-')[0] : 'fr';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-bold text-lg">T</div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">TradeSense</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive("/") ? "bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
            >
              {t('dashboard')}
            </Link>
            <Link
              to="/leaderboard"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive("/leaderboard") ? "bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
            >
              🏆 {t('leaderboard')}
            </Link>
            <Link
              to="/pricing"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive("/pricing") ? "bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
            >
              {t('pricing')}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mr-2 rtl:ml-2 rtl:mr-0">
            {['en', 'fr', 'ar'].map((lng) => (
              <button
                key={lng}
                onClick={() => changeLanguage(lng)}
                className={`px-2 py-1 text-[10px] font-bold rounded uppercase transition-all ${currentLang === lng ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                {lng}
              </button>
            ))}
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            aria-label="Toggle Dark Mode"
          >
            {theme === "dark" ? (
              <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            ) : (
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
            )}
          </button>

          {user ? (
            <>
              {!challengeId && (
                <button onClick={() => navigate("/pricing")} className="hidden sm:inline-flex px-3 py-1.5 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors">
                  + {t('challenge')}
                </button>
              )}

              <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-800 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-3">
                <div className="text-right rtl:text-left">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('equity')}</div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">{equity != null ? `$${equity.toFixed(2)}` : "-"}</div>
                </div>
              </div>

              <div className="relative group">
                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs cursor-pointer">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-100 dark:border-gray-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right rtl:right-auto rtl:left-0">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-sm truncate font-medium text-gray-900 dark:text-white text-xs">{user.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">ID: {challengeId || 'Inactive'}</p>
                  </div>
                  <button onClick={onLogout} className="w-full text-left rtl:text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-b-lg">
                    {t('logout')}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <Link to="/login" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/30">
              {t('login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
