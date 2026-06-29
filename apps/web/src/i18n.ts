// NOTE: duplicates packages/shared/src/i18n for now. Consolidate onto
// @teamzone/shared once that package is published as a built dependency that
// Vite + NestJS can both consume (tracked follow-up).

export type Locale = "en" | "he";
export type Direction = "ltr" | "rtl";

const catalogs: Record<Locale, Record<string, string>> = {
  en: {
    "app.name": "TeamZone",
    "auth.signIn": "Sign in",
    "auth.signUp": "Sign up",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.haveAccount": "Have an account? Sign in",
    "auth.noAccount": "New here? Sign up",
    "auth.logOut": "Log out",
    "dash.welcome": "Welcome",
    "lang.toggle": "עברית",
    "workout.log": "Log a workout",
    "workout.sets": "Sets",
    "workout.add": "Add workout",
    "workout.recent": "Recent workouts",
    "common.muscles": "muscle group(s)",
  },
  he: {
    "app.name": "TeamZone",
    "auth.signIn": "התחברות",
    "auth.signUp": "הרשמה",
    "auth.email": "אימייל",
    "auth.password": "סיסמה",
    "auth.haveAccount": "יש חשבון? התחברות",
    "auth.noAccount": "חדש כאן? הרשמה",
    "auth.logOut": "התנתקות",
    "dash.welcome": "ברוך הבא",
    "lang.toggle": "English",
    "workout.log": "רישום אימון",
    "workout.sets": "סטים",
    "workout.add": "הוספת אימון",
    "workout.recent": "אימונים אחרונים",
    "common.muscles": "קבוצות שריר",
  },
};

export function dir(locale: Locale): Direction {
  return locale === "he" ? "rtl" : "ltr";
}

export function t(locale: Locale, key: string): string {
  return catalogs[locale][key] ?? catalogs.en[key] ?? key;
}
