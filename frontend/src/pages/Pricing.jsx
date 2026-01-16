import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { UserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

// Icons
const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
);

const StarterIcon = () => (
  <svg className="w-12 h-12 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
);

const ProIcon = () => (
  <svg className="w-12 h-12 text-purple-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
);

const EliteIcon = () => (
  <svg className="w-12 h-12 text-amber-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
);

const CardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
);

const CryptoIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
);

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMethod, setLoadingMethod] = useState(null);
  const [paypal, setPaypal] = useState({ client_id: "", secret: "" });
  const { user, setChallengeId } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("/api/challenges/").then(r => {
      const wanted = ["Starter", "Pro", "Elite"];
      const order = { Starter: 0, Pro: 1, Elite: 2 };
      const filtered = r.data.filter(p => wanted.includes(p.name)).sort((a, b) => order[a.name] - order[b.name]);

      // Inject dummy features for display
      const featuresMap = {
        "Starter": ["Capital $5,000", "Levier 1:30", "Support Standard", "Dashboard Basique"],
        "Pro": ["Capital $10,000", "Levier 1:50", "Support Prioritaire", "Accès Signaux IA"],
        "Elite": ["Capital $20,000", "Levier 1:100", "Coach Dédié", "Signaux + Leaderboard VIP"]
      };

      const enhanced = filtered.map(p => ({
        ...p,
        features: featuresMap[p.name] || ["Accès Dashboard", "Support 24/7"]
      }));

      setPlans(enhanced);
    });
    axios.get("/api/payment/paypal-config").then(r => setPaypal(r.data));
  }, []);

  const checkout = async (plan, method) => {
    setLoading(true);
    setLoadingMethod(method);
    // Simulate processing
    await new Promise(r => setTimeout(r, 1200));

    if (!user) {
      alert("Veuillez vous connecter pour acheter un plan.");
      navigate("/login");
      return;
    }
    const userId = user.id;
    try {
      const res = await axios.post("/api/payment/checkout", { user_id: userId, challenge_id: plan.id, method });
      localStorage.setItem("userChallengeId", String(res.data.user_challenge_id));
      setChallengeId(res.data.user_challenge_id);

      // Use a nice toast or alert
      alert(`🎉 Félicitations ! Votre challenge ${plan.name} est activé.`);
      navigate("/");
    } catch (err) {
      alert("Une erreur est survenue lors du paiement.");
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMethod(null);
    }
  };

  const getIcon = (name) => {
    if (name === "Starter") return <StarterIcon />;
    if (name === "Pro") return <ProIcon />;
    if (name === "Elite") return <EliteIcon />;
    return <StarterIcon />;
  };

  const getBadge = (name) => {
    if (name === "Pro") return <span className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg shadow-sm uppercase tracking-wide">Populaire</span>;
    if (name === "Elite") return <span className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg shadow-sm uppercase tracking-wide">Meilleur choix</span>;
    return null;
  };

  return (
    <div className="py-12 bg-gray-50 dark:bg-gray-950 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-base font-semibold text-brand dark:text-blue-400 tracking-wide uppercase">Nos Offres</h2>
          <p className="mt-2 text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl">
            Choisissez votre Challenge
          </p>
          <p className="mt-4 text-xl text-gray-500 dark:text-gray-400">
            Commencez votre carrière de prop trader professionnel dès aujourd'hui avec nos plans financés.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col border ${plan.name === "Elite" ? "border-amber-200 dark:border-amber-900/50" : plan.name === "Pro" ? "border-purple-200 dark:border-purple-900/50" : "border-gray-200 dark:border-gray-800"}`}
            >
              {getBadge(plan.name)}

              <div className="p-8 flex-1">
                <div className="flex justify-center">
                  {getIcon(plan.name)}
                </div>
                <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price_dh} <span className="text-xl font-normal text-gray-500">DH</span></div>
                  <div className="text-sm text-gray-500 mt-1">Paiement unique</div>
                </div>

                <div className="flex items-center justify-center mb-8">
                  <span className="px-4 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-sm">
                    Solde géré : <span className="font-bold text-gray-900 dark:text-white">${plan.starting_balance.toLocaleString()}</span>
                  </span>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features && plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckIcon />
                      <span className="text-gray-600 dark:text-gray-300 text-sm">{feat}</span>
                    </li>
                  ))}
                  <li className="flex items-start">
                    <CheckIcon />
                    <span className="text-gray-600 dark:text-gray-300 text-sm">Objectif Profit {plan.profit_target_pct}%</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon />
                    <span className="text-gray-600 dark:text-gray-300 text-sm">Perte Max {plan.max_total_loss_pct}%</span>
                  </li>
                </ul>
              </div>

              <div className="p-8 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl border-t border-gray-100 dark:border-gray-800">
                <div className="space-y-3">
                  <button
                    onClick={() => checkout(plan, "cmi")}
                    disabled={loading}
                    className="w-full relative group flex items-center justify-center gap-3 px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                  >
                    <CardIcon />
                    {loading && loadingMethod === "cmi" ? "Traitement..." : "Payer par CMI"}
                  </button>

                  <button
                    onClick={() => checkout(plan, "crypto")}
                    disabled={loading}
                    className="w-full relative group flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <CryptoIcon />
                    {loading && loadingMethod === "crypto" ? "Traitement..." : "Payer par Crypto"}
                  </button>

                  {paypal.client_id && (
                    <button
                      onClick={() => checkout(plan, "paypal")}
                      disabled={loading}
                      className="w-full relative group flex items-center justify-center gap-3 px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-[#003087] hover:bg-[#00256b] transition-colors disabled:opacity-50"
                    >
                      <span className="font-bold italic">Pay</span><span className="italic">Pal</span>
                      {loading && loadingMethod === "paypal" ? "..." : ""}
                    </button>
                  )}
                </div>
                <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
                  Accès immédiat après paiement
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-8">Paiements sécurisés par</h3>
          <div className="flex justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all">
            {/* Simple text placeholders or svgs for trust badges */}
            <div className="flex items-center gap-2">
              <CardIcon /> <span className="font-bold text-gray-700 dark:text-gray-300">CMI</span>
            </div>
            <div className="flex items-center gap-2">
              <CryptoIcon /> <span className="font-bold text-gray-700 dark:text-gray-300">Binance Pay</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold italic text-[#003087] dark:text-blue-400">PayPal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
