import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    en: {
        translation: {
            "dashboard": "Dashboard",
            "leaderboard": "Leaderboard",
            "pricing": "Pricing",
            "logout": "Logout",
            "login": "Login",
            "buy": "Buy",
            "sell": "Sell",
            "balance": "Balance",
            "equity": "Equity",
            "challenge": "Challenge",
            "active": "ACTIVE",
            "passed": "PASSED",
            "failed": "FAILED",
            "quantity": "Quantity",
            "execute_order": "Execute Order",
            "recent_history": "Recent History",
            "trader": "Trader",
            "profit": "Profit",
            "trades": "Trades",
            "starting_balance": "Starting Balance",
            "daily_loss": "Daily Loss",
            "total_loss": "Total Loss",
            "profit_target": "Profit Target",
            "success": "Success",
            "error": "Error",
            "order_executed": "Order executed successfully!",
            "buy_challenge": "Buy a challenge",
            "observation_mode": "Observation Mode",
            "last_updated": "Last updated",
            "source": "Source"
        }
    },
    fr: {
        translation: {
            "dashboard": "Tableau de Bord",
            "leaderboard": "Classement",
            "pricing": "Tarification",
            "logout": "Déconnexion",
            "login": "Connexion",
            "buy": "Acheter",
            "sell": "Vendre",
            "balance": "Solde",
            "equity": "Équité",
            "challenge": "Défi",
            "active": "ACTIF",
            "passed": "RÉUSSI",
            "failed": "ÉCHOUÉ",
            "quantity": "Quantité",
            "execute_order": "Exécuter un ordre",
            "recent_history": "Historique Récent",
            "trader": "Trader",
            "profit": "Profit",
            "trades": "Trades",
            "starting_balance": "Solde Initial",
            "daily_loss": "Perte Journalière",
            "total_loss": "Perte Totale",
            "profit_target": "Objectif de Profit",
            "success": "Succès",
            "error": "Erreur",
            "order_executed": "Ordre exécuté avec succès !",
            "buy_challenge": "Acheter un challenge",
            "observation_mode": "Mode Observation",
            "last_updated": "Dernière mise à jour",
            "source": "Source"
        }
    },
    ar: {
        translation: {
            "dashboard": "لوحة التحكم",
            "leaderboard": "قائمة المتصدرين",
            "pricing": "الأسعار",
            "logout": "تسجيل الخروج",
            "login": "تسجيل الدخول",
            "buy": "شراء",
            "sell": "بيع",
            "balance": "الرصيد",
            "equity": "صافي القيمة",
            "challenge": "التحدي",
            "active": "نشط",
            "passed": "ناجح",
            "failed": "فاشل",
            "quantity": "الكمية",
            "execute_order": "تنفيذ الطلب",
            "recent_history": "السجل الأخير",
            "trader": "المتداول",
            "profit": "الربح",
            "trades": "الصفقات",
            "starting_balance": "رصيد البداية",
            "daily_loss": "الخسارة اليومية",
            "total_loss": "إجمالي الخسارة",
            "profit_target": "هدف الربح",
            "success": "نجاح",
            "error": "خطأ",
            "order_executed": "تم تنفيذ الطلب بنجاح!",
            "buy_challenge": "شراء تحدي",
            "observation_mode": "وضع المراقبة",
            "last_updated": "آخر تحديث",
            "source": "المصدر"
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'fr',
        interpolation: {
            escapeValue: false
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage']
        }
    });

// Handle RTL
i18n.on('languageChanged', (lng) => {
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
});

export default i18n;
