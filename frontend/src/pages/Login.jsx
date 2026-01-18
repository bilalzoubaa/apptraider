import React, { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // 'login' or 'register'
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { setUser, setChallengeId } = useContext(UserContext);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email || !password) {
        throw new Error("Veuillez remplir tous les champs.");
      }

      const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      // Use full URL or proxy will handle it. Assuming proxy set up in vite.config.js or similar
      // The user encountered 127.0.0.1:5000 connection refused earlier, so relative path /api handled by vite proxy is best.

      const res = await axios.post(url, { email, password });

      // Store user data
      localStorage.setItem("user", JSON.stringify(res.data));
      setUser(res.data);

      // Store challenge if exists
      if (res.data.active_challenge_id) {
        localStorage.setItem("userChallengeId", res.data.active_challenge_id);
        setChallengeId(res.data.active_challenge_id);
      } else {
        localStorage.removeItem("userChallengeId");
        setChallengeId(null);
      }

      // Redirect
      navigate("/");
    } catch (err) {
      console.error(err);
      if (err.response) {
        // Backend returned an error
        if (err.response.status === 401) {
          setError("Email ou mot de passe incorrect.");
        } else if (err.response.status === 400) {
          if (err.response.data.error === "exists") {
            setError("Cet email est déjà utilisé.");
          } else {
            setError("Données invalides.");
          }
        } else {
          setError(err.response.data?.message || "Une erreur est survenue sur le serveur.");
        }
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Impossible de se connecter au serveur.");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError(null);
    setEmail("");
    setPassword("");
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white dark:bg-gray-950">
      {/* Left Column: Form */}
      <div className="w-full md:w-1/2 lg:w-[45%] flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {mode === "login" ? "Bon retour parmi nous" : "Créer un compte"}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {mode === "login" ? "Connectez-vous pour accéder à votre dashboard" : "Rejoignez la nouvelle génération de traders"}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-8 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-800">
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-700 dark:text-red-400 text-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                {error}
              </div>
            )}

            <form onSubmit={submit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email professionnel</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                  </div>
                  <input
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="nom@exemple.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mot de passe</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <input
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand dark:bg-brand-dark hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand transition-all ${loading ? "opacity-75 cursor-not-allowed" : ""
                  }`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Connexion en cours...
                  </span>
                ) : (
                  "Valider"
                )}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">Ou</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="font-medium text-brand hover:text-brand-dark dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  {mode === "login" ? "Créer un nouveau compte" : "Se connecter à un compte existant"}
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            &copy; 2026 TradeSense. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Column: Image */}
      <div className="hidden md:flex w-1/2 lg:w-[55%] relative bg-gray-900">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/trading_bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-12 text-white">
          <div className="max-w-xl">
            <div className="h-1 w-20 bg-brand dark:bg-brand-dark mb-6 rounded-full"></div>
            <h3 className="text-4xl font-bold mb-4 leading-tight">Master the Markets with Professional Tools</h3>
            <p className="text-lg text-gray-200 leading-relaxed font-light opacity-90">
              Experience lightning-fast execution, real-time analytics, and advanced charting tailored for prop trading professionals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
