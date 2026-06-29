import { type CSSProperties, type FormEvent, useEffect, useState } from "react";
import { api, type User, type Workout } from "./api";
import { dir, type Locale, t } from "./i18n";

export function App() {
  const [locale, setLocale] = useState<Locale>("en");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir(locale);
  }, [locale]);

  useEffect(() => {
    api
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main style={wrap}>…</main>;

  return (
    <main style={wrap} dir={dir(locale)}>
      <header style={headerRow}>
        <strong>{t(locale, "app.name")}</strong>
        <button onClick={() => setLocale(locale === "en" ? "he" : "en")}>
          {t(locale, "lang.toggle")}
        </button>
      </header>
      {user ? (
        <Dashboard
          locale={locale}
          user={user}
          onLogout={() => void api.logout().then(() => setUser(null))}
        />
      ) : (
        <AuthForm locale={locale} onAuthed={setUser} />
      )}
    </main>
  );
}

function AuthForm({ locale, onAuthed }: { locale: Locale; onAuthed: (u: User) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const u =
        mode === "login" ? await api.login(email, password) : await api.signup(email, password);
      onAuthed(u);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <form onSubmit={submit} style={card}>
      <h1>{t(locale, mode === "login" ? "auth.signIn" : "auth.signUp")}</h1>
      <label style={field}>
        {t(locale, "auth.email")}
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label style={field}>
        {t(locale, "auth.password")}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </label>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <button type="submit">{t(locale, mode === "login" ? "auth.signIn" : "auth.signUp")}</button>
      <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
        {t(locale, mode === "login" ? "auth.noAccount" : "auth.haveAccount")}
      </button>
    </form>
  );
}

function Dashboard({
  locale,
  user,
  onLogout,
}: {
  locale: Locale;
  user: User;
  onLogout: () => void;
}) {
  const [sets, setSets] = useState(3);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  function refresh() {
    void api.listWorkouts().then(setWorkouts).catch(() => undefined);
  }

  useEffect(refresh, []);

  async function addWorkout() {
    await api.createWorkout([{ muscleGroup: "chest", sets, volume: sets * 800 }]);
    refresh();
  }

  return (
    <section style={card}>
      <p>
        {t(locale, "dash.welcome")}, {user.email}
      </p>
      <h2>{t(locale, "workout.log")}</h2>
      <label style={field}>
        {t(locale, "workout.sets")}
        <input
          type="number"
          min={1}
          value={sets}
          onChange={(e) => setSets(Number(e.target.value))}
        />
      </label>
      <button onClick={() => void addWorkout()}>{t(locale, "workout.add")}</button>
      <h3>{t(locale, "workout.recent")}</h3>
      <ul>
        {workouts.map((w) => (
          <li key={w.id}>
            {new Date(w.occurredAt).toLocaleDateString(locale)} · {w.efforts.length}{" "}
            {t(locale, "common.muscles")}
          </li>
        ))}
      </ul>
      <button onClick={onLogout}>{t(locale, "auth.logOut")}</button>
    </section>
  );
}

const wrap: CSSProperties = {
  maxWidth: 420,
  margin: "2rem auto",
  fontFamily: "system-ui, sans-serif",
  padding: "0 1rem",
};
const headerRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "1rem",
};
const card: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  border: "1px solid #ccc",
  borderRadius: 8,
  padding: 16,
};
const field: CSSProperties = { display: "flex", flexDirection: "column", gap: 4 };
