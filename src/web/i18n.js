// Bilingual strings — Hebrew / English.
// Usage: i18n(key) returns the string for the current language.
// Language is set via setLang(). Components use data-i18n attributes
// that get re-rendered by applyI18n() on language switch.

const STRINGS = {
  en: {
    "nav.dashboard": "Dashboard",
    "nav.chat": "Chat",
    "nav.workouts": "Workouts",
    "nav.nutrition": "Nutrition",
    "nav.profile": "Profile",
    "dashboard.readiness": "Readiness",
    "dashboard.today": "Today",
    "dashboard.macros": "Daily Macros",
    "dashboard.lastWorkout": "Last Workout",
    "dashboard.achievement": "Latest PR",
    "dashboard.upcoming": "Upcoming",
    "dashboard.connectMotra": "Connect Motra for live workout data",
    "macro.protein": "Protein",
    "macro.carbs": "Carbs",
    "macro.fat": "Fat",
    "workouts.calendar": "Calendar",
    "workouts.history": "History",
    "workouts.stats": "Stats",
    "workouts.noData": "Connect Motra to see workout data",
    "workouts.loading": "Loading…",
    "nutrition.weightTrend": "Weight Trend (12 weeks)",
    "nutrition.todayLog": "Today's Log",
    "nutrition.askForSuggestions": "Ask for meal suggestions →",
    "nutrition.noLog": "No meals logged today. Chat to get suggestions.",
    "profile.metrics": "Your Metrics",
    "profile.name": "Name",
    "profile.weight": "Weight (kg)",
    "profile.height": "Height (cm)",
    "profile.bodyfat": "Body Fat %",
    "profile.age": "Age",
    "profile.goal": "Goal",
    "profile.save": "Save Changes",
    "profile.saved": "Saved ✓",
    "profile.targets": "Daily Targets",
    "profile.language": "Language",
    "profile.signOut": "Sign out",
    "profile.motra": "Motra Workouts",
    "profile.motraConnected": "Connected ✓",
    "profile.motraDisconnected": "Not connected",
    "profile.motraConnect": "Connect Motra",
    "profile.motraDisconnect": "Disconnect",
    "profile.motraPrivacy": "Workout data syncs via Anthropic (standard retention).",
    "goal.fatLoss": "Fat Loss",
    "goal.maintain": "Maintain",
    "goal.buildMuscle": "Build Muscle",
    "activity.sedentary": "Sedentary",
    "activity.light": "Lightly active",
    "activity.moderate": "Moderately active",
    "activity.high": "Very active",
    "chat.send": "Send",
    "chat.placeholder": "Ask about meals, training, targets…",
    "chat.greeting": "Hi! I'm your nutrition assistant. How can I help today?",
    "chat.newChat": "New chat",
    "readiness.great": "Great — go hard today",
    "readiness.good": "Good — train as planned",
    "readiness.moderate": "Moderate — consider lighter session",
    "readiness.low": "Low — rest or active recovery",
  },
  he: {
    "nav.dashboard": "דשבורד",
    "nav.chat": "צ'אט",
    "nav.workouts": "אימונים",
    "nav.nutrition": "תזונה",
    "nav.profile": "פרופיל",
    "dashboard.readiness": "מוכנות",
    "dashboard.today": "היום",
    "dashboard.macros": "מאקרו יומי",
    "dashboard.lastWorkout": "אימון אחרון",
    "dashboard.achievement": "שיא אחרון",
    "dashboard.upcoming": "הבא",
    "dashboard.connectMotra": "חבר את Motra לנתוני אימון חיים",
    "macro.protein": "חלבון",
    "macro.carbs": "פחמימות",
    "macro.fat": "שומן",
    "workouts.calendar": "לוח שנה",
    "workouts.history": "היסטוריה",
    "workouts.stats": "סטטיסטיקה",
    "workouts.noData": "חבר את Motra לצפייה בנתוני אימון",
    "workouts.loading": "טוען…",
    "nutrition.weightTrend": "מגמת משקל (12 שבועות)",
    "nutrition.todayLog": "יומן היום",
    "nutrition.askForSuggestions": "בקש הצעות לארוחות ←",
    "nutrition.noLog": "לא נרשמו ארוחות היום. שוחח לקבלת הצעות.",
    "profile.metrics": "הנתונים שלך",
    "profile.name": "שם",
    "profile.weight": "משקל (ק\"ג)",
    "profile.height": "גובה (ס\"מ)",
    "profile.bodyfat": "אחוז שומן",
    "profile.age": "גיל",
    "profile.goal": "מטרה",
    "profile.save": "שמור שינויים",
    "profile.saved": "נשמר ✓",
    "profile.targets": "יעדים יומיים",
    "profile.language": "שפה",
    "profile.signOut": "התנתק",
    "profile.motra": "אימוני Motra",
    "profile.motraConnected": "מחובר ✓",
    "profile.motraDisconnected": "לא מחובר",
    "profile.motraConnect": "חבר Motra",
    "profile.motraDisconnect": "נתק",
    "profile.motraPrivacy": "נתוני האימון מסונכרנים דרך Anthropic (שמירה רגילה).",
    "goal.fatLoss": "הורדת שומן",
    "goal.maintain": "שמירה",
    "goal.buildMuscle": "בניית שריר",
    "activity.sedentary": "יושבני",
    "activity.light": "פעיל קלות",
    "activity.moderate": "פעיל בינוני",
    "activity.high": "פעיל מאוד",
    "chat.send": "שלח",
    "chat.placeholder": "שאל על ארוחות, אימונים, יעדים…",
    "chat.greeting": "שלום! אני העוזר התזונתי שלך. איך אפשר לעזור היום?",
    "chat.newChat": "שיחה חדשה",
    "readiness.great": "מצוין — אפשר לדחוף חזק",
    "readiness.good": "טוב — אמן כמתוכנן",
    "readiness.moderate": "בינוני — שקול אימון קל יותר",
    "readiness.low": "נמוך — מנוחה או התאוששות פעילה",
  },
};

let _lang = "en";

export function setLang(lang) {
  _lang = lang === "he" ? "he" : "en";
  document.documentElement.lang = _lang;
  document.documentElement.dir = _lang === "he" ? "rtl" : "ltr";
  applyI18n();
}

export function getLang() { return _lang; }

export function i18n(key) {
  return STRINGS[_lang]?.[key] ?? STRINGS.en[key] ?? key;
}

export function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      el.placeholder = i18n(key);
    } else {
      el.textContent = i18n(key);
    }
  });
}
